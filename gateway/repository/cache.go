package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
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
