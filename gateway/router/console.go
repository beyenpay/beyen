package router

import (
	"time"

	"github.com/gin-gonic/gin"

	consolehandler "github.com/beyenpay/beyen/gateway/handler/console"
	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/middleware"
	"github.com/beyenpay/beyen/gateway/permission"
	"github.com/beyenpay/beyen/gateway/pkg/response"
)

// mountConsole registers /api/console: cookie session authentication.
//
//	CSRF -> LoadSession               every console request
//	RequireLogin -> RateLimit(user)   everything except the public auth routes
//
// Permissions are declared per route with RequireSystem / RequireProject.
func mountConsole(api *gin.RouterGroup, d Deps) {
	cookie := middleware.NewSessionCookie(d.Config)
	authH := consolehandler.NewAuthHandler(d.Auth, cookie)
	meH := consolehandler.NewMeHandler(d.User, d.Authz)
	sessH := consolehandler.NewSessionHandler(d.Auth, cookie)

	console := api.Group("/console",
		middleware.CSRF(d.Config.App.PublicURL),
		middleware.LoadSession(d.Auth, cookie),
	)

	// Public: reachable without a session.
	console.POST("/auth/login",
		middleware.RequireAnonymous(), // before the limiter, so a repeated click does not spend the IP budget
		middleware.RateLimit(d.Limiter, "login", ratelimit.Rule{Max: 30, Window: 15 * time.Minute}, middleware.ByIP),
		authH.Login,
	)
	// Logout works with or without a valid session, so a stale cookie can always be cleared.
	console.POST("/auth/logout", authH.Logout)

	// Logged in.
	authed := console.Group("",
		middleware.RequireLogin(),
		middleware.RateLimit(d.Limiter, "console", ratelimit.Rule{Max: 300, Window: time.Minute}, middleware.ByUser),
	)

	// The caller's own data: login is enough, no permission needed.
	me := authed.Group("/me")
	me.GET("", meH.Profile)
	me.GET("/permissions", meH.Permissions)
	me.GET("/sessions", sessH.List)
	me.DELETE("/sessions", sessH.RevokeAll)
	me.DELETE("/sessions/:id", sessH.Revoke)

	// TEMP: probes to exercise the authz middleware. Delete once real system
	// and project routes exist.
	probe := func(c *gin.Context) { response.Success(c, nil) }
	authed.GET("/system/_probe", middleware.RequireSystem(permission.SystemOverviewRead), probe)
	authed.GET("/projects/:project_id/_probe/home", middleware.RequireProject(d.Authz, permission.ProjectHomeRead), probe)
	authed.GET("/projects/:project_id/_probe/api-keys", middleware.RequireProject(d.Authz, permission.ProjectAPIKeyRead), probe)
	authed.GET("/projects/:project_id/_probe/settings", middleware.RequireProject(d.Authz, permission.ProjectSettingsRead), probe)
}
