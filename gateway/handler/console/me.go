package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/me"
	"github.com/beyenpay/x/logger"
)

type MeHandler struct{ svc *me.Service }

func NewMeHandler(svc *me.Service) *MeHandler { return &MeHandler{svc: svc} }

// Get handles GET /api/console/me: the caller's profile and permissions in one call.
func (h *MeHandler) Get(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	v, err := h.svc.Get(c.Request.Context(), p.UserID, p.SystemRole)
	switch {
	case err == nil:
	case errors.Is(err, me.ErrUserNotFound): // the session outlived the user
		response.Fail(c, response.ErrUnauthorized)
		return
	default:
		logger.Error("get me failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	projects := make([]consoledto.ProjectAccess, len(v.Projects))
	for i, pv := range v.Projects {
		projects[i] = consoledto.ProjectAccess{
			ID:          pv.ID,
			Name:        pv.Name,
			Status:      int(pv.Status),
			Role:        string(pv.Role),
			Permissions: permStrings(pv.Permissions),
		}
	}
	response.Success(c, consoledto.MeResponse{
		User: consoledto.UserInfo{ID: v.UserID, Email: v.Email, SystemRole: string(v.SystemRole)},
		Permissions: consoledto.PermissionsInfo{
			System:   permStrings(v.System),
			Projects: projects,
		},
	})
}

// permStrings never returns nil, so JSON shows [] instead of null.
func permStrings(ps []permission.Permission) []string {
	out := make([]string, len(ps))
	for i, p := range ps {
		out[i] = string(p)
	}
	return out
}
