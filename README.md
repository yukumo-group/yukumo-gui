# yukumo-gui

Desktop GUI for [yukumo-script](https://github.com/yukumo-group/yukumo-script), built with [Wails v3](https://v3.wails.io/) and Vue 3.

This repository is used as a git submodule of `yukumo-script` (path `yukumo-gui/`). The Go module `github.com/yukumo-group/yukumo-script` is replaced with `../`.

## Live Development

```bash
wails3 dev
```

This starts the app with hot-reload for frontend changes. Vite listens on port `9245` by default (`WAILS_VITE_PORT`).

## Building

```bash
wails3 build
```

Production binaries are written under `bin/`. Frontend dependencies are installed with **pnpm**.
