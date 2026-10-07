package bootstrap

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/beyenpay/beyen/gateway/infra/db"
	"github.com/beyenpay/beyen/gateway/model"
)

// migrate runs AutoMigrate under a cross-instance lock. Instances starting
// together queue up, and every run after the first is a no-op.
// The timeout only bounds acquiring the lock, not the migration itself.
// Register every model in the AutoMigrate call below.
func migrate(gdb *gorm.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// AutoMigrate probes information_schema with dozens of statements per
	// table. Keep them out of the SQL log; errors and slow queries still show.
	quiet := gdb.Session(&gorm.Session{Logger: gdb.Logger.LogMode(gormlogger.Warn)})

	return db.WithMigrationLock(ctx, gdb, func() error {
		if err := quiet.AutoMigrate(&model.User{}); err != nil {
			return fmt.Errorf("auto migrate: %w", err)
		}
		return nil
	})
}
