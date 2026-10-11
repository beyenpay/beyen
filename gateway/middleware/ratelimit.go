package middleware

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/x/logger"
)

// KeyFunc names the caller a bucket is kept for. Returning "" skips limiting.
// Adding a new dimension (user, API key, project...) is one small function.
type KeyFunc func(c *gin.Context) string

// ByIP limits per client IP.
func ByIP(c *gin.Context) string { return c.ClientIP() }

// ByUser limits per logged-in user, so several sessions of one user share a
// bucket. Anonymous requests fall back to the client IP.
func ByUser(c *gin.Context) string {
	if p := PrincipalFrom(c); p != nil {
		return "u:" + strconv.Itoa(p.UserID)
	}
	return "ip:" + c.ClientIP()
}

// RateLimit applies a token bucket to every request that reaches it.
// scope separates buckets: the same caller has an independent bucket per scope.
// If Redis is unavailable the request is let through and the error is logged,
// so a Redis outage never takes the API down with it.
func RateLimit(l *ratelimit.Limiter, scope string, rule ratelimit.Rule, key KeyFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := key(c)
		if id == "" {
			c.Next()
			return
		}

		res, err := l.Allow(c.Request.Context(), scope, id, rule)
		if err != nil {
			logger.Error("rate limit check failed, letting request through",
				zap.String("scope", scope), zap.Error(err))
			c.Next()
			return
		}

		h := c.Writer.Header()
		h.Set("X-RateLimit-Limit", strconv.Itoa(rule.Max))
		h.Set("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))
		if !res.Allowed {
			h.Set("Retry-After", strconv.Itoa(int(math.Ceil(res.RetryAfter.Seconds()))))
			response.Abort(c, response.ErrRateLimited)
			return
		}
		c.Next()
	}
}
