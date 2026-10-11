package middleware

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/x/logger"
)

// RequireSystem allows only callers whose system role holds p.
// It must run after RequireLogin.
func RequireSystem(p permission.Permission) gin.HandlerFunc {
	if !p.IsSystem() {
		panic("middleware: RequireSystem needs a system permission, got " + string(p))
	}
	return func(c *gin.Context) {
		pr := PrincipalFrom(c)
		if pr == nil {
			response.Abort(c, response.ErrUnauthorized)
			return
		}
		if !permission.SystemRoleCan(pr.SystemRole, p) {
			response.Abort(c, response.ErrForbidden)
			return
		}
		c.Next()
	}
}

// RequireProject allows callers that hold p in the project named by the
// :project_id route parameter. It must run after RequireLogin. The decision
// and its caching live in authz.Service.CheckProject.
func RequireProject(svc *authz.Service, p permission.Permission) gin.HandlerFunc {
	if p.IsSystem() {
		panic("middleware: RequireProject needs a project permission, got " + string(p))
	}
	return func(c *gin.Context) {
		pr := PrincipalFrom(c)
		if pr == nil {
			response.Abort(c, response.ErrUnauthorized)
			return
		}
		projectID, err := strconv.Atoi(c.Param("project_id"))
		if err != nil || projectID < 1 {
			response.Abort(c, response.ErrNotFound)
			return
		}

		err = svc.CheckProject(c.Request.Context(), pr.UserID, pr.SystemRole, projectID, p)
		switch {
		case err == nil:
			setProjectID(c, projectID)
			c.Next()
		case errors.Is(err, authz.ErrProjectNotFound):
			response.Abort(c, response.ErrNotFound)
		case errors.Is(err, authz.ErrProjectDisabled):
			response.Abort(c, response.ErrProjectDisabled)
		case errors.Is(err, authz.ErrPermissionDenied):
			response.Abort(c, response.ErrForbidden)
		default:
			logger.Error("project permission check failed", zap.Int("project_id", projectID), zap.Error(err))
			response.Abort(c, response.ErrInternal)
		}
	}
}
