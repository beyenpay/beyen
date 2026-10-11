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

type SessionHandler struct {
	svc    *auth.Service
	cookie *middleware.SessionCookie
}

func NewSessionHandler(svc *auth.Service, cookie *middleware.SessionCookie) *SessionHandler {
	return &SessionHandler{svc: svc, cookie: cookie}
}

// List handles GET /api/console/me/sessions.
func (h *SessionHandler) List(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	items, err := h.svc.ListSessions(c.Request.Context(), p)
	if err != nil {
		logger.Error("list sessions failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}
	out := make([]consoledto.SessionInfo, len(items))
	for i, it := range items {
		out[i] = consoledto.SessionInfo{
			ID: it.ID, IP: it.IP, UserAgent: it.UserAgent,
			CreatedAt: it.CreatedAt, LastSeenAt: it.LastSeenAt, Current: it.Current,
		}
	}
	response.Success(c, out)
}

// Revoke handles DELETE /api/console/me/sessions/:id.
func (h *SessionHandler) Revoke(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	id := c.Param("id")

	err := h.svc.RevokeSession(c.Request.Context(), p.UserID, id)
	switch {
	case err == nil:
	case errors.Is(err, auth.ErrSessionNotFound):
		response.Fail(c, response.ErrNotFound)
		return
	default:
		logger.Error("revoke session failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}
	if id == p.SessionID { // the caller ended their own session
		h.cookie.Clear(c)
	}
	response.Success(c, nil)
}

// RevokeAll handles DELETE /api/console/me/sessions: it signs the caller out
// of every device, the current one included.
func (h *SessionHandler) RevokeAll(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	if err := h.svc.RevokeAll(c.Request.Context(), p.UserID, ""); err != nil {
		logger.Error("revoke all sessions failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}
	h.cookie.Clear(c)
	response.Success(c, nil)
}
