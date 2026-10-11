package model

// ProjectStatus is stored as bigint.
type ProjectStatus int

const (
	ProjectStatusActive   ProjectStatus = 1
	ProjectStatusDisabled ProjectStatus = 2 // frozen by a platform admin
)

type Project struct {
	ID        int           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string        `json:"name" gorm:"size:128;not null"`
	Status    ProjectStatus `json:"status" gorm:"not null;default:1;comment:1 active, 2 disabled"`
	CreatedAt int64         `json:"created_at" gorm:"autoCreateTime"` // unix seconds
	UpdatedAt int64         `json:"updated_at" gorm:"autoUpdateTime"` // unix seconds
}

func (Project) TableName() string { return "projects" }
