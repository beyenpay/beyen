package router

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/beyenpay/beyen/gateway/pkg/response"
)

const apiPrefix = "/api"

var (
	// An /api path that no route matches: the caller used a wrong path.
	errAPIRouteNotFound = response.ErrEndpointNotFound.WithMessage(
		"No such route on the gateway. Please check the request path.")

	// A path outside /api: it most likely belongs to the console frontend and
	// the reverse proxy sent it to the gateway by mistake.
	errNotAPIPath = response.ErrEndpointNotFound.WithMessage(
		"The gateway only serves /api. This looks like a console frontend route; check the reverse proxy configuration.")
)

// mountFallback makes requests that match no route answer in the API's own
// JSON shape instead of gin's plain text. In production nginx sends only /api
// here; anything else is handled by the console frontend, which renders its
// own 404 page.
func mountFallback(r *gin.Engine) {
	// An API should not redirect /api/health/ to /api/health: a redirected POST
	// surprises clients. Be strict and answer 404.
	r.RedirectTrailingSlash = false

	// A known path with the wrong method answers 405 (gin adds the Allow header).
	r.HandleMethodNotAllowed = true

	r.NoRoute(func(c *gin.Context) {
		if isAPIPath(c.Request.URL.Path) {
			response.Fail(c, errAPIRouteNotFound)
			return
		}
		response.Fail(c, errNotAPIPath)
	})
	r.NoMethod(func(c *gin.Context) { response.Fail(c, response.ErrMethodNotAllowed) })
}

// isAPIPath is true for /api and everything below it, but not for /apifoo.
func isAPIPath(p string) bool {
	return p == apiPrefix || strings.HasPrefix(p, apiPrefix+"/")
}

// mountRoot answers GET / with a short greeting, like other API servers do,
// so opening the bare address shows what is running. It reveals no version.
func mountRoot(r *gin.Engine) {
	r.Match([]string{http.MethodGet, http.MethodHead}, "/", func(c *gin.Context) {
		c.JSON(http.StatusOK, response.Body{
			Message: "Welcome to the Beyen API. All endpoints are served under /api.",
		})
	})
}
