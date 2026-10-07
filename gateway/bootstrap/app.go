package bootstrap

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/x/logger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// App owns every long-lived resource and knows how to start and stop them.
type App struct {
	cfg     *config.Config
	server  *http.Server
	closers []func() error // released in reverse order of registration
}

// New initializes resources in dependency order: logger first, then (later)
// MySQL and Redis, then the HTTP server. If a step fails, everything created
// before it is closed before returning.
func New(cfg *config.Config) (*App, error) {
	a := &App{cfg: cfg}

	if err := initLogger(cfg.Log); err != nil {
		return nil, err
	}
	a.onClose(logger.Close)

	// Later, one block per resource, e.g.:
	//   db, err := initMySQL(cfg.MySQL)
	//   if err != nil {
	//       a.Close()
	//       return nil, err
	//   }
	//   a.onClose(db.Close)

	// Bridge net/http's internal errors (TLS handshake, bad conns...) into zap.
	stdLog, err := zap.NewStdLogAt(logger.Zap(), zapcore.ErrorLevel)
	if err != nil {
		a.Close()
		return nil, fmt.Errorf("std logger: %w", err)
	}

	a.server = &http.Server{
		Addr:              ":" + strconv.Itoa(cfg.App.Port),
		Handler:           newGin(cfg),
		ReadHeaderTimeout: 10 * time.Second,
		ErrorLog:          stdLog,
	}
	return a, nil
}

// Run serves HTTP until the server fails or SIGINT/SIGTERM is received,
// then shuts down gracefully.
func (a *App) Run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Bind first so a busy port fails here, before we claim to be listening.
	ln, err := net.Listen("tcp", a.server.Addr)
	if err != nil {
		logger.Error("listen failed", zap.Error(err))
		return err
	}

	errCh := make(chan error, 1)
	go func() { errCh <- a.server.Serve(ln) }()
	logger.Infof("listening on %s (env=%s)", ln.Addr(), a.cfg.App.Env)

	select {
	case err := <-errCh:
		logger.Error("server exited unexpectedly", zap.Error(err))
		return err
	case <-ctx.Done():
		stop() // restore default handling: a second Ctrl+C now force-quits
	}

	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := a.server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", zap.Error(err))
		return err
	}
	logger.Info("server stopped")
	return nil
}

// Close releases resources in reverse order. Safe to call more than once.
func (a *App) Close() {
	for i := len(a.closers) - 1; i >= 0; i-- {
		if err := a.closers[i](); err != nil {
			// the logger may already be closed, so write to stderr
			fmt.Fprintln(os.Stderr, "close:", err)
		}
	}
	a.closers = nil
}

func (a *App) onClose(fn func() error) {
	a.closers = append(a.closers, fn)
}
