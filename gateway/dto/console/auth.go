// Package console holds the request and response shapes of /api/console.
package console

import "github.com/beyenpay/beyen/gateway/model"

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,max=128"` // no minimum: old passwords must still work
}

// UserInfo is the user as the console frontend sees it.
type UserInfo struct {
	ID         int    `json:"id"`
	Email      string `json:"email"`
	SystemRole string `json:"system_role"` // empty for a normal user
}

func NewUserInfo(u *model.User) UserInfo {
	return UserInfo{ID: u.ID, Email: u.Email, SystemRole: string(u.SystemRole)}
}

type LoginResponse struct {
	User UserInfo `json:"user"`
}
