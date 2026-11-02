package repository

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/model"
)

type ProjectRepo struct{ db *gorm.DB }

func NewProjectRepo(db *gorm.DB) *ProjectRepo { return &ProjectRepo{db: db} }

func (r *ProjectRepo) GetByID(ctx context.Context, id int) (*model.Project, error) {
	var p model.Project
	err := r.db.WithContext(ctx).Take(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get project: %w", err)
	}
	return &p, nil
}

func (r *ProjectRepo) Create(ctx context.Context, p *model.Project) error {
	if err := r.db.WithContext(ctx).Create(p).Error; err != nil {
		return fmt.Errorf("create project: %w", err)
	}
	return nil
}

// ListAll returns every project except deleted ones, by id. It feeds the
// project list of a platform admin, who reaches all projects.
func (r *ProjectRepo) ListAll(ctx context.Context) ([]model.Project, error) {
	var rows []model.Project
	err := r.db.WithContext(ctx).
		Where("status <> ?", model.ProjectStatusDeleted).
		Order("id").
		Find(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	return rows, nil
}

// projectSortColumns is the one list of what a project listing can be sorted
// by: the name the API accepts, and the column behind it. The value goes into
// SQL, so nothing a client sends may reach ORDER BY except through this map.
var projectSortColumns = map[string]string{
	"id":      "id",
	"name":    "name",
	"created": "created_at",
}

// ValidProjectSort reports whether key is empty (the default order) or a sortable field.
func ValidProjectSort(key string) bool {
	if key == "" {
		return true
	}
	_, ok := projectSortColumns[key]
	return ok
}

// ProjectSort is the requested order. A zero value means newest first.
type ProjectSort struct {
	Key  string
	Desc bool
}

// orderBy is the ORDER BY clause. id is always the last key, so rows that tie
// on the chosen column keep one stable order and paging neither repeats nor skips any.
func (s ProjectSort) orderBy() string {
	col, ok := projectSortColumns[s.Key]
	if !ok {
		return "id DESC"
	}
	dir := "ASC"
	if s.Desc {
		dir = "DESC"
	}
	if col == "id" {
		return "id " + dir
	}
	return col + " " + dir + ", id DESC"
}

// ProjectFilter narrows a project listing. Zero values mean "no condition".
// Unlike ListAll, deleted projects are included unless Status says otherwise.
type ProjectFilter struct {
	Name        string              // substring
	Comment     string              // substring of the comment
	Status      model.ProjectStatus // 0 = any
	CreatedFrom int64               // unix seconds, inclusive
	CreatedTo   int64               // unix seconds, inclusive
}

func (f ProjectFilter) apply(db *gorm.DB) *gorm.DB {
	if f.Name != "" {
		db = db.Where("name LIKE ?", "%"+likeEscaper.Replace(f.Name)+"%")
	}
	if f.Comment != "" {
		db = db.Where("comment LIKE ?", "%"+likeEscaper.Replace(f.Comment)+"%")
	}
	if f.Status != 0 {
		db = db.Where("status = ?", f.Status)
	}
	if f.CreatedFrom > 0 {
		db = db.Where("created_at >= ?", f.CreatedFrom)
	}
	if f.CreatedTo > 0 {
		db = db.Where("created_at <= ?", f.CreatedTo)
	}
	return db
}

// List returns one page of projects and how many match in total.
func (r *ProjectRepo) List(ctx context.Context, sort ProjectSort, f ProjectFilter, offset, limit int) ([]model.Project, int64, error) {
	// A *gorm.DB must not be reused after a finisher, so each query builds its own.
	query := func() *gorm.DB { return f.apply(r.db.WithContext(ctx).Model(&model.Project{})) }

	var total int64
	if err := query().Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count projects: %w", err)
	}
	rows := []model.Project{}
	if total == 0 {
		return rows, 0, nil
	}
	if err := query().Order(sort.orderBy()).Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, fmt.Errorf("list projects: %w", err)
	}
	return rows, total, nil
}

// MarkDeleted sets the project's status to deleted. The row stays, because
// members, keys and payments point at it. Deleting a deleted project succeeds
// without changing anything; ErrNotFound means there is no such project.
func (r *ProjectRepo) MarkDeleted(ctx context.Context, id int) error {
	res := r.db.WithContext(ctx).Model(&model.Project{}).
		Where("id = ? AND status <> ?", id, model.ProjectStatusDeleted).
		Update("status", model.ProjectStatusDeleted)
	if res.Error != nil {
		return fmt.Errorf("delete project: %w", res.Error)
	}
	if res.RowsAffected > 0 {
		return nil
	}

	// Nothing changed: it is already deleted, or it never existed.
	var n int64
	if err := r.db.WithContext(ctx).Model(&model.Project{}).Where("id = ?", id).Count(&n).Error; err != nil {
		return fmt.Errorf("check project: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
