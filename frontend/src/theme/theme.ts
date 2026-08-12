import { computed, onScopeDispose, ref, type Ref } from 'vue';
import { StyleProvider, Themes } from '@varlet/ui';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemePointer {
  x: number;
  y: number;
}

const STORAGE_KEY = 'yukumo-theme-preference';

const preference: Ref<ThemePreference> = ref(readStoredPreference());
const systemDark = ref(getSystemPrefersDark());

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null;
let initialized = false;

export const themePreference = computed(() => preference.value);

export const resolvedTheme = computed<ResolvedTheme>(() =>
  resolveTheme(preference.value, systemDark.value),
);

export function initTheme(): void {
  if (initialized) {
    applyResolvedTheme(resolvedTheme.value);
    return;
  }
  initialized = true;

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = mediaQuery.matches;
  mediaListener = (event: MediaQueryListEvent) => {
    systemDark.value = event.matches;
    if (preference.value === 'system') {
      applyResolvedTheme(resolveTheme('system', event.matches));
    }
  };
  mediaQuery.addEventListener('change', mediaListener);

  applyResolvedTheme(resolvedTheme.value);
}

export function useTheme() {
  initTheme();

  onScopeDispose(() => {
    // Keep the global media listener for the app lifetime.
  });

  return {
    preference: themePreference,
    resolved: resolvedTheme,
    setPreference,
  };
}

export async function setPreference(
  next: ThemePreference,
  pointer?: ThemePointer,
): Promise<void> {
  if (next === preference.value) {
    return;
  }

  const previousResolved = resolvedTheme.value;
  preference.value = next;
  writeStoredPreference(next);

  const nextResolved = resolveTheme(next, systemDark.value);
  if (nextResolved === previousResolved) {
    syncWindowTheme(next);
    return;
  }

  await transitionTheme(nextResolved, pointer);
  syncWindowTheme(next);
}

function resolveTheme(
  mode: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return mode;
}

function applyResolvedTheme(theme: ResolvedTheme): void {
  StyleProvider(theme === 'dark' ? Themes.md3Dark : Themes.md3Light);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

async function transitionTheme(
  theme: ResolvedTheme,
  pointer?: ThemePointer,
): Promise<void> {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const startViewTransition = document.startViewTransition?.bind(document);

  if (!startViewTransition || reducedMotion) {
    applyResolvedTheme(theme);
    return;
  }

  const x = pointer?.x ?? window.innerWidth / 2;
  const y = pointer?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  root.style.setProperty('--theme-ripple-x', `${x}px`);
  root.style.setProperty('--theme-ripple-y', `${y}px`);
  root.style.setProperty('--theme-ripple-r', `${radius}px`);
  root.classList.add('theme-rippling');

  try {
    const transition = startViewTransition(() => {
      applyResolvedTheme(theme);
    });
    await transition.finished;
  } finally {
    root.classList.remove('theme-rippling');
    root.style.removeProperty('--theme-ripple-x');
    root.style.removeProperty('--theme-ripple-y');
    root.style.removeProperty('--theme-ripple-r');
  }
}

function syncWindowTheme(mode: ThemePreference): void {
  const runtime = (
    window as Window & {
      runtime?: {
        WindowSetLightTheme?: () => void;
        WindowSetDarkTheme?: () => void;
        WindowSetSystemDefaultTheme?: () => void;
      };
    }
  ).runtime;

  if (!runtime) {
    return;
  }

  try {
    if (mode === 'system') {
      runtime.WindowSetSystemDefaultTheme?.();
      return;
    }
    if (mode === 'dark') {
      runtime.WindowSetDarkTheme?.();
      return;
    }
    runtime.WindowSetLightTheme?.();
  } catch {
    // Browser-only Vite preview has no Wails window chrome APIs.
  }
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function writeStoredPreference(mode: ThemePreference): void {
  window.localStorage.setItem(STORAGE_KEY, mode);
}
