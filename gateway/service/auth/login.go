package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/email"
	"github.com/beyenpay/beyen/gateway/pkg/password"
	"github.com/beyenpay/beyen/gateway/pkg/token"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/x/logger"
)

// Attempts per email, on top of the per-IP limit applied on the route.
var loginEmailRule = ratelimit.Rule{Max: 10, Window: 15 * time.Minute}

const maxUserAgentLen = 256

type LoginInput struct {
	Email     string
	Password  string
	IP        string
	UserAgent string
}

type LoginResult struct {
	User      *model.User
	Token     string // the cookie value; shown to the client once, never stored
	ExpiresAt int64  // unix seconds, absolute cap of the session
}

// Login checks the credentials and opens a new session. It always issues a
// fresh session id, so an id sent by the client is never reused.
func (s *Service) Login(ctx context.Context, in LoginInput) (*LoginResult, error) {
	addr := email.Normalize(in.Email)

	// Hash the email so the address never appears in Redis keys.
	switch res, err := s.limiter.Allow(ctx, "login-email", token.Hash(addr), loginEmailRule); {
	case err != nil:
		logger.Error("login rate limit check failed, letting request through", zap.Error(err)) // fail open
	case !res.Allowed:
		return nil, ErrTooManyAttempts
	}

	user, err := s.users.GetByEmail(ctx, addr)
	if errors.Is(err, repository.ErrNotFound) {
		password.DummyVerify(in.Password) // same cost as a real check, so timing does not reveal the email
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	ok, err := password.Verify(in.Password, user.PasswordHash)
	if err != nil {
		return nil, fmt.Errorf("verify password: %w", err)
	}
	if !ok {
		return nil, ErrInvalidCredentials
	}
	if user.Status != model.UserStatusActive {
		return nil, ErrAccountDisabled // only reached with the right password
	}

	if password.NeedsRehash(user.PasswordHash) {
		s.rehash(ctx, user.ID, in.Password)
	}

	now := time.Now()
	tok := token.New()
	ua := in.UserAgent
	if len(ua) > maxUserAgentLen {
		ua = ua[:maxUserAgentLen]
	}
	rec := &repository.Session{
		ID:         token.Hash(tok),
		UserID:     user.ID,
		SystemRole: user.SystemRole,
		IP:         in.IP,
		UserAgent:  ua,
		CreatedAt:  now.Unix(),
		LastSeenAt: now.Unix(),
		ExpiresAt:  now.Add(s.cfg.Absolute()).Unix(),
	}
	if err := s.sessions.Create(ctx, rec, s.ttl(rec.ExpiresAt, now), s.cfg.Absolute()); err != nil {
		return nil, err
	}
	if err := s.sessions.Trim(ctx, user.ID, s.cfg.MaxPerUser); err != nil {
		logger.Error("trim sessions failed", zap.Int("user_id", user.ID), zap.Error(err))
	}

	return &LoginResult{User: user, Token: tok, ExpiresAt: rec.ExpiresAt}, nil
}

// rehash upgrades an old hash after a successful login. Failures are only
// logged: the login itself has already succeeded.
func (s *Service) rehash(ctx context.Context, userID int, plain string) {
	hash, err := password.Hash(plain)
	if err == nil {
		err = s.users.UpdatePasswordHash(ctx, userID, hash)
	}
	if err != nil {
		logger.Error("password rehash failed", zap.Int("user_id", userID), zap.Error(err))
	}
}
