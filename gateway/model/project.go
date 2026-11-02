package model

// ProjectStatus is stored as bigint.
type ProjectStatus int

const (
	ProjectStatusActive   ProjectStatus = 1
	ProjectStatusDisabled ProjectStatus = 2 // frozen by a platform admin
	ProjectStatusDeleted  ProjectStatus = 3 // deleted
)

type Project struct {
	ID     int           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name   string        `json:"name" gorm:"size:128;not null"`
	Status ProjectStatus `json:"status" gorm:"not null;default:1;comment:1 active, 2 disabled, 3 deleted"`
	// CreatedBy is the admin who created the project, for reference only: it
	// grants nothing. 0 for projects made before it existed or by a command-line tool.
	CreatedBy int    `json:"created_by" gorm:"not null;default:0;comment:id of the admin who created the project, reference only"`
	Comment   string `json:"comment" gorm:"size:255;not null;default:'';comment:note about the project written by an admin"`
	CreatedAt int64  `json:"created_at" gorm:"autoCreateTime"` // unix seconds
	UpdatedAt int64  `json:"updated_at" gorm:"autoUpdateTime"` // unix seconds
}

func (Project) TableName() string { return "projects" }
