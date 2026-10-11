package console

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	consoledto "github.com/beyenpay/beyen/gateway/dto/console"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/beyen/gateway/service/user"
	"github.com/beyenpay/x/logger"
)

type MeHandler struct {
	users *user.Service
	authz *authz.Service
}

func NewMeHandler(users *user.Service, authz *authz.Service) *MeHandler {
	return &MeHandler{users: users, authz: authz}
}

// Profile handles GET /api/console/me.
func (h *MeHandler) Profile(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	u, err := h.users.Get(c.Request.Context(), p.UserID)
	switch {
	case err == nil:
	case errors.Is(err, user.ErrNotFound): // the session outlived the user
		response.Fail(c, response.ErrUnauthorized)
		return
	default:
		logger.Error("get profile failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}
	response.Success(c, consoledto.NewUserInfo(u))
}

// Permissions handles GET /api/console/me/permissions.
func (h *MeHandler) Permissions(c *gin.Context) {
	p := middleware.PrincipalFrom(c)
	acc, err := h.authz.Permissions(c.Request.Context(), p.UserID, p.SystemRole)
	if err != nil {
		logger.Error("get permissions failed", zap.Int("user_id", p.UserID), zap.Error(err))
		response.Fail(c, response.ErrInternal)
		return
	}

	resp := consoledto.PermissionsResponse{
		System:   permStrings(acc.System),
		Projects: make([]consoledto.ProjectAccess, len(acc.Projects)),
	}
	for i, pa := range acc.Projects {
		resp.Projects[i] = consoledto.ProjectAccess{
			ID:          pa.ProjectID,
			Name:        pa.Name,
			Status:      int(pa.Status),
			Role:        string(pa.Role),
			Permissions: permStrings(pa.Permissions),
		}
	}
	response.Success(c, resp)
}

// permStrings never returns nil, so JSON shows [] instead of null.
func permStrings(ps []permission.Permission) []string {
	out := make([]string, len(ps))
	for i, p := range ps {
		out[i] = string(p)
	}
	return out
}
