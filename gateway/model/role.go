package model

// RoleScope says where a role may be assigned.
type RoleScope string

const (
	RoleScopeSystem  RoleScope = "system"  // assigned with project_id = GlobalProjectID
	RoleScopeProject RoleScope = "project" // assigned with a real project_id
)

// GlobalProjectID marks a role assignment that applies to the whole platform.
const GlobalProjectID = 0

// Role codes, seeded into the roles table. Checks in code use these constants.
const (
	RoleCodeAdmin     = "admin"
	RoleCodeManager   = "manager"
	RoleCodeDeveloper = "developer"
	RoleCodeSupport   = "support"
)

type Role struct {
	ID    int       `json:"id" gorm:"primaryKey"`
	Code  string    `json:"code" gorm:"size:32;not null;uniqueIndex:uk_roles_code"`
	Scope RoleScope `json:"scope" gorm:"size:16;not null"`
}

func (Role) TableName() string { return "roles" }
