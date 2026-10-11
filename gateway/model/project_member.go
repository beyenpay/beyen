package model

// ProjectRole is stored on project_members.role.
type ProjectRole string

const (
	ProjectRoleManager   ProjectRole = "manager"
	ProjectRoleDeveloper ProjectRole = "developer"
	ProjectRoleSupport   ProjectRole = "support"
)

// Valid reports whether r is a known project role.
func (r ProjectRole) Valid() bool {
	switch r {
	case ProjectRoleManager, ProjectRoleDeveloper, ProjectRoleSupport:
		return true
	}
	return false
}

// ProjectMember grants one user exactly one role in one project.
// The unique index on (project_id, user_id) enforces that.
type ProjectMember struct {
	ID        int         `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID int         `json:"project_id" gorm:"not null;uniqueIndex:uk_project_members_project_user"`
	UserID    int         `json:"user_id" gorm:"not null;uniqueIndex:uk_project_members_project_user;index:idx_project_members_user"` // idx serves "my projects"
	Role      ProjectRole `json:"role" gorm:"size:32;not null"`
	CreatedAt int64       `json:"created_at" gorm:"autoCreateTime"` // unix seconds
	UpdatedAt int64       `json:"updated_at" gorm:"autoUpdateTime"` // unix seconds
}

func (ProjectMember) TableName() string { return "project_members" }
