# yukumo-gui — AGENTS Guide

This file provides an overview of the **yukumo-gui** project for AI agents and human maintainers.  
It describes the project structure, technology stack, coding conventions, and important rules.

---

## 1. Project Overview

**yukumo-gui** is a desktop GUI application built with [Wails v3](https://v3.wails.io/) (Go backend) and a [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) frontend.  
The application serves as a graphical interface for the `yukumo-script` library.

- **Backend language**: Go (1.25)
- **Frontend language**: TypeScript (ES Modules) with Vue 3 Composition API (`<script setup lang="ts">`)
- **Build tool**: Vite
- **Target platform**: Desktop (Windows, macOS, Linux)

### Key Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `github.com/wailsapp/wails/v3` | v3.0.0-beta.9 | Desktop framework (Go ↔ WebView services) |
| `@wailsio/runtime` | latest | Frontend runtime (events, WML) |
| `vue` | ^3.5.0 | Reactive UI framework |
| `typescript` | ^6.0.0 | TypeScript compiler (JS API line; compatible with `vue-tsc`) |
| `vue-tsc` | ^3.3.0 | Vue SFC type-checking |
| `vite` | ^7.0.0 | Frontend build tool & dev server |
| `@vitejs/plugin-vue` | ^6.0.0 | Vite plugin for Vue SFC support |
| `vue-router` | ^5.0.0 | File-based routing (hash history for Wails) |
| `@varlet/ui` | ^3.20.0 | Material Design 3 Vue component library |
| `@lucide/vue` | ^1.0.0 | Tree-shakable Lucide icons for Vue |
| `vue-i18n` | ^11.0.0 | Application UI internationalization (EN / JA / zh-CN) |
| `github.com/yukumo-group/yukumo-script` | local (`./yukumo-script`) | Core Yukumo script library (Go submodule) |
| `yukumo.js` | local (`./yukumo-js`) | AquesTalk on WebAssembly (JS submodule) |

### Project Configuration Files

| File | Purpose |
|---|---|
| `Taskfile.yml` | Wails v3 task runner (dev, build, package) |
| `build/config.yml` | Application metadata and dev-mode config |
| `go.mod` / `go.sum` | Go module definition and dependency lock file |
| `frontend/package.json` | Frontend pnpm dependencies and scripts |
| `frontend/tsconfig.json` | TypeScript project references (app + node) |
| `frontend/vite.config.ts` | Vite configuration (Vue plugin + Wails bindings) |
| `.gitignore` | Git ignore rules |
| `.gitmodules` | Submodule URLs for `yukumo-script` and `yukumo-js` |

---

## 2. Project Directory Layout

```
yukumo-gui/
├── app.go                  # Go: App service (ServiceStartup, bound methods)
├── main.go                 # Go: Entry point (Wails v3 application)
├── go.mod                  # Go module definition
├── go.sum                  # Go dependency checksums
├── Taskfile.yml            # Wails v3 tasks (dev / build / package)
├── README.md               # Project README
├── DOCUMENT.md             # Additional documentation
├── AGENTS.md               # This file
├── .gitignore              # Git ignore rules
├── .gitmodules             # yukumo-script + yukumo-js submodule URLs
├── yukumo-script/          # Git submodule: Go yukumo-script library
├── yukumo-js/              # Git submodule: yukumo.js (AquesTalk on WASM)
│
├── build/                  # Build assets and platform Taskfiles
│   ├── appicon.png
│   ├── config.yml          # App metadata + wails3 dev config
│   ├── darwin/             # macOS-specific build assets
│   ├── windows/            # Windows-specific build assets
│   ├── linux/              # Linux-specific build assets
│   ├── android/            # Android build assets
│   └── ios/                # iOS build assets
│
├── frontend/               # Frontend (Vue 3 + Vite)
│   ├── index.html          # HTML entry point
│   ├── package.json        # pnpm dependencies
│   ├── pnpm-lock.yaml      # pnpm lockfile
│   ├── pnpm-workspace.yaml # pnpm settings (e.g. allowBuilds)
│   ├── .npmrc              # pnpm config (shamefully-hoist for Wails)
│   ├── env.d.ts            # Ambient Vite / Vue module declarations
│   ├── tsconfig.json       # TypeScript project references
│   ├── tsconfig.app.json   # App (src + bindings) typecheck config
│   ├── tsconfig.node.json  # Vite config typecheck config
│   ├── vite.config.ts      # Vite configuration
│   ├── README.md           # Frontend-specific README
│   │
│   ├── src/                # Frontend source code
│   │   ├── main.ts         # Vue app bootstrap
│   │   ├── App.vue         # Root Vue component
│   │   ├── style.css       # Global styles
│   │   ├── router/         # Vue Router (file-based auto-routes)
│   │   ├── pages/          # File-based route pages
│   │   ├── navigation/     # Shared nav destination lists (label keys, not raw text)
│   │   ├── layouts/        # Shared shells (e.g. MainLayout)
│   │   ├── theme/          # MD3 theme preference + StyleProvider
│   │   ├── i18n/           # vue-i18n setup + locale message catalogs
│   │   │   ├── index.ts    # createI18n, setLocale, Varlet Locale sync
│   │   │   └── messages/   # en-US.ts, ja-JP.ts, zh-CN.ts
│   │   │
│   │   ├── assets/         # Static assets
│   │   │   ├── fonts/      # Custom fonts (e.g., Nunito)
│   │   │   └── images/     # Image assets (e.g., logo)
│   │   │
│   │   └── components/     # Vue components
│   │       └── navigation/ # Rail / bottom navigation
│   │
│   └── bindings/           # AUTO-GENERATED by `wails3 generate bindings` — DO NOT EDIT
│       └── yukumo-gui/     # → JS/TS bindings grouped by Go service name
```

---

## 3. How to Call Go Methods from TypeScript

### 3.1. Auto-Generated Bridge: `frontend/bindings/yukumo-gui/`

These files are **automatically generated** by `wails3 generate bindings` (also run by `wails3 build` / `wails3 dev`). Bindings are grouped by Go module and service name.

- **Do NOT modify** these files under any circumstances.
- If you need a new Go method to be callable from TypeScript, add an exported method to the `App` service in `app.go` and regenerate with `wails3 generate bindings` (or restart `wails3 dev`).

### 3.2. How to Use Go Methods in Vue Components

```typescript
import { Greet } from '../bindings/yukumo-gui/app';

Greet('World').then((result: string) => {
  console.log(result); // "Hello World, It's show time!"
});
```

### 3.3. Adding a New Go Method (Frontend-Bound)

1. **Maintainer action**: Add a new exported method to the `App` struct in `app.go`.
2. **Rebuild**: Stop and restart `wails3 dev` (or run `wails3 generate bindings`) to regenerate the bridge.
3. **Import and use** in Vue components from `frontend/bindings/yukumo-gui/app`.

### 3.4. Wails Runtime API

Import from `@wailsio/runtime` (not generated files):

```typescript
import { Events } from '@wailsio/runtime';

Events.On('update', (event) => {
  console.log(event.data);
});
Events.Emit('action', data);
```

---

## 4. Frontend — TypeScript / Vue 3

### 4.1. Coding Conventions (TypeScript)

All **TypeScript / Vue frontend code** must follow these rules:

1. **ES Module syntax**: Use `import` / `export` (no CommonJS `require()`).
2. **Vue 3 Composition API**: Use `<script setup lang="ts">` syntax for Single-File Components (SFCs).
3. **Reactive state**: Use Vue's `reactive()` or `ref()` for state management, with explicit TypeScript types/interfaces.
4. **Naming conventions**:
   - Variables / functions: `camelCase`
   - Component names: `PascalCase`
   - Types / interfaces: `PascalCase`
   - Files: `PascalCase.vue` for components, `kebab-case.ts` for utility files
5. **Comments**: Prefer self-explanatory names over commentary. Comment only what a reader cannot infer from symbols, types, or nearby code (e.g. Wails/WebView constraints, intentional asymmetries, non-obvious trade-offs).
   - **Do NOT** add file-level banner / block comments at the top of each file
   - **Do NOT** restate what a function, prop, or component name already says
   - **Do NOT** narrate obvious control flow or Vue/Tailwind boilerplate
   - Keep necessary comments short (usually one line)
6. **Imports**: Group imports logically — Vue core first, then project components, then Wails bindings. Prefer `import type` for type-only imports.
7. **Template organization**: Keep templates clean and well-indented; extract complex logic into computed properties or methods.
8. **TypeScript version**: Stay on TypeScript 6 (`typescript@^6`) so `vue-tsc` can type-check Vue SFCs. Do not upgrade to TypeScript 7 until `vue-tsc` supports its programmatic API.
9. **Varlet Tailwind color utilities**: The project uses `@varlet/preset-tailwindcss`. Map `--color-*` tokens to preset utilities — never write arbitrary `-[var(--color-…)]` classes in templates.

   | Token | Prefer | Avoid |
   |---|---|---|
   | `--color-text` | `text-text`, `bg-text`, `border-text` | `text-[var(--color-text)]` |
   | `--color-on-surface-variant` | `text-on-surface-variant`, `border-on-surface-variant` | `border-[var(--color-on-surface-variant)]` |
   | `--color-body` | `bg-body` | `bg-[var(--color-body)]` |
   | `--color-primary` | `text-primary`, `bg-primary` | `text-[var(--color-primary)]` |
   | `--color-surface-container` | `bg-surface-container` | `bg-[var(--color-surface-container)]` |

   Same pattern for other preset colors (`outline`, `danger`, `surface-container-high`, …). Raw `var(--color-*)` is fine in plain CSS (e.g. `style.css`), but Tailwind class names must use the preset utilities.

### 4.2. Entry Point: `frontend/src/main.ts`

```typescript
import { createApp } from 'vue';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style';
import '@varlet/touch-emulator';

import App from './App.vue';
import router from './router';
import { i18n, initI18n } from './i18n';
import { initTheme } from './theme/theme';
import './style.css';

initTheme();
initI18n();
createApp(App).use(Varlet).use(i18n).use(router).mount('#app');
```

### 4.3. Internationalization (i18n)

Supported locales: **`en-US`**, **`ja-JP`**, **`zh-CN`**.

| Layer | Responsibility |
|---|---|
| `vue-i18n` (`frontend/src/i18n/`) | All application UI copy (pages, nav labels, settings, aria-labels) |
| Varlet `Locale` API | Built-in Varlet component strings (dialogs, pickers, etc.) — see [Varlet Locale](https://varletjs.org/#/zh-CN/locale) |

Locale preference is persisted in `localStorage` (`yukumo-locale`) and synced to:
1. `i18n.global.locale`
2. `Locale.use(...)` for Varlet
3. `document.documentElement.lang`

#### Rules for agents (mandatory)

1. **Never hardcode user-visible UI strings** in templates or TS (titles, labels, descriptions, button text, aria-labels, empty states, errors shown to users).
2. Use `useI18n()` / `t('key.path')` in Vue SFCs. Prefer nested keys that mirror UI structure (`pages.settings.appearance.title`).
3. When adding or changing copy, update **all three** message files in the same change:
   - `frontend/src/i18n/messages/en-US.ts`
   - `frontend/src/i18n/messages/ja-JP.ts`
   - `frontend/src/i18n/messages/zh-CN.ts`
4. Keep message object **keys and nesting identical** across the three locale files. English is the structural source of truth.
5. Navigation destinations store `labelKey` strings (not translated text). Components call `t(destination.labelKey)`.
6. Changing language at runtime must go through `setLocale()` from `frontend/src/i18n/index.ts` so vue-i18n and Varlet stay in sync. Do not call `Locale.use` or mutate `i18n.global.locale` ad hoc from feature code.
7. Do not invent new locale codes unless the maintainer asks. Supported set is only `en-US` / `ja-JP` / `zh-CN`.

#### Example

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h1>{{ t('pages.generate.title') }}</h1>
</template>
```

### 4.4. Root Component: `frontend/src/App.vue`

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
</template>
```

### 4.5. Example: Calling a Go Binding from a Vue Component

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { Greet } from '../../bindings/yukumo-gui/app';

interface HelloWorldData {
  name: string;
  resultText: string;
}

const data = reactive<HelloWorldData>({
  name: '',
  resultText: 'Please enter your name below 👇',
});

function greet(): void {
  Greet(data.name).then((result: string) => {
    data.resultText = result;
  });
}
</script>

<template>
  <main>
    <div id="result" class="result">{{ data.resultText }}</div>
    <div id="input" class="input-box">
      <input
        id="name"
        v-model="data.name"
        autocomplete="off"
        class="input"
        type="text"
      />
      <button class="btn" @click="greet">Greet</button>
    </div>
  </main>
</template>

<style scoped>
.result {
  height: 20px;
  line-height: 20px;
  margin: 1.5rem auto;
}

.input-box .btn {
  width: 60px;
  height: 30px;
  line-height: 30px;
  border-radius: 3px;
  border: none;
  margin: 0 0 0 20px;
  padding: 0 8px;
  cursor: pointer;
}

.input-box .btn:hover {
  background-image: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%);
  color: #333333;
}

.input-box .input {
  border: none;
  border-radius: 3px;
  outline: none;
  height: 30px;
  line-height: 30px;
  padding: 0 10px;
  background-color: rgba(240, 240, 240, 1);
  -webkit-font-smoothing: antialiased;
}

.input-box .input:hover,
.input-box .input:focus {
  border: none;
  background-color: rgba(255, 255, 255, 1);
}
</style>
```

### 4.6. Global Styles: `frontend/src/style.css`

```css
@import 'tailwindcss';
@config '../tailwind.config.js';

html {
  margin: 0;
  padding: 0;
  text-align: left;
  color: var(--color-text, #2c3e50);
}

body {
  margin: 0;
  padding: 0;
  font-family:
    'Nunito',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@font-face {
  font-family: 'Nunito';
  font-style: normal;
  font-weight: 400;
  src:
    local(''),
    url('assets/fonts/nunito-v16-latin-regular.woff2') format('woff2');
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
```

### 4.7. Build Configuration: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'vue-router/vite';
import tailwindcss from '@tailwindcss/vite';
import wails from '@wailsio/runtime/plugins/vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
    }),
    vue(),
    tailwindcss(),
    wails('./bindings'),
  ],
});
```

---

## 5. Development Workflow

Clone with submodules (`yukumo-script` and `yukumo-js`):

```bash
git clone --recurse-submodules https://github.com/yukumo-group/yukumo-gui.git
# already cloned:
git submodule update --init --recursive
```

### 5.1. Live Development

```bash
# Run in live development mode with hot-reload
wails3 dev

# The Vite dev server will provide hot-reload for frontend changes.
# Go method changes require regenerating bindings (restart `wails3 dev`).
```

### 5.2. Building for Production

```bash
# Build a redistributable production package
wails3 build
```

### 5.3. Frontend-Only Development (Browser)

When running `wails3 dev`, Vite serves the frontend (default port `9245`).  
You can open that URL in a browser to develop the frontend with access to Go methods via the Wails dev bridge.

---

## 6. Rules for AI Agents

When working on this project, follow these rules:

### ✅ Do
- Follow the **TypeScript coding conventions** defined in Section 4.1.
- Comment only non-obvious intent; keep comments sparse and short (see Section 4.1).
- Use **Vue 3 Composition API** with `<script setup lang="ts">` for all Vue components.
- Route **all user-visible UI text** through `vue-i18n` (`t('...')`) and keep `en-US` / `ja-JP` / `zh-CN` message files in sync (see Section 4.3).
- Use **Varlet Tailwind color utilities** (`text-text`, `border-on-surface-variant`, `bg-body`, …) instead of arbitrary `-[var(--color-…)]` classes (see Section 4.1 §9).
- Ask for clarification if a task is ambiguous.

### ❌ Do NOT
- **Do NOT** add file-level banner comments, JSDoc that restates names, or other comment bloat.
- **Do NOT modify** Go backend code (`app.go`, `main.go`, or any `.go` file) unless explicitly instructed by the maintainer.
- **Do NOT edit** files inside `frontend/bindings/` — they are auto-generated.
- **Do NOT use** CommonJS (`require()`) — the project uses ES Modules only.
- **Do NOT add** TypeScript/JavaScript frameworks or libraries without maintainer approval.
- **Do NOT upgrade** to TypeScript 7 while `vue-tsc` still requires the TypeScript 6 API.
- **Do NOT fix** missing types, undefined references, or build errors in Go code — notify the maintainer instead.
- **Do NOT hardcode** UI strings in components/pages; add keys to all three locale catalogs instead.
- **Do NOT** change locale by calling Varlet `Locale.use` or mutating `i18n.global.locale` directly — use `setLocale()`.
- **Do NOT** write Tailwind classes like `text-[var(--color-text)]` or `border-[var(--color-on-surface-variant)]` — use `text-text` / `border-on-surface-variant` from `@varlet/preset-tailwindcss`.
### ⚠️ Installing pnpm Modules
- **Always `cd` into `frontend/` before running any pnpm command.** The `package.json` lives in `frontend/`, not the project root.
  ```bash
  # ✅ Correct — install from inside frontend/
  cd frontend && pnpm add <package-name>
  
  # ❌ Wrong — this will fail or install in the wrong place
  pnpm add <package-name>   # (from project root)
  ```
- If you accidentally install a package in the project root, delete the `node_modules` and lockfile created there, then reinstall inside `frontend/`.
- Use **pnpm** only — do not use npm or yarn (no `package-lock.json` / `yarn.lock`).

### ⚠️ If You Encounter Issues
- If you find a bug, missing import, or type error in **Go code**: notify the maintainer — do not fix it yourself.
- If you find a bug in **auto-generated files** (`frontend/bindings/`): notify the maintainer, as the fix needs to happen in the Go source or build pipeline.
- If you are unsure about an architectural decision: stop and ask the maintainer.

---

## 7. Maintenance Notes

| Topic | Contact / Notes |
|---|---|
| Go backend (`yukumo-script` module) | Git submodule at `./yukumo-script`. Contact maintainer for issues. |
| yukumo.js | Git submodule at `./yukumo-js`. |
| Wails framework version | v3.0.0-beta.9 — check [v3.wails.io](https://v3.wails.io/) for upgrade guides. |
| Vue 3 version | ^3.5.0 — uses `<script setup lang="ts">` SFC syntax. |
| vue-i18n | ^11.0.0 — Composition API mode (`legacy: false`); locales `en-US` / `ja-JP` / `zh-CN`. |
| TypeScript version | ^6.0.0 — required for `vue-tsc` SFC type-checking. |
| Vite version | ^7.0.0 — uses `@vitejs/plugin-vue` v6. |
| Go version | 1.25.0 (go.mod) |

---

## 8. Quick Reference

### Available pnpm Scripts (from `frontend/`)

```bash
pnpm run dev        # Start Vite dev server
pnpm run typecheck  # Type-check with vue-tsc
pnpm run build      # Type-check then build frontend for production
pnpm run build:dev  # Unminified development frontend build (used by wails3)
pnpm run preview    # Preview production build locally
```

### Available Wails Commands (from project root)

```bash
wails3 dev       # Run in development mode with live reload
wails3 build     # Build production binary
wails3 generate bindings  # Regenerate frontend/bindings
```