package db

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/beyenpay/beyen/gateway/config"
)

// NewRedis parses the URL, applies pool settings and verifies connectivity.
func NewRedis(cfg config.Redis) (*redis.Client, error) {
	opt, err := redis.ParseURL(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	opt.PoolSize = cfg.PoolSize
	opt.MinIdleConns = cfg.MinIdle
	opt.MaxIdleConns = cfg.MaxIdle

	rdb := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		_ = rdb.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return rdb, nil
}
