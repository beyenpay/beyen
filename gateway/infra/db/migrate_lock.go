package db

import (
	"context"
	"database/sql"
	"fmt"

	"gorm.io/gorm"
)

const (
	migrationLockName    = "beyen:migrate"
	migrationLockTimeout = 60 // seconds to wait for another instance to finish
)

// WithMigrationLock runs fn while holding a cross-instance MySQL advisory
// lock. Other instances block here until the holder is done; if the holder
// dies, the server drops the lock when its connection closes.
// Needs at least 2 pool connections: one holds the lock, fn uses another.
func WithMigrationLock(ctx context.Context, gdb *gorm.DB, fn func() error) error {
	sqlDB, err := gdb.DB()
	if err != nil {
		return fmt.Errorf("migration lock: %w", err)
	}

	// GET_LOCK is per session, so lock and unlock must use the same
	// dedicated connection, not whichever one the pool hands out.
	conn, err := sqlDB.Conn(ctx)
	if err != nil {
		return fmt.Errorf("migration lock conn: %w", err)
	}
	defer conn.Close()

	var got sql.NullInt64
	if err := conn.QueryRowContext(ctx, "SELECT GET_LOCK(?, ?)", migrationLockName, migrationLockTimeout).Scan(&got); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	if !got.Valid || got.Int64 != 1 {
		return fmt.Errorf("acquire migration lock: timed out after %ds", migrationLockTimeout)
	}
	defer func() {
		// if the connection is already broken, the server has released the lock
		_, _ = conn.ExecContext(context.Background(), "SELECT RELEASE_LOCK(?)", migrationLockName)
	}()

	return fn()
}
