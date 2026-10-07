package main

import (
	"fmt"
	"os"

	_ "time/tzdata" // lets LOG_TIME_ZONE=Asia/Shanghai work in images without system tzdata

	"github.com/beyenpay/beyen/gateway/bootstrap"
	"github.com/beyenpay/beyen/gateway/config"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "fatal:", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	app, err := bootstrap.New(cfg)
	if err != nil {
		return err
	}
	defer app.Close()

	return app.Run()
}
