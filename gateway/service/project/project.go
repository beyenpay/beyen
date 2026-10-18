// Package project holds the rules for creating projects and managing who
// belongs to them. It is shared by the setup command and, later, the console.
package project

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/pkg/email"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/x/logger"
)

const maxNameLen = 128 // characters; the projects.name column size

var (
	ErrInvalidName     = errors.New("project name must be 1 to 128 characters")
	ErrInvalidRole     = errors.New("invalid project role")
	ErrProjectNotFound = errors.New("project not found")
	ErrUserNotFound    = errors.New("user not found")
	ErrAlreadyMember   = errors.New("user is already a member of the project")
	ErrAdminCannotJoin = errors.New("a platform admin cannot be a project member")
)

type Service struct {
	projects *repository.ProjectRepo
	members  *repository.ProjectMemberRepo
	users    *repository.UserRepo
	authz    *authz.Service // to drop cached decisions after a write
}

func New(projects *repository.ProjectRepo, members *repository.ProjectMemberRepo, users *repository.UserRepo, authz *authz.Service) *Service {
	return &Service{projects: projects, members: members, users: users, authz: authz}
}

// Create stores a new active project.
func (s *Service) Create(ctx context.Context, name string) (*model.Project, error) {
	name = strings.TrimSpace(name)
	if n := utf8.RuneCountInString(name); n < 1 || n > maxNameLen {
		return nil, ErrInvalidName
	}

	p := &model.Project{Name: name, Status: model.ProjectStatusActive}
	if err := s.projects.Create(ctx, p); err != nil {
		return nil, err
	}

	// A probe of this id may have cached "no such project" a moment ago.
	if err := s.authz.InvalidateProject(ctx, p.ID); err != nil {
		logger.Error("invalidate project cache failed", zap.Int("project_id", p.ID), zap.Error(err))
	}
	return p, nil
}

// AddMember makes an existing user a member of the project with the given role.
func (s *Service) AddMember(ctx context.Context, projectID int, addr string, role model.ProjectRole) (*model.ProjectMember, error) {
	if !role.Valid() {
		return nil, ErrInvalidRole
	}

	p, err := s.projects.GetByID(ctx, projectID)
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return nil, ErrProjectNotFound
	case err != nil:
		return nil, err
	case p.Status == model.ProjectStatusDeleted:
		return nil, ErrProjectNotFound
	}

	u, err := s.users.GetByEmail(ctx, email.Normalize(addr))
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return nil, ErrUserNotFound
	case err != nil:
		return nil, err
	}

	// An admin already holds every permission in every project, so a project
	// role on top of it would only conflict with that.
	if u.SystemRole == model.SystemRoleAdmin {
		return nil, ErrAdminCannotJoin
	}

	m := &model.ProjectMember{ProjectID: projectID, UserID: u.ID, Role: role}
	if err := s.members.Create(ctx, m); err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			return nil, ErrAlreadyMember
		}
		return nil, err
	}

	// The data is already saved, so a cache failure is logged, not returned.
	// Without this, a "not a member" answer cached earlier would hide the new role for up to 30s.
	if err := s.authz.InvalidateMember(ctx, projectID, u.ID); err != nil {
		logger.Error("invalidate member cache failed",
			zap.Int("project_id", projectID), zap.Int("user_id", u.ID), zap.Error(err))
	}
	return m, nil
}
