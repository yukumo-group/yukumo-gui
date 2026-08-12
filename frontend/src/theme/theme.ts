import { computed, ref, type Ref } from 'vue';
import { StyleProvider } from '@varlet/ui';
import {
  DEFAULT_THEME_HUE,
  buildThemeVars,
  normalizeHue,
} from './dynamicColor';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemePointer {
  x: number;
  y: number;
}

const PREFERENCE_STORAGE_KEY = 'yukumo-theme-preference';
const HUE_STORAGE_KEY = 'yukumo-theme-hue';

const preference: Ref<ThemePreference> = ref(readStoredPreference());
const hue: Ref<number> = ref(readStoredHue());
const systemDark = ref(getSystemPrefersDark());

let initialized = false;

export const themePreference = computed(() => preference.value);
export const themeHue = computed(() => hue.value);

export const resolvedTheme = computed<ResolvedTheme>(() =>
  resolveTheme(preference.value, systemDark.value),
);

export function initTheme(): void {
  if (initialized) {
    applyResolvedTheme(resolvedTheme.value, hue.value);
    return;
  }
  initialized = true;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = mediaQuery.matches;
  mediaQuery.addEventListener('change', (event: MediaQueryListEvent) => {
    systemDark.value = event.matches;
    if (preference.value === 'system') {
      applyResolvedTheme(resolveTheme('system', event.matches), hue.value);
    }
  });

  applyResolvedTheme(resolvedTheme.value, hue.value);
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

export function setHue(next: number): void {
  const normalized = normalizeHue(next);
  if (normalized === hue.value) {
    return;
  }
  hue.value = normalized;
  writeStoredHue(normalized);
  applyResolvedTheme(resolvedTheme.value, normalized);
}

export function resetTheme(): void {
  preference.value = 'system';
  writeStoredPreference('system');
  hue.value = DEFAULT_THEME_HUE;
  writeStoredHue(DEFAULT_THEME_HUE);
  applyResolvedTheme(resolveTheme('system', systemDark.value), DEFAULT_THEME_HUE);
  syncWindowTheme('system');
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

function applyResolvedTheme(theme: ResolvedTheme, themeHueValue: number): void {
  StyleProvider(buildThemeVars(themeHueValue, theme));
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
    applyResolvedTheme(theme, hue.value);
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
      applyResolvedTheme(theme, hue.value);
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
  const stored = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function writeStoredPreference(mode: ThemePreference): void {
  window.localStorage.setItem(PREFERENCE_STORAGE_KEY, mode);
}

function readStoredHue(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_HUE;
  }
  const stored = window.localStorage.getItem(HUE_STORAGE_KEY);
  if (stored === null) {
    return DEFAULT_THEME_HUE;
  }
  return normalizeHue(Number(stored));
}

function writeStoredHue(value: number): void {
  window.localStorage.setItem(HUE_STORAGE_KEY, String(value));
}
