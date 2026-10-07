package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Runtime environments.
const (
	EnvDev  = "dev"
	EnvProd = "prod"
)

// Config holds all settings, grouped by module.
type Config struct {
	App   App
	Log   Log
	MySQL MySQL
	Redis Redis
}

type App struct {
	Name string
	Port int
	Env  string // dev | prod
}

// Log mirrors the fields of github.com/beyenpay/x/logger.Config that we expose.
type Log struct {
	Level          string // empty = derived from App.Env
	Dir            string
	Filename       string
	MaxSize        int // MB
	MaxAge         int // days
	MaxBackups     int // count
	Compress       bool
	TimeZone       string
	DisableConsole bool
	DisableFile    bool
}

type MySQL struct {
	DSN          string
	MaxIdleConns int
	MaxOpenConns int
	MaxLifetime  int // minutes
	MaxIdleTime  int // minutes
}

type Redis struct {
	URL      string
	PoolSize int
	MinIdle  int
	MaxIdle  int
}

func (c *Config) IsDev() bool  { return c.App.Env == EnvDev }
func (c *Config) IsProd() bool { return c.App.Env == EnvProd }

// Load reads .env (optional) and the process environment, applies defaults and
// validates. Call it once at startup and pass the result down explicitly.
// Variables already set in the process environment take precedence over .env.
func Load() (*Config, error) {
	// A missing .env is fine (production injects real env vars);
	// a malformed one is not.
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("load .env: %w", err)
	}

	l := &loader{}

	cfg := &Config{
		App: App{
			Name: l.str("APP_NAME", "beyen"),
			Port: l.int("APP_PORT", 8020),
			Env:  l.str("APP_ENV", EnvProd), // safest default
		},
		Log: Log{
			Level:          l.str("LOG_LEVEL", ""),
			Dir:            l.str("LOG_DIR", "logs"),
			Filename:       l.str("LOG_FILENAME", "gateway.log"),
			MaxSize:        l.int("LOG_MAX_SIZE", 100),
			MaxAge:         l.int("LOG_MAX_AGE", 30),
			MaxBackups:     l.int("LOG_MAX_BACKUPS", 10),
			Compress:       l.bool("LOG_COMPRESS", true),
			TimeZone:       l.str("LOG_TIME_ZONE", "Local"),
			DisableConsole: l.bool("LOG_DISABLE_CONSOLE", false),
			DisableFile:    l.bool("LOG_DISABLE_FILE", false),
		},
		MySQL: MySQL{
			DSN:          l.required("MYSQL_DSN"),
			MaxIdleConns: l.int("MYSQL_MAX_IDLE_CONNS", 100),
			MaxOpenConns: l.int("MYSQL_MAX_OPEN_CONNS", 500),
			MaxLifetime:  l.int("MYSQL_MAX_LIFETIME", 120),
			MaxIdleTime:  l.int("MYSQL_MAX_IDLE_TIME", 60),
		},
		Redis: Redis{
			URL:      l.required("REDIS_URL"),
			PoolSize: l.int("REDIS_POOL_SIZE", 100),
			MinIdle:  l.int("REDIS_MIN_IDLE", 10),
			MaxIdle:  l.int("REDIS_MAX_IDLE", 50),
		},
	}

	cfg.validate(l)

	if err := l.err(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}
	return cfg, nil
}

func (c *Config) validate(l *loader) {
	if c.App.Env != EnvDev && c.App.Env != EnvProd {
		l.fail("APP_ENV must be %q or %q, got %q", EnvDev, EnvProd, c.App.Env)
	}
	if c.App.Port < 1 || c.App.Port > 65535 {
		l.fail("APP_PORT out of range: %d", c.App.Port)
	}
	if c.MySQL.MaxOpenConns < c.MySQL.MaxIdleConns {
		l.fail("MYSQL_MAX_OPEN_CONNS (%d) must not be less than MYSQL_MAX_IDLE_CONNS (%d)",
			c.MySQL.MaxOpenConns, c.MySQL.MaxIdleConns)
	}
	if c.MySQL.MaxIdleTime > c.MySQL.MaxLifetime {
		l.fail("MYSQL_MAX_IDLE_TIME (%d) must not exceed MYSQL_MAX_LIFETIME (%d)",
			c.MySQL.MaxIdleTime, c.MySQL.MaxLifetime)
	}

	// Derive the log level from the environment when not set explicitly.
	if c.Log.Level == "" {
		if c.IsDev() {
			c.Log.Level = "debug"
		} else {
			c.Log.Level = "info"
		}
	}
}

// loader reads env vars and collects every problem instead of stopping at the first.
type loader struct {
	errs []error
}

func (l *loader) fail(format string, args ...any) {
	l.errs = append(l.errs, fmt.Errorf(format, args...))
}

func (l *loader) err() error { return errors.Join(l.errs...) }

func (l *loader) str(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func (l *loader) required(key string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		l.fail("%s is required", key)
	}
	return v
}

func (l *loader) int(key string, def int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		l.fail("%s must be an integer, got %q", key, v)
		return def
	}
	return n
}

func (l *loader) bool(key string, def bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	b, err := strconv.ParseBool(v) // accepts true/TRUE/True/1/false/...
	if err != nil {
		l.fail("%s must be a boolean, got %q", key, v)
		return def
	}
	return b
}
