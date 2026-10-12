// Package router builds the gin engine and mounts every route group.
// Each group chooses its own authentication; nothing is shared implicitly.
package router

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/service/auth"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/beyen/gateway/service/me"
	"github.com/beyenpay/beyen/gateway/service/user"
	"github.com/beyenpay/x/logger"
)

// Deps is everything the routes need, created by bootstrap.
type Deps struct {
	Config  *config.Config
	DB      *gorm.DB
	Redis   *redis.Client
	Auth    *auth.Service
	Me      *me.Service
	Authz   *authz.Service
	User    *user.Service
	Limiter *ratelimit.Limiter
}

// New builds the engine. The gin mode is set here, before the engine exists,
// and depends only on APP_ENV (GIN_MODE is overridden).
func New(d Deps) *gin.Engine {
	if d.Config.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Hooks must be installed before gin.New(), which already prints a debug warning.
	routeGinDebugToLogger()

	r := gin.New()
	// AccessLog is outermost so a recovered panic is still logged as a 500.
	r.Use(middleware.AccessLog(), middleware.Recovery())
	mountFallback(r)
	mountRoot(r)

	api := r.Group("/api")
	mountHealth(api, d)
	mountConsole(api, d)
	return r
}

// routeGinDebugToLogger sends gin's debug-mode output (route table, warnings)
// to the logger. In release mode gin prints nothing, so these never fire.
func routeGinDebugToLogger() {
	dl := logger.Zap().WithOptions(zap.WithCaller(false)).Sugar()
	gin.DebugPrintRouteFunc = func(method, path, handler string, nHandlers int) {
		dl.Debugf("route %-6s %-25s --> %s (%d handlers)", method, path, handler, nHandlers)
	}
	gin.DebugPrintFunc = func(format string, values ...any) {
		dl.Debugf(strings.TrimRight(format, "\n"), values...)
	}
}
