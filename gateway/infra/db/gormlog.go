package db

import (
	"context"
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/beyenpay/x/logger"
)

const slowThreshold = 200 * time.Millisecond

// gormLogger adapts GORM's logger.Interface to the project's zap logger.
type gormLogger struct {
	zl    *zap.Logger
	level gormlogger.LogLevel
}

func newGormLogger(level gormlogger.LogLevel) *gormLogger {
	// the caller would always be this file, so it is switched off
	return &gormLogger{zl: logger.Zap().WithOptions(zap.WithCaller(false)), level: level}
}

func (l *gormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	c := *l
	c.level = level
	return &c
}

// ParamsFilter drops bound values so SQL logs show "?" instead of emails/hashes.
func (l *gormLogger) ParamsFilter(_ context.Context, sql string, _ ...any) (string, []any) {
	return sql, nil
}

func (l *gormLogger) Info(_ context.Context, msg string, args ...any) {
	if l.level >= gormlogger.Info {
		l.zl.Sugar().Infof(msg, args...)
	}
}

func (l *gormLogger) Warn(_ context.Context, msg string, args ...any) {
	if l.level >= gormlogger.Warn {
		l.zl.Sugar().Warnf(msg, args...)
	}
}

func (l *gormLogger) Error(_ context.Context, msg string, args ...any) {
	if l.level >= gormlogger.Error {
		l.zl.Sugar().Errorf(msg, args...)
	}
}

// Trace logs one entry per SQL: errors (except "record not found"), slow
// queries, and, at Info level only, every query at debug level.
func (l *gormLogger) Trace(_ context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.level <= gormlogger.Silent {
		return
	}
	elapsed := time.Since(begin)
	switch {
	case err != nil && !errors.Is(err, gorm.ErrRecordNotFound) && l.level >= gormlogger.Error:
		sql, rows := fc()
		l.zl.Error("sql error", zap.Error(err), zap.String("sql", sql),
			zap.Int64("rows", rows), zap.Duration("elapsed", elapsed))
	case elapsed > slowThreshold && l.level >= gormlogger.Warn:
		sql, rows := fc()
		l.zl.Warn("slow sql", zap.String("sql", sql),
			zap.Int64("rows", rows), zap.Duration("elapsed", elapsed))
	case l.level >= gormlogger.Info:
		sql, rows := fc()
		l.zl.Debug("sql", zap.String("sql", sql),
			zap.Int64("rows", rows), zap.Duration("elapsed", elapsed))
	}
}
