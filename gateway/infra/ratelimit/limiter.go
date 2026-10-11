// Package ratelimit is a Redis-backed token bucket. It knows nothing about
// HTTP: callers pass a scope (which limiter) and an id (who is calling).
package ratelimit

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/beyenpay/beyen/gateway/infra/rediskey"
)

// Rule allows Max requests per Window. Tokens refill continuously at
// Max/Window and the bucket holds Max, so this is an approximate window:
// a caller may spend Max at once, then recovers one token every Window/Max.
type Rule struct {
	Max    int
	Window time.Duration
}

// Result is the outcome of one Allow call.
type Result struct {
	Allowed    bool
	Remaining  int           // whole tokens left after this call
	RetryAfter time.Duration // zero when allowed
}

// checkTimeout bounds the Redis round trip, so an outage costs a request
// little time before the caller fails open.
const checkTimeout = 200 * time.Millisecond

// The bucket is a hash of {tokens, ts}. Time comes from Redis (TIME), not from
// the app servers, so instances with skewed clocks agree. The key expires once
// the bucket would be full again, so idle callers leave nothing behind.
// Returns {allowed, remaining tokens, retry-after in ms}.
var script = redis.NewScript(`
local rate  = tonumber(ARGV[1])
local burst = tonumber(ARGV[2])

local t = redis.call('TIME')
local now = t[1] * 1000 + math.floor(t[2] / 1000)

local state  = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts     = tonumber(state[2])
if tokens == nil then
  tokens = burst
  ts = now
end

tokens = math.min(burst, tokens + math.max(0, now - ts) * rate / 1000)

local allowed = 0
local retry = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
else
  retry = math.ceil((1 - tokens) / rate * 1000)
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(burst / rate * 1000) + 1000)
return {allowed, math.floor(tokens), retry}
`)

// Limiter checks token buckets stored in Redis.
type Limiter struct {
	rdb  *redis.Client
	keys rediskey.Keys
}

func New(rdb *redis.Client, keys rediskey.Keys) *Limiter {
	return &Limiter{rdb: rdb, keys: keys}
}

// Allow takes one token from the bucket (scope, id). A non-nil error means the
// check itself failed; the caller decides whether to fail open or closed.
func (l *Limiter) Allow(ctx context.Context, scope, id string, rule Rule) (Result, error) {
	if rule.Max < 1 || rule.Window <= 0 {
		return Result{}, errors.New("ratelimit: invalid rule")
	}
	ctx, cancel := context.WithTimeout(ctx, checkTimeout)
	defer cancel()

	rate := float64(rule.Max) / rule.Window.Seconds() // tokens per second
	vals, err := script.Run(ctx, l.rdb, []string{l.keys.RateLimit(scope, id)}, rate, rule.Max).Int64Slice()
	if err != nil {
		return Result{}, fmt.Errorf("ratelimit script: %w", err)
	}
	if len(vals) != 3 {
		return Result{}, fmt.Errorf("ratelimit: unexpected reply %v", vals)
	}
	return Result{
		Allowed:    vals[0] == 1,
		Remaining:  int(vals[1]),
		RetryAfter: time.Duration(vals[2]) * time.Millisecond,
	}, nil
}
