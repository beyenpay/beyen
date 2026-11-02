package user

import (
	"context"
	"errors"
	"fmt"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/email"
	"github.com/beyenpay/beyen/gateway/pkg/password"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/x/logger"
)

// SessionRevoker ends every login of a user. auth.Service is one.
type SessionRevoker interface {
	RevokeAll(ctx context.Context, userID int, keepID string) error
}

// ProfileInvalidator drops what is cached about a user. me.Service is one.
type ProfileInvalidator interface {
	Invalidate(ctx context.Context, userID int) error
}

type Option func(*Service)

func WithSessions(r SessionRevoker) Option     { return func(s *Service) { s.sessions = r } }
func WithProfiles(p ProfileInvalidator) Option { return func(s *Service) { s.profiles = p } }

// A session carries the role it was opened with and nothing re-checks the
// status, so after the role, the status or the password of a user changes,
// their old logins must be ended here or they keep working.
func (s *Service) endSessions(ctx context.Context, id int) error {
	if s.sessions == nil {
		return nil
	}
	if err := s.sessions.RevokeAll(ctx, id, ""); err != nil {
		return fmt.Errorf("revoke sessions: %w", err)
	}
	return nil
}

// forget drops the cached profile. The cache expires by itself, so a failure
// is only logged.
func (s *Service) forget(ctx context.Context, id int) {
	if s.profiles == nil {
		return
	}
	if err := s.profiles.Invalidate(ctx, id); err != nil {
		logger.Error("invalidate user profile failed", zap.Int("user_id", id), zap.Error(err))
	}
}

// fromRepo turns the repository's errors into this package's.
func fromRepo(err error) error {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return ErrNotFound
	case errors.Is(err, repository.ErrDuplicate):
		return ErrEmailTaken
	}
	return err
}

func isActiveAdmin(u *model.User) bool {
	return u.SystemRole == model.SystemRoleAdmin && u.Status == model.UserStatusActive
}

// UpdateInput is a partial change: nil leaves a field as it is. Status can only
// be set to active or disabled; deleting and restoring have their own calls.
type UpdateInput struct {
	ID         int
	ActorID    int // who asks; nobody may lock themselves out
	Email      *string
	SystemRole *model.SystemRole // pointer to "" means a normal user
	Status     *model.UserStatus
	Comment    *string
}

// Update edits a user. ErrNotFound, ErrUserDeleted (a deleted user is read
// only until restored), ErrEmailTaken, ErrSelfChange (role or status of the
// caller's own account), ErrLastAdmin, and the ErrInvalid* errors say why not.
func (s *Service) Update(ctx context.Context, in UpdateInput) (*model.User, error) {
	var addr, comment string
	var err error
	if in.Email != nil {
		if addr = email.Normalize(*in.Email); !email.Valid(addr) {
			return nil, ErrInvalidEmail
		}
	}
	if in.SystemRole != nil && *in.SystemRole != "" && !in.SystemRole.Valid() {
		return nil, ErrInvalidRole
	}
	if in.Status != nil && *in.Status != model.UserStatusActive && *in.Status != model.UserStatusDisabled {
		return nil, ErrInvalidStatus
	}
	if in.Comment != nil {
		if comment, err = normalizeComment(*in.Comment); err != nil {
			return nil, err
		}
	}

	u, err := s.users.Mutate(ctx, in.ID, func(u *model.User, otherAdmins int) (bool, error) {
		if u.Status == model.UserStatusDeleted {
			return false, ErrUserDeleted
		}
		wasAdmin := isActiveAdmin(u)
		self := in.ActorID == u.ID
		changed := false

		if in.Email != nil && addr != u.Email {
			u.Email, changed = addr, true
		}
		if in.Comment != nil && comment != u.Comment {
			u.Comment, changed = comment, true
		}
		if in.SystemRole != nil && *in.SystemRole != u.SystemRole {
			if self {
				return false, ErrSelfChange
			}
			u.SystemRole, changed = *in.SystemRole, true
		}
		if in.Status != nil && *in.Status != u.Status {
			if self {
				return false, ErrSelfChange
			}
			u.Status, changed = *in.Status, true
		}

		if wasAdmin && !isActiveAdmin(u) && otherAdmins == 0 {
			return false, ErrLastAdmin
		}
		return changed, nil
	})
	if err != nil {
		return nil, fromRepo(err)
	}

	// Asked for, not only changed: a retry after a failed revoke must revoke again.
	// The caller's own sessions stay: their role and status cannot change here.
	if (in.SystemRole != nil || in.Status != nil) && in.ActorID != u.ID {
		if err := s.endSessions(ctx, u.ID); err != nil {
			return nil, err
		}
	}
	s.forget(ctx, u.ID)
	return u, nil
}

// Delete marks a user deleted: they can no longer sign in and their sessions
// end, but the row stays, because other records point at it. The email stays
// taken, and Restore brings the account back. Deleting a deleted user is a
// no-op that still ends their sessions.
func (s *Service) Delete(ctx context.Context, id, actorID int) error {
	if id == actorID {
		return ErrSelfChange
	}
	_, err := s.users.Mutate(ctx, id, func(u *model.User, otherAdmins int) (bool, error) {
		if u.Status == model.UserStatusDeleted {
			return false, nil
		}
		if isActiveAdmin(u) && otherAdmins == 0 {
			return false, ErrLastAdmin
		}
		u.Status = model.UserStatusDeleted
		return true, nil
	})
	if err != nil {
		return fromRepo(err)
	}
	if err := s.endSessions(ctx, id); err != nil {
		return err
	}
	s.forget(ctx, id)
	return nil
}

// Restore makes a deleted user active again. Restoring a user who is not
// deleted changes nothing, so a double click or a stale page is harmless.
func (s *Service) Restore(ctx context.Context, id int) (*model.User, error) {
	u, err := s.users.Mutate(ctx, id, func(u *model.User, _ int) (bool, error) {
		if u.Status != model.UserStatusDeleted {
			return false, nil
		}
		u.Status = model.UserStatusActive
		return true, nil
	})
	if err != nil {
		return nil, fromRepo(err)
	}
	s.forget(ctx, id)
	return u, nil
}

// ResetPassword sets a new password chosen by an admin and ends the user's
// logins. ErrWeakPassword wraps the reason. The caller's own password is not
// reset here: that is for the account's own flow.
func (s *Service) ResetPassword(ctx context.Context, id, actorID int, plain string) error {
	if id == actorID {
		return ErrSelfChange
	}
	// Read first, so the slow hash runs outside the row lock.
	u, err := s.users.GetByID(ctx, id)
	if err != nil {
		return fromRepo(err)
	}
	if u.Status == model.UserStatusDeleted {
		return ErrUserDeleted
	}
	if err := validatePassword(u.Email, plain); err != nil {
		return fmt.Errorf("%w: %s", ErrWeakPassword, err)
	}
	hash, err := password.Hash(plain)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	_, err = s.users.Mutate(ctx, id, func(u *model.User, _ int) (bool, error) {
		if u.Status == model.UserStatusDeleted { // deleted since the read above
			return false, ErrUserDeleted
		}
		u.PasswordHash = hash
		return true, nil
	})
	if err != nil {
		return fromRepo(err)
	}
	return s.endSessions(ctx, id)
}
