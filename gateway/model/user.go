package model

// UserStatus is stored as bigint.
type UserStatus int

const (
	UserStatusActive   UserStatus = 1
	UserStatusDisabled UserStatus = 2
	UserStatusDeleted  UserStatus = 3
)

// SystemRole is stored on users.system_role. Empty means a normal user.
type SystemRole string

const SystemRoleAdmin SystemRole = "admin"

// Valid reports whether r is a known system role. The empty role is not valid.
func (r SystemRole) Valid() bool { return r == SystemRoleAdmin }

type User struct {
	ID           int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Email        string     `json:"email" gorm:"size:255;not null;uniqueIndex:uk_users_email"` // normalize to lower-case in service
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	Status       UserStatus `json:"status" gorm:"not null;default:1;comment:1 active, 2 disabled, 3 deleted"`
	SystemRole   SystemRole `json:"system_role" gorm:"size:32;not null;default:'';comment:empty for a normal user, admin for a platform admin"`
	CreatedAt    int64      `json:"created_at" gorm:"autoCreateTime"` // unix seconds
	UpdatedAt    int64      `json:"updated_at" gorm:"autoUpdateTime"` // unix seconds
}

func (User) TableName() string { return "users" }
