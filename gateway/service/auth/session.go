package auth

import (
	"context"
	"errors"
	"time"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/pkg/token"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/x/logger"
)

// A session is rewritten (last seen, fresh TTL) at most this often, so a
// request does not turn into a Redis write every time.
const touchInterval = 10 * time.Minute

// ttl is how long a record may live from now: the idle window, but never
// beyond the absolute cap. Redis expiry therefore enforces both limits.
func (s *Service) ttl(expiresAt int64, now time.Time) time.Duration {
	return min(s.cfg.Idle(), time.Unix(expiresAt, 0).Sub(now))
}

// Authenticate resolves a cookie value to a Principal. It returns ErrNoSession
// when the value is empty, unknown, expired or revoked; any other error means
// the lookup itself failed.
func (s *Service) Authenticate(ctx context.Context, tok string) (*Principal, error) {
	if tok == "" {
		return nil, ErrNoSession
	}
	id := token.Hash(tok)
	rec, err := s.sessions.Get(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrNoSession
	}
	if err != nil {
		return nil, err
	}

	now := time.Now()
	if !now.Before(time.Unix(rec.ExpiresAt, 0)) {
		if err := s.sessions.Delete(ctx, rec.UserID, id); err != nil {
			logger.Error("delete expired session failed", zap.Error(err))
		}
		return nil, ErrNoSession
	}

	if now.Unix()-rec.LastSeenAt >= int64(touchInterval/time.Second) {
		rec.LastSeenAt = now.Unix()
		if err := s.sessions.Refresh(ctx, rec, s.ttl(rec.ExpiresAt, now)); err != nil {
			logger.Error("refresh session failed", zap.Error(err)) // the request itself is still valid
		}
	}
	return &Principal{UserID: rec.UserID, SystemRole: rec.SystemRole, SessionID: id}, nil
}

// Logout ends the caller's own session.
func (s *Service) Logout(ctx context.Context, p *Principal) error {
	return s.sessions.Delete(ctx, p.UserID, p.SessionID)
}

type SessionInfo struct {
	ID         string // safe to show; it cannot be turned back into a cookie value
	IP         string
	UserAgent  string
	CreatedAt  int64
	LastSeenAt int64
	Current    bool
}

// ListSessions returns the caller's live sessions, newest first.
func (s *Service) ListSessions(ctx context.Context, p *Principal) ([]SessionInfo, error) {
	recs, err := s.sessions.List(ctx, p.UserID)
	if err != nil {
		return nil, err
	}
	out := make([]SessionInfo, len(recs))
	for i, r := range recs {
		out[i] = SessionInfo{
			ID: r.ID, IP: r.IP, UserAgent: r.UserAgent,
			CreatedAt: r.CreatedAt, LastSeenAt: r.LastSeenAt,
			Current: r.ID == p.SessionID,
		}
	}
	return out, nil
}

// RevokeSession ends one of the user's sessions. An id that is not theirs
// reports ErrSessionNotFound, the same as one that does not exist.
func (s *Service) RevokeSession(ctx context.Context, userID int, id string) error {
	owns, err := s.sessions.Owns(ctx, userID, id)
	if err != nil {
		return err
	}
	if !owns {
		return ErrSessionNotFound
	}
	return s.sessions.Delete(ctx, userID, id)
}

// RevokeAll ends every session of the user except keepID (empty to end all).
// Call it after the user's password, status or system role changes.
func (s *Service) RevokeAll(ctx context.Context, userID int, keepID string) error {
	return s.sessions.DeleteAll(ctx, userID, keepID)
}
