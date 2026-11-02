package console

import (
	"github.com/beyenpay/beyen/gateway/service/project"
)

// CreateProjectRequest is the body of POST /system/projects. The name is
// trimmed and checked by the service.
type CreateProjectRequest struct {
	Name    string `json:"name" binding:"required,max=128"`
	Comment string `json:"comment" binding:"omitempty,max=255"` // optional note
}

// ProjectIDURI is the :id of /system/projects/:id.
type ProjectIDURI struct {
	ID int `uri:"id" binding:"required,min=1"`
}

// ListProjectsRequest is the query string of GET /system/projects. Every field
// is optional; zero means "no condition". Dates are unix seconds, inclusive.
type ListProjectsRequest struct {
	Page        int    `form:"page" binding:"omitempty,min=1,max=100000"`
	PageSize    int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Sort        string `form:"sort" binding:"omitempty,max=32"`        // checked against the sortable fields in the service
	Dir         string `form:"dir" binding:"omitempty,oneof=asc desc"` // empty means desc
	Q           string `form:"q" binding:"omitempty,max=128"`          // substring of the name
	Comment     string `form:"comment" binding:"omitempty,max=255"`    // substring of the note
	Status      int    `form:"status" binding:"omitempty,oneof=1 2 3"`
	CreatedFrom int64  `form:"created_from" binding:"omitempty,min=0"`
	CreatedTo   int64  `form:"created_to" binding:"omitempty,min=0"`
}

// ProjectListItem is one row of the projects table.
type ProjectListItem struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Status       int    `json:"status"`        // 1 active, 2 disabled, 3 deleted
	CreatedBy    int    `json:"created_by"`    // admin's user id; 0 when nobody is credited. Reference only.
	CreatorEmail string `json:"creator_email"` // empty when unknown
	Comment      string `json:"comment"`
	CreatedAt    int64  `json:"created_at"`
	UpdatedAt    int64  `json:"updated_at"`
}

func NewProjectListItem(p project.Listed) ProjectListItem {
	return ProjectListItem{
		ID:           p.ID,
		Name:         p.Name,
		Status:       int(p.Status),
		CreatedBy:    p.CreatedBy,
		CreatorEmail: p.CreatorEmail,
		Comment:      p.Comment,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}
