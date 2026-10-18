// Package me builds what the console needs right after login and on every
// refresh: who the caller is and what they may do, in one call.
package me

import (
	"context"
	"errors"
	"time"

	"github.com/beyenpay/beyen/gateway/infra/rediskey"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/repository"
)

// cacheTTL is the backstop for a missed invalidation. Keep it short.
const cacheTTL = 10 * time.Minute

var ErrUserNotFound = errors.New("user not found")

type Service struct {
	users    *repository.UserRepo
	projects *repository.ProjectRepo
	members  *repository.ProjectMemberRepo
	cache    *repository.Cache
	keys     rediskey.Keys
}

func New(users *repository.UserRepo, projects *repository.ProjectRepo, members *repository.ProjectMemberRepo, cache *repository.Cache, keys rediskey.Keys) *Service {
	return &Service{users: users, projects: projects, members: members, cache: cache, keys: keys}
}

// snapshot is what gets cached: facts only. Permissions are derived from the
// roles on every call, so changing the role-to-permission map needs no flush.
type snapshot struct {
	Email    string            `json:"email"`
	Projects []snapshotProject `json:"projects"`
}

type snapshotProject struct {
	ID     int                 `json:"id"`
	Name   string              `json:"name"`
	Status model.ProjectStatus `json:"status"`
	Role   model.ProjectRole   `json:"role"`
}

// projectBrief is one entry of the admin's project list, cached under
// rediskey.ProjectList and dropped by authz.InvalidateProject.
type projectBrief struct {
	ID     int                 `json:"id"`
	Name   string              `json:"name"`
	Status model.ProjectStatus `json:"status"`
}

// View is the caller's profile and standing.
type View struct {
	UserID     int
	Email      string
	SystemRole model.SystemRole
	// System holds the permissions of the system role. For an admin it also
	// contains every project permission, which apply to any project.
	System []permission.Permission
	// Projects are the user's memberships. For an admin it is every project,
	// without role or permissions: the rights come from System.
	Projects []ProjectView
}

// ProjectView is the caller's standing in one project.
type ProjectView struct {
	ID          int
	Name        string
	Status      model.ProjectStatus
	Role        model.ProjectRole
	Permissions []permission.Permission // empty unless the project is active
}

// Get returns ErrUserNotFound when the user no longer exists. sysRole comes
// from the session, the same source RequireSystem trusts.
func (s *Service) Get(ctx context.Context, userID int, sysRole model.SystemRole) (*View, error) {
	snap, err := repository.Remember(ctx, s.cache, s.keys.UserMe(userID), cacheTTL,
		func(ctx context.Context) (snapshot, error) { return s.load(ctx, userID) })
	if err != nil {
		return nil, err
	}

	v := &View{
		UserID:     userID,
		Email:      snap.Email,
		SystemRole: sysRole,
		System:     permission.SystemRolePermissions(sysRole),
	}

	// An admin is never a project member and reaches every project through the
	// system role, so the list is all projects, with no role and no permissions.
	if sysRole == model.SystemRoleAdmin {
		all, err := repository.Remember(ctx, s.cache, s.keys.ProjectList(), cacheTTL, s.loadAllProjects)
		if err != nil {
			return nil, err
		}
		v.Projects = make([]ProjectView, len(all))
		for i, p := range all {
			v.Projects[i] = ProjectView{ID: p.ID, Name: p.Name, Status: p.Status}
		}
		return v, nil
	}

	v.Projects = make([]ProjectView, len(snap.Projects))
	for i, p := range snap.Projects {
		pv := ProjectView{ID: p.ID, Name: p.Name, Status: p.Status, Role: p.Role}
		if p.Status == model.ProjectStatusActive {
			pv.Permissions = permission.ProjectRolePermissions(p.Role)
		}
		v.Projects[i] = pv
	}
	return v, nil
}

// Invalidate drops the cached snapshot. Call it after the user's own data
// changes, such as the email. Membership and project changes are handled by authz.
func (s *Service) Invalidate(ctx context.Context, userID int) error {
	return s.cache.Del(ctx, s.keys.UserMe(userID))
}

// load reads MySQL: two queries.
func (s *Service) load(ctx context.Context, userID int) (snapshot, error) {
	u, err := s.users.GetByID(ctx, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return snapshot{}, ErrUserNotFound
	}
	if err != nil {
		return snapshot{}, err
	}
	rows, err := s.members.ListByUser(ctx, userID)
	if err != nil {
		return snapshot{}, err
	}
	snap := snapshot{Email: u.Email, Projects: make([]snapshotProject, len(rows))}
	for i, r := range rows {
		snap.Projects[i] = snapshotProject{ID: r.ProjectID, Name: r.Name, Status: r.Status, Role: r.Role}
	}
	return snap, nil
}

// loadAllProjects reads MySQL: one query.
func (s *Service) loadAllProjects(ctx context.Context) ([]projectBrief, error) {
	rows, err := s.projects.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]projectBrief, len(rows))
	for i, r := range rows {
		out[i] = projectBrief{ID: r.ID, Name: r.Name, Status: r.Status}
	}
	return out, nil
}
