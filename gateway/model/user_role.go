package model

// UserRole grants one role to one user, either globally or in one project.
type UserRole struct {
	ID        int   `json:"id" gorm:"primaryKey"`
	UserID    int   `json:"user_id" gorm:"not null;uniqueIndex:uk_user_roles_user_role_project"`
	RoleID    int   `json:"role_id" gorm:"not null;uniqueIndex:uk_user_roles_user_role_project"`
	ProjectID int   `json:"project_id" gorm:"not null;default:0;uniqueIndex:uk_user_roles_user_role_project;index:idx_user_roles_project"`
	CreatedAt int64 `json:"created_at" gorm:"autoCreateTime"`
}

func (UserRole) TableName() string { return "user_roles" }
