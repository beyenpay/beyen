// Command createuser creates a user from the command line. It is meant for
// setting up the first platform admin before the web setup flow exists.
//
//	go run ./cmd/createuser -admin -email admin@example.com
//
// The password is prompted for without echo. When stdin is not a terminal one
// line is read from it instead, so the command also works in scripts. The
// password is never taken from a flag: it would show up in the shell history
// and in the process list.
package main

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
	_ "time/tzdata" // lets LOG_TIME_ZONE=Asia/Shanghai work in images without system tzdata

	"golang.org/x/term"

	"github.com/beyenpay/beyen/gateway/bootstrap"
	"github.com/beyenpay/beyen/gateway/config"
	"github.com/beyenpay/beyen/gateway/infra/db"
	"github.com/beyenpay/beyen/gateway/model"
	"github.com/beyenpay/beyen/gateway/repository"
	"github.com/beyenpay/beyen/gateway/service/user"
	"github.com/beyenpay/x/logger"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	email := flag.String("email", "", "email of the new user (required)")
	admin := flag.Bool("admin", false, "create a platform admin")
	flag.Parse()
	if *email == "" {
		flag.Usage()
		return errors.New("-email is required")
	}

	pw, err := readPassword()
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

	in := user.CreateInput{Email: *email, Password: pw}
	kind := "user"
	if *admin {
		in.SystemRole = model.SystemRoleAdmin
		kind = "admin"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	u, err := user.New(repository.NewUserRepo(gdb)).Create(ctx, in)
	if errors.Is(err, user.ErrEmailTaken) {
		return fmt.Errorf("%s is already registered; to make an existing user an admin, set users.system_role in MySQL", *email)
	}
	if err != nil {
		return err
	}
	fmt.Printf("created %s: id=%d email=%s\n", kind, u.ID, u.Email)
	return nil
}

// readPassword prompts twice on a terminal, or reads one line from a pipe.
func readPassword() (string, error) {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		line, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil && !(errors.Is(err, io.EOF) && line != "") {
			return "", fmt.Errorf("read password from stdin: %w", err)
		}
		return strings.TrimRight(line, "\r\n"), nil
	}

	fmt.Fprint(os.Stderr, "Password: ")
	p1, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("read password: %w", err)
	}
	fmt.Fprint(os.Stderr, "Confirm password: ")
	p2, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("read password: %w", err)
	}
	if !bytes.Equal(p1, p2) {
		return "", errors.New("passwords do not match")
	}
	return string(p1), nil
}

// Usage
//
// Run from the gateway/ directory: config.Load reads .env from the working
// directory. The server must have started once so the tables exist.
//
//    Create the first platform admin (prompts for the password twice):
//      go run ./cmd/createuser -admin -email admin@example.com
//
//    Create a normal user:
//      go run ./cmd/createuser -email user@example.com
//
//    Script it by piping the password on stdin (never pass it as a flag):
//      printf 'Secret-Pass123\n' | go run ./cmd/createuser -email user@example.com
//
// Password rules: 8 to 128 characters with at least one letter and one digit,
// and it must not contain the part of the email before the @ (when 4+ chars).
//
// To put a user into a project, use cmd/projectctl add-member.
// To promote an existing user to admin, set users.system_role = 'admin' in MySQL.
