package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/model"
)

type UserRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) *UserRepo { return &UserRepo{db: db} }

func (r *UserRepo) GetByID(ctx context.Context, id int) (*model.User, error) {
	var u model.User
	err := r.db.WithContext(ctx).Take(&u, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

// Create inserts u and fills its ID. ErrDuplicate means the email is taken.
func (r *UserRepo) Create(ctx context.Context, u *model.User) error {
	err := r.db.WithContext(ctx).Create(u).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrDuplicate
	}
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

// Count returns how many users exist, whatever their status.
func (r *UserRepo) Count(ctx context.Context) (int64, error) {
	var n int64
	if err := r.db.WithContext(ctx).Model(&model.User{}).Count(&n).Error; err != nil {
		return 0, fmt.Errorf("count users: %w", err)
	}
	return n, nil
}

// UserFilter narrows a user listing. Zero values mean "no condition".
type UserFilter struct {
	Email       string           // substring, already normalized to lower case
	Status      model.UserStatus // 0 = any
	Role        string           // "admin", "user" (no system role) or "" = any
	CreatedFrom int64            // unix seconds, inclusive
	CreatedTo   int64            // unix seconds, inclusive
}

// likeEscaper makes user input literal inside a LIKE pattern.
var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func (f UserFilter) apply(db *gorm.DB) *gorm.DB {
	if f.Email != "" {
		db = db.Where("email LIKE ?", "%"+likeEscaper.Replace(f.Email)+"%")
	}
	if f.Status != 0 {
		db = db.Where("status = ?", f.Status)
	}
	switch f.Role {
	case "admin":
		db = db.Where("system_role = ?", model.SystemRoleAdmin)
	case "user":
		db = db.Where("system_role = ?", "")
	}
	if f.CreatedFrom > 0 {
		db = db.Where("created_at >= ?", f.CreatedFrom)
	}
	if f.CreatedTo > 0 {
		db = db.Where("created_at <= ?", f.CreatedTo)
	}
	return db
}

// List returns one page of users, newest first, and how many users match in total.
func (r *UserRepo) List(ctx context.Context, f UserFilter, offset, limit int) ([]model.User, int64, error) {
	// A *gorm.DB must not be reused after a finisher, so each query builds its own.
	query := func() *gorm.DB { return f.apply(r.db.WithContext(ctx).Model(&model.User{})) }

	var total int64
	if err := query().Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count users: %w", err)
	}
	users := []model.User{}
	if total == 0 {
		return users, 0, nil
	}
	if err := query().Order("id DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("list users: %w", err)
	}
	return users, total, nil
}

// GetByEmail expects an email already normalized to lower case.
func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := r.db.WithContext(ctx).Where("email = ?", email).Take(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (r *UserRepo) UpdatePasswordHash(ctx context.Context, id int, hash string) error {
	err := r.db.WithContext(ctx).Model(&model.User{}).Where("id = ?", id).Update("password_hash", hash).Error
	if err != nil {
		return fmt.Errorf("update password hash: %w", err)
	}
	return nil
}
