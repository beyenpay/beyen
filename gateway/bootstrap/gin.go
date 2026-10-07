package bootstrap

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/x/logger"
)

const version = "0.0.1"

// newGin builds the gin engine. The mode is set here, before the engine
// exists, and depends only on APP_ENV (GIN_MODE is overridden).
func newGin(cfg *config.Config) *gin.Engine {
	if cfg.IsProd() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Hooks must be installed before gin.New(), which already prints a debug warning.
	routeGinDebugToLogger()

	r := gin.New()
	// accessLog is outermost so a recovered panic is still logged as a 500.
	r.Use(accessLog(), recovery())

	r.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"version": version})
	})

	r.GET("/err", func(c *gin.Context) {
		c.JSON(http.StatusBadRequest, gin.H{"msg": "err"})
	})

	r.GET("/bad", func(c *gin.Context) {
		c.JSON(http.StatusBadGateway, gin.H{"msg": "bad"})
	})

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

// accessLog logs one structured entry per request. The caller is meaningless
// here (always this file), so it is switched off.
func accessLog() gin.HandlerFunc {
	log := logger.Zap().WithOptions(zap.WithCaller(false))
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		status := c.Writer.Status()
		fields := []zap.Field{
			zap.Int("status", status),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("route", c.FullPath()), // empty for 404
			zap.String("ip", c.ClientIP()),
			zap.Float64("latency_ms", float64(time.Since(start).Microseconds())/1000),
			zap.Int("size", c.Writer.Size()),
			zap.String("ua", c.Request.UserAgent()),
		}
		if len(c.Errors) > 0 {
			fields = append(fields, zap.String("errors", c.Errors.String()))
		}

		// Every request is a fact, not a fault: always info. Real failures are
		// logged at ERROR where they happen; alert on the status field.
		log.Info("request", fields...)
	}
}

// recovery turns a handler panic into a 500 and logs it with a stack trace.
// A nil writer disables gin's own stderr output.
func recovery() gin.HandlerFunc {
	return gin.CustomRecoveryWithWriter(nil, func(c *gin.Context, err any) {
		logger.Zap().Error("panic recovered",
			zap.Any("error", err),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Stack("stack"),
		)
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}
