package db

import (
	"context"
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/beyenpay/beyen/gateway/config"
)

// NewMySQL opens the pool, applies pool settings and verifies connectivity.
// cfg.LogSQL=true logs every statement (at debug level); otherwise only errors
// and slow queries are logged.
func NewMySQL(cfg config.MySQL) (*gorm.DB, error) {
	level := gormlogger.Warn
	if cfg.LogSQL {
		level = gormlogger.Info
	}

	gdb, err := gorm.Open(mysql.Open(cfg.DSN), &gorm.Config{
		Logger:         newGormLogger(level),
		TranslateError: true, // driver errors → gorm.ErrDuplicatedKey etc., portable across dialects
	})
	if err != nil {
		return nil, fmt.Errorf("open mysql: %w", err)
	}

	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, fmt.Errorf("mysql sql.DB: %w", err)
	}
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Minute)
	sqlDB.SetConnMaxIdleTime(time.Duration(cfg.MaxIdleTime) * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("ping mysql: %w", err)
	}
	return gdb, nil
}

// CloseMySQL closes the underlying pool.
func CloseMySQL(gdb *gorm.DB) error {
	sqlDB, err := gdb.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
