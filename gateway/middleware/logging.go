package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/x/logger"
)

// AccessLog logs one structured entry per request. The caller is meaningless
// here (always this file), so it is switched off.
func AccessLog() gin.HandlerFunc {
	log := logger.Zap().WithOptions(zap.WithCaller(false))
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		status := c.Writer.Status()
		fields := []zap.Field{
			zap.Int("status", status),
			zap.String("method", c.Request.Method),
			zap.String("uri", c.Request.URL.RequestURI()),
			zap.String("ip", c.ClientIP()),
			zap.Float64("latency_ms", float64(time.Since(start).Microseconds())/1000),
		}
		if p := PrincipalFrom(c); p != nil {
			fields = append(fields, zap.Int("user_id", p.UserID))
		}
		if len(c.Errors) > 0 {
			fields = append(fields, zap.String("errors", c.Errors.String()))
		}

		// Every request is a fact, not a fault: always info. Real failures are
		// logged at ERROR where they happen; alert on the status field.
		log.Info("request", fields...)
	}
}
