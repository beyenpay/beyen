package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/beyenpay/beyen/gateway/pkg/response"
)

// CSRF rejects state-changing requests that a browser sent from another site.
// Together with SameSite=Lax on the session cookie this is enough for a
// same-origin app; no CSRF token is needed.
//
// publicURL is config.App.PublicURL (lower case, no trailing slash). Requests
// without Origin and Sec-Fetch-Site do not come from a browser, so they carry
// no ambient cookie to abuse and are let through.
func CSRF(publicURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}

		if origin := c.GetHeader("Origin"); origin != "" {
			if strings.ToLower(origin) != publicURL {
				response.Abort(c, response.ErrForbidden)
				return
			}
		} else if site := c.GetHeader("Sec-Fetch-Site"); site != "" && site != "same-origin" && site != "none" {
			response.Abort(c, response.ErrForbidden)
			return
		}
		c.Next()
	}
}
