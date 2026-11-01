// Package user holds the account rules shared by every way a user is created
// or changed: the setup command, admin invitations, self-service.
package user

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/email"
	"github.com/beyenpay/beyen/gateway/pkg/password"
	"github.com/beyenpay/beyen/gateway/repository"
)

var (
	ErrInvalidEmail   = errors.New("invalid email address")
	ErrEmailTaken     = errors.New("email is already registered")
	ErrInvalidRole    = errors.New("invalid system role")
	ErrWeakPassword   = errors.New("weak password") // wrapped with the reason
	ErrNotFound       = errors.New("user not found")
	ErrSetupCompleted = errors.New("setup already completed")
)

type Service struct {
	users   *repository.UserRepo
	setupMu sync.Mutex // serializes first-admin creation within this process
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

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

// ListInput is a page request plus optional filters; zero means "no condition".
type ListInput struct {
	Page, PageSize int
	Email          string // substring, or the whole address when EmailExact
	EmailExact     bool
	Status         model.UserStatus
	Roles          []string // any of "admin", "user"; empty means any
	CreatedFrom    int64
	CreatedTo      int64
}

type ListResult struct {
	Users          []model.User
	Total          int64
	Page, PageSize int // after clamping, as actually applied
}

// List returns one page of users, newest first.
func (s *Service) List(ctx context.Context, in ListInput) (*ListResult, error) {
	if in.Page < 1 {
		in.Page = 1
	}
	if in.PageSize < 1 {
		in.PageSize = defaultPageSize
	}
	in.PageSize = min(in.PageSize, maxPageSize)

	users, total, err := s.users.List(ctx, repository.UserFilter{
		Email:       email.Normalize(in.Email),
		EmailExact:  in.EmailExact,
		Status:      in.Status,
		Roles:       in.Roles,
		CreatedFrom: in.CreatedFrom,
		CreatedTo:   in.CreatedTo,
	}, (in.Page-1)*in.PageSize, in.PageSize)
	if err != nil {
		return nil, err
	}
	return &ListResult{Users: users, Total: total, Page: in.Page, PageSize: in.PageSize}, nil
}

// NeedsSetup reports whether no user exists yet, i.e. the first admin is still to be created.
func (s *Service) NeedsSetup(ctx context.Context) (bool, error) {
	n, err := s.users.Count(ctx)
	if err != nil {
		return false, err
	}
	return n == 0, nil
}

// CreateFirstAdmin creates the platform admin of a fresh system. It returns
// ErrSetupCompleted once any user exists. The lock only covers this process;
// that is enough for a single gateway, and a second instance racing the very
// first request would still be stopped by the unique email index for the same
// address.
func (s *Service) CreateFirstAdmin(ctx context.Context, addr, plain string) (*model.User, error) {
	s.setupMu.Lock()
	defer s.setupMu.Unlock()

	need, err := s.NeedsSetup(ctx)
	if err != nil {
		return nil, err
	}
	if !need {
		return nil, ErrSetupCompleted
	}
	return s.Create(ctx, CreateInput{Email: addr, Password: plain, SystemRole: model.SystemRoleAdmin})
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
