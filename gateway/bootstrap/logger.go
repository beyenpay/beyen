package bootstrap

import (
	"fmt"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/x/logger"
)

// initLogger configures the package-level logger from cfg.
func initLogger(cfg config.Log) error {
	err := logger.Init(&logger.Config{
		Level:          cfg.Level,
		Dir:            cfg.Dir,
		Filename:       cfg.Filename,
		MaxSize:        cfg.MaxSize,
		MaxAge:         cfg.MaxAge,
		MaxBackups:     cfg.MaxBackups,
		Compress:       cfg.Compress,
		TimeZone:       cfg.TimeZone,
		DisableConsole: cfg.DisableConsole,
		DisableFile:    cfg.DisableFile,
	})
	if err != nil {
		return fmt.Errorf("init logger: %w", err)
	}
	return nil
}
