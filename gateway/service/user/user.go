// Package user holds the account rules shared by every way a user is created
// or changed: the setup command, admin invitations, self-service.
package user

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/email"
	"github.com/beyenpay/beyen/gateway/pkg/password"
	"github.com/beyenpay/beyen/gateway/repository"
)

var (
	ErrInvalidEmail = errors.New("invalid email address")
	ErrEmailTaken   = errors.New("email is already registered")
	ErrInvalidRole  = errors.New("invalid system role")
	ErrWeakPassword = errors.New("weak password") // wrapped with the reason
	ErrNotFound     = errors.New("user not found")
)

type Service struct {
	users *repository.UserRepo
}

func New(users *repository.UserRepo) *Service { return &Service{users: users} }

type CreateInput struct {
	Email      string
	Password   string
	SystemRole model.SystemRole // empty for a normal user
}

// Create validates the input and stores a new active user. Callers decide who
// may call it and which SystemRole they may grant.
func (s *Service) Create(ctx context.Context, in CreateInput) (*model.User, error) {
	addr := email.Normalize(in.Email)
	if !email.Valid(addr) {
		return nil, ErrInvalidEmail
	}
	if in.SystemRole != "" && !in.SystemRole.Valid() {
		return nil, ErrInvalidRole
	}
	if err := validatePassword(addr, in.Password); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrWeakPassword, err)
	}

	hash, err := password.Hash(in.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	u := &model.User{
		Email:        addr,
		PasswordHash: hash,
		Status:       model.UserStatusActive,
		SystemRole:   in.SystemRole,
	}
	if err := s.users.Create(ctx, u); err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	return u, nil
}

// Get returns ErrNotFound when the user does not exist.
func (s *Service) Get(ctx context.Context, id int) (*model.User, error) {
	u, err := s.users.GetByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrNotFound
	}
	return u, err
}

// validatePassword applies the password policy plus one rule that needs the
// email: the password must not contain the name part of it.
func validatePassword(addr, plain string) error {
	if err := password.Validate(plain); err != nil {
		return err
	}
	if local, _, _ := strings.Cut(addr, "@"); len(local) >= 4 && strings.Contains(strings.ToLower(plain), local) {
		return errors.New("password must not contain the email name")
	}
	return nil
}
