package repository

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/model"
)

type ProjectMemberRepo struct{ db *gorm.DB }

func NewProjectMemberRepo(db *gorm.DB) *ProjectMemberRepo { return &ProjectMemberRepo{db: db} }

// GetRole returns ErrNotFound when the user is not a member of the project.
func (r *ProjectMemberRepo) GetRole(ctx context.Context, projectID, userID int) (model.ProjectRole, error) {
	var m model.ProjectMember
	err := r.db.WithContext(ctx).Select("role").
		Where("project_id = ? AND user_id = ?", projectID, userID).Take(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get project role: %w", err)
	}
	return m.Role, nil
}

// MemberProject is one project a user belongs to.
type MemberProject struct {
	ProjectID int
	Name      string
	Status    model.ProjectStatus
	Role      model.ProjectRole
}

// ListByUser returns the user's projects, deleted ones excluded, by project id.
func (r *ProjectMemberRepo) ListByUser(ctx context.Context, userID int) ([]MemberProject, error) {
	var rows []MemberProject
	err := r.db.WithContext(ctx).
		Table("project_members AS m").
		Select("p.id AS project_id, p.name AS name, p.status AS status, m.role AS role").
		Joins("JOIN projects p ON p.id = m.project_id").
		Where("m.user_id = ? AND p.status <> ?", userID, model.ProjectStatusDeleted).
		Order("p.id").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("list user projects: %w", err)
	}
	return rows, nil
}

// Create inserts m. ErrDuplicate means the user is already in the project.
func (r *ProjectMemberRepo) Create(ctx context.Context, m *model.ProjectMember) error {
	err := r.db.WithContext(ctx).Create(m).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrDuplicate
	}
	if err != nil {
		return fmt.Errorf("create project member: %w", err)
	}
	return nil
}

// ListUserIDs returns the id of every member of the project.
func (r *ProjectMemberRepo) ListUserIDs(ctx context.Context, projectID int) ([]int, error) {
	var ids []int
	err := r.db.WithContext(ctx).Model(&model.ProjectMember{}).
		Where("project_id = ?", projectID).Pluck("user_id", &ids).Error
	if err != nil {
		return nil, fmt.Errorf("list project member ids: %w", err)
	}
	return ids, nil
}
