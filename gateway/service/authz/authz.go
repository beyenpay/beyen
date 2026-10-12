// Package authz answers "what may this caller do": it resolves a caller's
// permissions in the system and in projects. Who the caller is comes from
// service/auth.
package authz

import (
	"context"
	"errors"
	"time"

	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/infra/rediskey"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/x/logger"
)

var (
	// ErrProjectNotFound covers a missing or deleted project and a caller who
	// is not a member, so a caller cannot tell whether a project exists.
	ErrProjectNotFound  = errors.New("project not found")
	ErrProjectDisabled  = errors.New("project is disabled")
	ErrPermissionDenied = errors.New("permission denied")
)

const (
	cacheTTL    = 5 * time.Minute
	negativeTTL = 30 * time.Second // for "no such project" and "not a member"
)

type Service struct {
	projects *repository.ProjectRepo
	members  *repository.ProjectMemberRepo
	cache    *repository.Cache
	keys     rediskey.Keys
}

func New(projects *repository.ProjectRepo, members *repository.ProjectMemberRepo, cache *repository.Cache, keys rediskey.Keys) *Service {
	return &Service{projects: projects, members: members, cache: cache, keys: keys}
}

// CheckProject decides whether the caller holds permission p in the project.
// p must be a project permission. A platform admin reaches every project.
func (s *Service) CheckProject(ctx context.Context, userID int, sysRole model.SystemRole, projectID int, p permission.Permission) error {
	status, err := s.projectStatus(ctx, projectID)
	if err != nil {
		return err
	}
	if status == 0 || status == model.ProjectStatusDeleted {
		return ErrProjectNotFound
	}

	if permission.SystemRoleCan(sysRole, p) {
		return nil
	}

	role, err := s.memberRole(ctx, projectID, userID)
	if err != nil {
		return err
	}
	if role == "" {
		return ErrProjectNotFound
	}
	if status != model.ProjectStatusActive {
		return ErrProjectDisabled
	}
	if !permission.ProjectRoleCan(role, p) {
		return ErrPermissionDenied
	}
	return nil
}

// InvalidateProject must be called after a project's name or status changes.
// Every member's /me view shows the project, so their snapshots are dropped too.
func (s *Service) InvalidateProject(ctx context.Context, projectID int) error {
	keys := []string{s.keys.ProjectInfo(projectID)}
	ids, listErr := s.members.ListUserIDs(ctx, projectID)
	for _, id := range ids {
		keys = append(keys, s.keys.UserMe(id))
	}
	// Delete what we know even when listing failed; report both problems.
	return errors.Join(s.cache.Del(ctx, keys...), listErr)
}

// InvalidateMember must be called after a membership is added, changed or removed.
// The user's /me snapshot lists their projects and roles, so it goes too.
func (s *Service) InvalidateMember(ctx context.Context, projectID, userID int) error {
	return s.cache.Del(ctx, s.keys.ProjectMember(projectID, userID), s.keys.UserMe(userID))
}

type projectEntry struct {
	Status model.ProjectStatus `json:"s"` // 0: no such project
}

type memberEntry struct {
	Role model.ProjectRole `json:"r"` // empty: not a member
}

// projectStatus returns 0 when the project does not exist. A failing cache
// falls back to MySQL; it never changes the outcome of the check.
func (s *Service) projectStatus(ctx context.Context, projectID int) (model.ProjectStatus, error) {
	key := s.keys.ProjectInfo(projectID)
	var e projectEntry
	if ok, err := s.cache.Get(ctx, key, &e); err != nil {
		logger.Error("authz cache read failed", zap.String("key", key), zap.Error(err))
	} else if ok {
		return e.Status, nil
	}

	ttl := cacheTTL
	p, err := s.projects.GetByID(ctx, projectID)
	switch {
	case errors.Is(err, repository.ErrNotFound):
		e, ttl = projectEntry{}, negativeTTL
	case err != nil:
		return 0, err
	default:
		e = projectEntry{Status: p.Status}
	}
	if err := s.cache.Set(ctx, key, e, ttl); err != nil {
		logger.Error("authz cache write failed", zap.String("key", key), zap.Error(err))
	}
	return e.Status, nil
}

// memberRole returns "" when the user is not a member.
func (s *Service) memberRole(ctx context.Context, projectID, userID int) (model.ProjectRole, error) {
	key := s.keys.ProjectMember(projectID, userID)
	var e memberEntry
	if ok, err := s.cache.Get(ctx, key, &e); err != nil {
		logger.Error("authz cache read failed", zap.String("key", key), zap.Error(err))
	} else if ok {
		return e.Role, nil
	}

	ttl := cacheTTL
	role, err := s.members.GetRole(ctx, projectID, userID)
	switch {
	case errors.Is(err, repository.ErrNotFound):
		role, ttl = "", negativeTTL
	case err != nil:
		return "", err
	}
	if err := s.cache.Set(ctx, key, memberEntry{Role: role}, ttl); err != nil {
		logger.Error("authz cache write failed", zap.String("key", key), zap.Error(err))
	}
	return role, nil
}
