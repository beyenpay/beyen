package bootstrap

import (
	"net/http"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/infra/ratelimit"
	"github.com/beyenpay/beyen/gateway/infra/rediskey"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/beyen/gateway/router"
	"github.com/beyenpay/beyen/gateway/service/auth"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/beyen/gateway/service/me"
	"github.com/beyenpay/beyen/gateway/service/user"
)

// buildHandler creates the repositories and services and hands them to the router.
// It is the only place where concrete dependencies are wired together.
func buildHandler(cfg *config.Config, gdb *gorm.DB, rdb *redis.Client) http.Handler {
	keys := rediskey.New(cfg.App.Name)
	limiter := ratelimit.New(rdb, keys)

	userRepo := repository.NewUserRepo(gdb)
	projectRepo := repository.NewProjectRepo(gdb)
	memberRepo := repository.NewProjectMemberRepo(gdb)
	cache := repository.NewCache(rdb)

	return router.New(router.Deps{
		Config:  cfg,
		DB:      gdb,
		Redis:   rdb,
		Limiter: limiter,
		User:    user.New(userRepo),
		Auth:    auth.New(cfg.Session, userRepo, repository.NewSessionRepo(rdb, keys), limiter),
		Authz:   authz.New(projectRepo, memberRepo, cache, keys),
		Me:      me.New(userRepo, projectRepo, memberRepo, cache, keys),
	})
}
