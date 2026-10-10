package model

// UserStatus is stored as bigint.
type UserStatus int

const (
	UserStatusActive      UserStatus = 1
	UserStatusDisabled    UserStatus = 2
	UserStatusDeactivated UserStatus = 3
)

type User struct {
	ID           int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Email        string     `json:"email" gorm:"size:255;not null;uniqueIndex:uk_users_email"` // normalize to lower-case in service
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	Status       UserStatus `json:"status" gorm:"not null;default:1;comment:1 active, 2 disabled, 3 deactivated"`
	CreatedAt    int64      `json:"created_at" gorm:"autoCreateTime"` // unix seconds
	UpdatedAt    int64      `json:"updated_at" gorm:"autoUpdateTime"` // unix seconds
}

func (User) TableName() string { return "users" }
