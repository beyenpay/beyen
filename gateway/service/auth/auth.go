// Package auth answers "who is calling": login, and the lifecycle of the
// console session. What the caller may do is decided by service/authz.
package auth

import (
	"errors"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrAccountDisabled    = errors.New("account is disabled")
	ErrTooManyAttempts    = errors.New("too many login attempts")
	ErrNoSession          = errors.New("no valid session")
	ErrSessionNotFound    = errors.New("session not found")
)

// Principal is the authenticated caller, resolved from a session.
type Principal struct {
	UserID     int
	SystemRole model.SystemRole // empty for a normal user
	SessionID  string           // SHA-256 of the cookie value, safe to expose
}

type Service struct {
	cfg      config.Session
	users    *repository.UserRepo
	sessions *repository.SessionRepo
	limiter  *ratelimit.Limiter
}

func New(cfg config.Session, users *repository.UserRepo, sessions *repository.SessionRepo, limiter *ratelimit.Limiter) *Service {
	return &Service{cfg: cfg, users: users, sessions: sessions, limiter: limiter}
}
