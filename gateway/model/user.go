package model

import "time"

// User describes the users table only. API payloads belong in dto/.
type User struct {
	ID           uint64 `gorm:"primaryKey;autoIncrement"`
	Email        string `gorm:"size:255;not null;uniqueIndex:uk_users_email"` // store lower-cased
	PasswordHash string `gorm:"size:255;not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (User) TableName() string { return "users" }
