package handler

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/pkg/response"
	"github.com/beyenpay/x/logger"
)

type Health struct {
	db  *gorm.DB
	rdb *redis.Client
}

func NewHealth(db *gorm.DB, rdb *redis.Client) *Health { return &Health{db: db, rdb: rdb} }

// Check reports whether MySQL and Redis both answer. It is public and reveals
// nothing beyond ok or unavailable; details belong in the system console.
func (h *Health) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	sqlDB, err := h.db.DB()
	if err == nil {
		err = sqlDB.PingContext(ctx)
	}
	if err == nil {
		err = h.rdb.Ping(ctx).Err()
	}
	if err != nil {
		logger.Error("health check failed", zap.Error(err))
		response.Fail(c, response.ErrUnavailable)
		return
	}
	response.Success(c, nil)
}
