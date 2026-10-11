package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/beyenpay/beyen/gateway/infra/rediskey"
	"github.com/beyenpay/beyen/gateway/model"
)

// Session is the record stored under the session key. ID is the SHA-256 of the
// cookie value; it is the key suffix, so it is not part of the stored JSON.
type Session struct {
	ID         string           `json:"-"`
	UserID     int              `json:"uid"`
	SystemRole model.SystemRole `json:"role,omitempty"` // copied from the user at login
	IP         string           `json:"ip"`
	UserAgent  string           `json:"ua"`
	CreatedAt  int64            `json:"created_at"`   // unix seconds
	LastSeenAt int64            `json:"last_seen_at"` // unix seconds
	ExpiresAt  int64            `json:"expires_at"`   // unix seconds, absolute cap
}

// SessionRepo keeps two things in Redis: the session record per id, and a
// per-user index (sorted set, score = ExpiresAt, so oldest first) used to list
// sessions, cap their number and revoke them all.
type SessionRepo struct {
	rdb  *redis.Client
	keys rediskey.Keys
}

func NewSessionRepo(rdb *redis.Client, keys rediskey.Keys) *SessionRepo {
	return &SessionRepo{rdb: rdb, keys: keys}
}

// Create stores s and adds it to the user's index. ttl is the record lifetime;
// indexTTL keeps an abandoned index from living forever.
func (r *SessionRepo) Create(ctx context.Context, s *Session, ttl, indexTTL time.Duration) error {
	if ttl <= 0 || indexTTL <= 0 {
		return errors.New("create session: ttl must be positive") // a zero TTL would never expire
	}
	data, err := json.Marshal(s)
	if err != nil {
		return fmt.Errorf("marshal session: %w", err)
	}
	indexKey := r.keys.UserSessions(s.UserID)
	_, err = r.rdb.TxPipelined(ctx, func(p redis.Pipeliner) error {
		p.Set(ctx, r.keys.Session(s.ID), data, ttl)
		p.ZAdd(ctx, indexKey, redis.Z{Score: float64(s.ExpiresAt), Member: s.ID})
		p.Expire(ctx, indexKey, indexTTL)
		return nil
	})
	if err != nil {
		return fmt.Errorf("create session: %w", err)
	}
	return nil
}

// Get returns ErrNotFound when the session never existed or has expired.
func (r *SessionRepo) Get(ctx context.Context, id string) (*Session, error) {
	data, err := r.rdb.Get(ctx, r.keys.Session(id)).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get session: %w", err)
	}
	return decodeSession(id, data)
}

// Refresh rewrites the record and resets its TTL, only if the session still
// exists, so a concurrent logout is never undone.
func (r *SessionRepo) Refresh(ctx context.Context, s *Session, ttl time.Duration) error {
	if ttl <= 0 {
		return errors.New("refresh session: ttl must be positive")
	}
	data, err := json.Marshal(s)
	if err != nil {
		return fmt.Errorf("marshal session: %w", err)
	}
	err = r.rdb.SetXX(ctx, r.keys.Session(s.ID), data, ttl).Err()
	if err != nil && !errors.Is(err, redis.Nil) {
		return fmt.Errorf("refresh session: %w", err)
	}
	return nil
}

// Delete removes one session and its index entry.
func (r *SessionRepo) Delete(ctx context.Context, userID int, id string) error {
	_, err := r.rdb.TxPipelined(ctx, func(p redis.Pipeliner) error {
		p.Del(ctx, r.keys.Session(id))
		p.ZRem(ctx, r.keys.UserSessions(userID), id)
		return nil
	})
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	return nil
}

// Owns reports whether id is in the user's index.
func (r *SessionRepo) Owns(ctx context.Context, userID int, id string) (bool, error) {
	_, err := r.rdb.ZScore(ctx, r.keys.UserSessions(userID), id).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("check session owner: %w", err)
	}
	return true, nil
}

// List returns the user's live sessions, newest first. Index entries whose
// record has expired are skipped; Trim removes them later.
func (r *SessionRepo) List(ctx context.Context, userID int) ([]*Session, error) {
	ids, err := r.rdb.ZRevRange(ctx, r.keys.UserSessions(userID), 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("list session index: %w", err)
	}
	if len(ids) == 0 {
		return nil, nil
	}
	keys := make([]string, len(ids))
	for i, id := range ids {
		keys[i] = r.keys.Session(id)
	}
	vals, err := r.rdb.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, fmt.Errorf("load sessions: %w", err)
	}
	out := make([]*Session, 0, len(vals))
	for i, v := range vals {
		str, ok := v.(string)
		if !ok { // nil: the record has expired
			continue
		}
		s, err := decodeSession(ids[i], []byte(str))
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, nil
}

// DeleteAll removes every session of the user except keepID (may be empty).
func (r *SessionRepo) DeleteAll(ctx context.Context, userID int, keepID string) error {
	indexKey := r.keys.UserSessions(userID)
	ids, err := r.rdb.ZRange(ctx, indexKey, 0, -1).Result()
	if err != nil {
		return fmt.Errorf("list session index: %w", err)
	}
	var members []any
	var keys []string
	for _, id := range ids {
		if id == keepID {
			continue
		}
		members = append(members, id)
		keys = append(keys, r.keys.Session(id))
	}
	if len(members) == 0 {
		return nil
	}
	_, err = r.rdb.TxPipelined(ctx, func(p redis.Pipeliner) error {
		p.Del(ctx, keys...)
		p.ZRem(ctx, indexKey, members...)
		return nil
	})
	if err != nil {
		return fmt.Errorf("delete sessions: %w", err)
	}
	return nil
}

// Trim drops index entries whose record has expired, then deletes the oldest
// live sessions beyond max. Call it after Create.
func (r *SessionRepo) Trim(ctx context.Context, userID, max int) error {
	indexKey := r.keys.UserSessions(userID)
	ids, err := r.rdb.ZRange(ctx, indexKey, 0, -1).Result() // oldest first
	if err != nil {
		return fmt.Errorf("list session index: %w", err)
	}
	if len(ids) == 0 {
		return nil
	}

	exists := make([]*redis.IntCmd, len(ids))
	_, err = r.rdb.Pipelined(ctx, func(p redis.Pipeliner) error {
		for i, id := range ids {
			exists[i] = p.Exists(ctx, r.keys.Session(id))
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("check sessions: %w", err)
	}

	var live []string
	var remove []any // index members to drop: expired ones plus evicted ones
	for i, id := range ids {
		if exists[i].Val() == 1 {
			live = append(live, id)
		} else {
			remove = append(remove, id)
		}
	}
	var evictKeys []string
	if n := len(live) - max; n > 0 {
		for _, id := range live[:n] {
			remove = append(remove, id)
			evictKeys = append(evictKeys, r.keys.Session(id))
		}
	}
	if len(remove) == 0 {
		return nil
	}

	_, err = r.rdb.TxPipelined(ctx, func(p redis.Pipeliner) error {
		if len(evictKeys) > 0 {
			p.Del(ctx, evictKeys...)
		}
		p.ZRem(ctx, indexKey, remove...)
		return nil
	})
	if err != nil {
		return fmt.Errorf("trim sessions: %w", err)
	}
	return nil
}

func decodeSession(id string, data []byte) (*Session, error) {
	var s Session
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("decode session: %w", err)
	}
	s.ID = id
	return &s, nil
}
