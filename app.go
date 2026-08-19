package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/yukumo-group/yukumo-script/pkg/api"
)

// App is the frontend-bound Wails service.
type App struct{}

// ServiceStartup initialises yukumo-script runtime dirs, examples, and data.
func (a *App) ServiceStartup(_ context.Context, _ application.ServiceOptions) error {
	return api.Init()
}

// Greet returns a greeting for the given name.
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
