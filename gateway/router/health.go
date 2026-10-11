package router

import (
	"github.com/gin-gonic/gin"

	"github.com/beyenpay/beyen/gateway/handler"
)

// mountHealth registers the public health check.
func mountHealth(api *gin.RouterGroup, d Deps) {
	h := handler.NewHealth(d.DB, d.Redis)
	api.GET("/health", h.Check)
}
