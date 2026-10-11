// Package console holds the HTTP handlers of /api/console.
package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/auth"
	"github.com/beyenpay/x/logger"
)

type AuthHandler struct {
	svc    *auth.Service
	cookie *middleware.SessionCookie
}

func NewAuthHandler(svc *auth.Service, cookie *middleware.SessionCookie) *AuthHandler {
	return &AuthHandler{svc: svc, cookie: cookie}
}

// Login handles POST /api/console/auth/login.
func (h *AuthHandler) Login(c *gin.Context) {
	var req consoledto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidParams)
		return
	}

	res, err := h.svc.Login(c.Request.Context(), auth.LoginInput{
		Email:     req.Email,
		Password:  req.Password,
		IP:        c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})
	switch {
	case err == nil:
	case errors.Is(err, auth.ErrInvalidCredentials):
		response.Fail(c, response.ErrInvalidCredentials)
		return
	case errors.Is(err, auth.ErrAccountDisabled):
		response.Fail(c, response.ErrAccountDisabled)
		return
	case errors.Is(err, auth.ErrTooManyAttempts):
		response.Fail(c, response.ErrTooManyAttempts)
		return
	default:
		logger.Error("login failed", zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	h.cookie.Set(c, res.Token, res.ExpiresAt)
	response.Success(c, consoledto.LoginResponse{User: consoledto.NewUserInfo(res.User)})
}

// Logout handles POST /api/console/auth/logout. It is idempotent: with a valid
// session that session is ended; without one there is nothing to end. Either
// way the cookie is cleared, so a stale cookie never needs a special case.
func (h *AuthHandler) Logout(c *gin.Context) {
	if p := middleware.PrincipalFrom(c); p != nil {
		if err := h.svc.Logout(c.Request.Context(), p); err != nil {
			// Keep the cookie: the session is still alive, so the user can retry.
			logger.Error("logout failed", zap.Int("user_id", p.UserID), zap.Error(err))
			response.Fail(c, response.ErrInternal)
			return
		}
	}
	h.cookie.Clear(c)
	response.Success(c, nil)
}
