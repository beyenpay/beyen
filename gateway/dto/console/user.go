package console

import (
	"strings"

	"github.com/beyenpay/beyen/gateway/model"
)

// CreateUserRequest is the body of POST /system/users. SystemRole is empty for
// a normal user; admin is the only role that can be granted.
type CreateUserRequest struct {
	Email      string `json:"email" binding:"required,email,max=255"`
	Password   string `json:"password" binding:"required,max=128"`
	SystemRole string `json:"system_role" binding:"omitempty,oneof=admin"`
	Comment    string `json:"comment" binding:"omitempty,max=255"`
}

// UserIDURI is the :id of /system/users/:id.
type UserIDURI struct {
	ID int `uri:"id" binding:"required,min=1"`
}

// UpdateUserRequest is the body of PATCH /system/users/:id. A field that is
// missing stays as it is; system_role "" makes the user a normal user. Status
// is 1 (active) or 2 (disabled): deleting and restoring have their own routes.
type UpdateUserRequest struct {
	Email      *string `json:"email" binding:"omitempty,email,max=255"`
	SystemRole *string `json:"system_role" binding:"omitempty,max=32"` // "" or admin; the service checks which
	Status     *int    `json:"status" binding:"omitempty,oneof=1 2"`
	Comment    *string `json:"comment" binding:"omitempty,max=255"`
}

// ResetPasswordRequest is the body of POST /system/users/:id/password.
type ResetPasswordRequest struct {
	Password string `json:"password" binding:"required,max=128"`
}

// ListUsersRequest is the query string of GET /system/users. Every field is
// optional; zero means "no condition". Dates are unix seconds, inclusive.
type ListUsersRequest struct {
	Page        int    `form:"page" binding:"omitempty,min=1,max=100000"`
	PageSize    int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Sort        string `form:"sort" binding:"omitempty,max=32"`        // checked against the sortable fields in the service
	Dir         string `form:"dir" binding:"omitempty,oneof=asc desc"` // empty means desc
	Q           string `form:"q" binding:"omitempty,max=255"`
	QOp         string `form:"q_op" binding:"omitempty,oneof=eq contains"` // empty means contains
	Comment     string `form:"comment" binding:"omitempty,max=255"`        // substring of the note
	Status      int    `form:"status" binding:"omitempty,oneof=1 2 3"`
	Role        string `form:"role" binding:"omitempty,max=64"` // comma separated: admin,user
	CreatedFrom int64  `form:"created_from" binding:"omitempty,min=0"`
	CreatedTo   int64  `form:"created_to" binding:"omitempty,min=0"`
}

// RoleList splits the role parameter. ok is false when any part is not a known role.
func (r ListUsersRequest) RoleList() (roles []string, ok bool) {
	if r.Role == "" {
		return nil, true
	}
	for part := range strings.SplitSeq(r.Role, ",") {
		switch part {
		case "admin", "user":
			roles = append(roles, part)
		default:
			return nil, false
		}
	}
	return roles, true
}

// UserListItem is one row of the users table.
type UserListItem struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	Status     int    `json:"status"`      // 1 active, 2 disabled, 3 deleted
	SystemRole string `json:"system_role"` // empty for a normal user
	Comment    string `json:"comment"`
	CreatedAt  int64  `json:"created_at"`
	UpdatedAt  int64  `json:"updated_at"`
}

func NewUserListItem(u *model.User) UserListItem {
	return UserListItem{
		ID:         u.ID,
		Email:      u.Email,
		Status:     int(u.Status),
		SystemRole: string(u.SystemRole),
		Comment:    u.Comment,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
}
