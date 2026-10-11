package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/beyenpay/beyen/gateway/service/auth"
)

const (
	principalKey = "principal"
	projectIDKey = "project_id"
)

func setPrincipal(c *gin.Context, p *auth.Principal) { c.Set(principalKey, p) }

// PrincipalFrom returns the authenticated caller, or nil for an anonymous request.
func PrincipalFrom(c *gin.Context) *auth.Principal {
	v, _ := c.Get(principalKey)
	p, _ := v.(*auth.Principal)
	return p
}

func setProjectID(c *gin.Context, id int) { c.Set(projectIDKey, id) }

// ProjectIDFrom returns the project id checked by RequireProject, or 0 when
// the route does not use it.
func ProjectIDFrom(c *gin.Context) int {
	v, _ := c.Get(projectIDKey)
	id, _ := v.(int)
	return id
}
