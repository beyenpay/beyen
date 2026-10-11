package middleware

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/x/logger"
)

// Recovery turns a handler panic into a 500 and logs it with a stack trace.
// A nil writer disables gin's own stderr output.
func Recovery() gin.HandlerFunc {
	return gin.CustomRecoveryWithWriter(nil, func(c *gin.Context, err any) {
		logger.Zap().Error("panic recovered",
			zap.Any("error", err),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Stack("stack"),
		)
		response.Abort(c, response.ErrInternal)
	})
}
