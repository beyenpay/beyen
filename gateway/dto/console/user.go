package console

import "github.com/beyenpay/beyen/gateway/model"

// CreateUserRequest is the body of POST /system/users. SystemRole is empty for
// a normal user; admin is the only role that can be granted.
type CreateUserRequest struct {
	Email      string `json:"email" binding:"required,email,max=255"`
	Password   string `json:"password" binding:"required,max=128"`
	SystemRole string `json:"system_role" binding:"omitempty,oneof=admin"`
}

// ListUsersRequest is the query string of GET /system/users. Every field is
// optional; zero means "no condition". Dates are unix seconds, inclusive.
type ListUsersRequest struct {
	Page        int    `form:"page" binding:"omitempty,min=1,max=100000"`
	PageSize    int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Q           string `form:"q" binding:"omitempty,max=255"`
	Status      int    `form:"status" binding:"omitempty,oneof=1 2 3"`
	Role        string `form:"role" binding:"omitempty,oneof=admin user"`
	CreatedFrom int64  `form:"created_from" binding:"omitempty,min=0"`
	CreatedTo   int64  `form:"created_to" binding:"omitempty,min=0"`
}

// UserListItem is one row of the users table.
type UserListItem struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	Status     int    `json:"status"`      // 1 active, 2 disabled, 3 deleted
	SystemRole string `json:"system_role"` // empty for a normal user
	CreatedAt  int64  `json:"created_at"`
	UpdatedAt  int64  `json:"updated_at"`
}

func NewUserListItem(u *model.User) UserListItem {
	return UserListItem{
		ID:         u.ID,
		Email:      u.Email,
		Status:     int(u.Status),
		SystemRole: string(u.SystemRole),
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
}
