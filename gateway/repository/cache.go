package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/beyenpay/x/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Cache is a small JSON cache-aside helper over Redis. Callers build the keys
// with rediskey and decide what to cache and for how long.
type Cache struct{ rdb *redis.Client }

func NewCache(rdb *redis.Client) *Cache { return &Cache{rdb: rdb} }

// Get reports whether key was found. A value that cannot be decoded returns an
// error, so the caller can log it, reload from the source and overwrite it.
func (c *Cache) Get(ctx context.Context, key string, dst any) (bool, error) {
	data, err := c.rdb.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("cache get: %w", err)
	}
	if err := json.Unmarshal(data, dst); err != nil {
		return false, fmt.Errorf("cache decode: %w", err)
	}
	return true, nil
}

func (c *Cache) Set(ctx context.Context, key string, v any, ttl time.Duration) error {
	if ttl <= 0 {
		return errors.New("cache set: ttl must be positive") // a zero TTL would never expire
	}
	data, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("cache encode: %w", err)
	}
	if err := c.rdb.Set(ctx, key, data, ttl).Err(); err != nil {
		return fmt.Errorf("cache set: %w", err)
	}
	return nil
}

func (c *Cache) Del(ctx context.Context, keys ...string) error {
	if err := c.rdb.Del(ctx, keys...).Err(); err != nil {
		return fmt.Errorf("cache del: %w", err)
	}
	return nil
}

// Remember is cache-aside in one call: return the cached value, or run load,
// cache its result for ttl and return it. Redis trouble is logged and skipped,
// because the cache is an optimization, not a dependency. A failed load is not
// cached. Reading never extends the ttl, so an entry always dies on schedule
// even if an invalidation was missed.
func Remember[T any](ctx context.Context, c *Cache, key string, ttl time.Duration, load func(context.Context) (T, error)) (T, error) {
	var v T
	if ok, err := c.Get(ctx, key, &v); err != nil {
		logger.Error("cache read failed", zap.String("key", key), zap.Error(err))
	} else if ok {
		return v, nil
	}

	v, err := load(ctx)
	if err != nil {
		var zero T
		return zero, err
	}
	if err := c.Set(ctx, key, v, ttl); err != nil {
		logger.Error("cache write failed", zap.String("key", key), zap.Error(err))
	}
	return v, nil
}
