package middleware

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/beyen/gateway/service/auth"
	"github.com/beyenpay/x/logger"
)

// The cookie is only sent to the console API, never to /api/pay or /api/v1.
const sessionCookiePath = "/api/console"

// SessionCookie reads, writes and clears the session cookie. The name, path
// and attributes live here and nowhere else.
type SessionCookie struct {
	name   string
	secure bool
}

func NewSessionCookie(cfg *config.Config) *SessionCookie {
	return &SessionCookie{name: cfg.App.Name + "_sid", secure: cfg.SecureCookie()}
}

// Read returns the cookie value, or "" when the request has none.
func (s *SessionCookie) Read(c *gin.Context) string {
	ck, err := c.Request.Cookie(s.name)
	if err != nil {
		return ""
	}
	return ck.Value
}

// Set stores value until the absolute expiry of the session (unix seconds).
func (s *SessionCookie) Set(c *gin.Context, value string, expiresAt int64) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     s.name,
		Value:    value,
		Path:     sessionCookiePath,
		MaxAge:   int(time.Until(time.Unix(expiresAt, 0)).Seconds()),
		HttpOnly: true,
		Secure:   s.secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// Clear asks the browser to drop the cookie.
func (s *SessionCookie) Clear(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     s.name,
		Path:     sessionCookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// LoadSession resolves the session cookie into a Principal on the context.
// It never rejects an anonymous request; RequireLogin does that. A cookie that
// no longer maps to a session is cleared. If the session store itself fails
// the request gets a 503, because treating it as anonymous would look like a
// forced logout.
func LoadSession(svc *auth.Service, ck *SessionCookie) gin.HandlerFunc {
	return func(c *gin.Context) {
		tok := ck.Read(c)
		if tok == "" {
			c.Next()
			return
		}

		p, err := svc.Authenticate(c.Request.Context(), tok)
		switch {
		case err == nil:
			setPrincipal(c, p)
		case errors.Is(err, auth.ErrNoSession):
			ck.Clear(c)
		default:
			logger.Error("load session failed", zap.Error(err))
			response.Abort(c, response.ErrUnavailable)
			return
		}
		c.Next()
	}
}
