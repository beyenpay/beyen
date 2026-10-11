// Command projectctl manages projects from the command line until the admin
// console can do it. See the usage notes at the bottom of this file.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"time"
	_ "time/tzdata" // lets LOG_TIME_ZONE=Asia/Shanghai work in images without system tzdata

	"github.com/beyenpay/beyen/gateway/bootstrap"
	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/infra/db"
	"github.com/beyenpay/beyen/gateway/infra/rediskey"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/beyen/gateway/service/authz"
	"github.com/beyenpay/beyen/gateway/service/project"
	"github.com/beyenpay/x/logger"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

// action is one parsed subcommand, ready to run against the project service.
type action func(ctx context.Context, svc *project.Service) error

func run(args []string) error {
	if len(args) == 0 {
		return errors.New("missing command, want: create | add-member")
	}

	// Parse first, so a typo fails before any connection is opened.
	act, err := parse(args[0], args[1:])
	if errors.Is(err, flag.ErrHelp) {
		return nil
	}
	if err != nil {
		return err
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	cfg.Log.DisableFile = true // a one-off command must not write into the server log file
	cfg.Log.Level = "warn"
	if err := bootstrap.InitLogger(cfg.Log); err != nil {
		return err
	}
	defer func() { _ = logger.Close() }()

	gdb, err := db.NewMySQL(cfg.MySQL)
	if err != nil {
		return err
	}
	defer func() { _ = db.CloseMySQL(gdb) }()

	// Redis is needed to drop cached permission decisions of a running server.
	rdb, err := db.NewRedis(cfg.Redis)
	if err != nil {
		return err
	}
	defer func() { _ = rdb.Close() }()

	projects := repository.NewProjectRepo(gdb)
	members := repository.NewProjectMemberRepo(gdb)
	az := authz.New(projects, members, repository.NewCache(rdb), rediskey.New(cfg.App.Name))
	svc := project.New(projects, members, repository.NewUserRepo(gdb), az)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	return act(ctx, svc)
}

func parse(cmd string, args []string) (action, error) {
	switch cmd {
	case "create":
		fs := flag.NewFlagSet("create", flag.ContinueOnError)
		name := fs.String("name", "", "project name (required)")
		if err := fs.Parse(args); err != nil {
			return nil, err
		}
		if *name == "" {
			fs.Usage()
			return nil, errors.New("-name is required")
		}
		return func(ctx context.Context, svc *project.Service) error {
			p, err := svc.Create(ctx, *name)
			if err != nil {
				return err
			}
			fmt.Printf("created project: id=%d name=%q\n", p.ID, p.Name)
			return nil
		}, nil

	case "add-member":
		fs := flag.NewFlagSet("add-member", flag.ContinueOnError)
		projectID := fs.Int("project", 0, "project id (required)")
		addr := fs.String("email", "", "email of an existing user (required)")
		role := fs.String("role", "", "manager | developer | support (required)")
		if err := fs.Parse(args); err != nil {
			return nil, err
		}
		if *projectID < 1 || *addr == "" || *role == "" {
			fs.Usage()
			return nil, errors.New("-project, -email and -role are required")
		}
		return func(ctx context.Context, svc *project.Service) error {
			_, err := svc.AddMember(ctx, *projectID, *addr, model.ProjectRole(*role))
			if errors.Is(err, project.ErrUserNotFound) {
				return fmt.Errorf("%w: create the account first with: go run ./cmd/createuser -email %s", err, *addr)
			}
			if err != nil {
				return err
			}
			fmt.Printf("added %s to project %d as %s\n", *addr, *projectID, *role)
			return nil
		}, nil

	default:
		return nil, fmt.Errorf("unknown command %q, want: create | add-member", cmd)
	}
}

// Usage
//
// Run from the gateway/ directory: config.Load reads .env from the working
// directory. The server must have started once so the tables exist.
//
//    Create a project:
//      go run ./cmd/projectctl create -name "My Project"
//
//    Add an existing user to a project. Roles: manager | developer | support.
//    A user holds exactly one role per project:
//      go run ./cmd/projectctl add-member -project 1 -email user@example.com -role manager
//
//    Typical first setup:
//      go run ./cmd/createuser -admin -email admin@example.com
//      go run ./cmd/createuser -email owner@example.com
//      go run ./cmd/projectctl create -name "My Project"
//      go run ./cmd/projectctl add-member -project 1 -email owner@example.com -role manager
//
// The platform admin needs no membership: it reaches every project already.
// Deleting or freezing a project is done by the admin in the system console.
