package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/beyenpay/beyen/gateway/pkg/response"
)

// RequireLogin rejects anonymous requests. It must run after LoadSession.
func RequireLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if PrincipalFrom(c) == nil {
			response.Abort(c, response.ErrUnauthorized)
			return
		}
		c.Next()
	}
}

// RequireAnonymous rejects requests that already carry a valid session, for
// routes such as login that make no sense once signed in. A stale cookie has
// already been cleared by LoadSession, so it counts as anonymous.
// It must run after LoadSession.
func RequireAnonymous() gin.HandlerFunc {
	return func(c *gin.Context) {
		if PrincipalFrom(c) != nil {
			response.Abort(c, response.ErrAlreadyLoggedIn)
			return
		}
		c.Next()
	}
}
