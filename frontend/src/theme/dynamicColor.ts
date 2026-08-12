import {
  Hct,
  hexFromArgb,
  themeFromSourceColor,
  type Scheme,
} from '@material/material-color-utilities';
import { Themes, type StyleVars } from '@varlet/ui';
import { themeOverrides } from './overrides';

export type DynamicColorMode = 'light' | 'dark';

/** HCT hue matching Material MD3 purple (#6750A4). */
export const DEFAULT_THEME_HUE = 300;

const SOURCE_CHROMA = 48;
const SOURCE_TONE = 40;

const LIGHT_SOFT_SHADOWS: StyleVars = {
  '--shadow-key-umbra-opacity': 'rgba(0, 0, 0, 0.06)',
  '--shadow-key-penumbra-opacity': 'rgba(0, 0, 0, 0.05)',
  '--shadow-key-ambient-opacity': 'rgba(0, 0, 0, 0.04)',
};

type ColorRole =
  | 'primary'
  | 'on-primary'
  | 'primary-container'
  | 'on-primary-container'
  | 'info'
  | 'on-info'
  | 'info-container'
  | 'on-info-container'
  | 'danger'
  | 'on-danger'
  | 'danger-container'
  | 'on-danger-container'
  | 'body'
  | 'text'
  | 'outline'
  | 'on-surface-variant'
  | 'inverse-surface'
  | 'surface-container'
  | 'surface-container-low'
  | 'surface-container-high'
  | 'surface-container-highest';

export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) {
    return DEFAULT_THEME_HUE;
  }
  const wrapped = ((Math.round(hue) % 360) + 360) % 360;
  return wrapped;
}

export function buildThemeVars(
  hue: number,
  mode: DynamicColorMode,
): StyleVars {
  const normalized = normalizeHue(hue);
  const source = Hct.from(normalized, SOURCE_CHROMA, SOURCE_TONE).toInt();
  const theme = themeFromSourceColor(source);
  const scheme = mode === 'dark' ? theme.schemes.dark : theme.schemes.light;
  const neutral = theme.palettes.neutral;
  const base = mode === 'dark' ? Themes.md3Dark : Themes.md3Light;

  const vars: StyleVars = {
    ...base,
    ...themeOverrides,
  };

  applySchemeRoles(vars, scheme);

  if (mode === 'light') {
    // Inverted surface hierarchy (lower → more tinted; higher → brighter).
    setRole(vars, 'body', neutral.tone(90));
    setRole(vars, 'surface-container-low', neutral.tone(98));
    setRole(vars, 'surface-container', neutral.tone(98));
    setRole(vars, 'surface-container-high', neutral.tone(99));
    setRole(vars, 'surface-container-highest', neutral.tone(100));
    Object.assign(vars, LIGHT_SOFT_SHADOWS);
  } else {
    setRole(vars, 'body', neutral.tone(6));
    setRole(vars, 'surface-container-low', neutral.tone(10));
    setRole(vars, 'surface-container', neutral.tone(12));
    setRole(vars, 'surface-container-high', neutral.tone(17));
    setRole(vars, 'surface-container-highest', neutral.tone(22));
  }

  return vars;
}

export function primaryHexForHue(
  hue: number,
  mode: DynamicColorMode,
): string {
  const normalized = normalizeHue(hue);
  const source = Hct.from(normalized, SOURCE_CHROMA, SOURCE_TONE).toInt();
  const theme = themeFromSourceColor(source);
  const scheme = mode === 'dark' ? theme.schemes.dark : theme.schemes.light;
  return hexFromArgb(scheme.primary);
}

function applySchemeRoles(vars: StyleVars, scheme: Scheme): void {
  setRole(vars, 'primary', scheme.primary);
  setRole(vars, 'on-primary', scheme.onPrimary);
  setRole(vars, 'primary-container', scheme.primaryContainer);
  setRole(vars, 'on-primary-container', scheme.onPrimaryContainer);

  setRole(vars, 'info', scheme.secondary);
  setRole(vars, 'on-info', scheme.onSecondary);
  setRole(vars, 'info-container', scheme.secondaryContainer);
  setRole(vars, 'on-info-container', scheme.onSecondaryContainer);

  setRole(vars, 'danger', scheme.error);
  setRole(vars, 'on-danger', scheme.onError);
  setRole(vars, 'danger-container', scheme.errorContainer);
  setRole(vars, 'on-danger-container', scheme.onErrorContainer);

  setRole(vars, 'text', scheme.onSurface);
  setRole(vars, 'outline', scheme.outline);
  setRole(vars, 'on-surface-variant', scheme.onSurfaceVariant);
  setRole(vars, 'inverse-surface', scheme.inverseSurface);
}

function setRole(vars: StyleVars, role: ColorRole, argb: number): void {
  const hsl = argbToHslTriple(argb);
  vars[`--hsl-${role}`] = hsl;
  vars[`--color-${role}`] = `hsla(var(--hsl-${role}), 1)`;
}

function argbToHslTriple(argb: number): string {
  const hex = hexFromArgb(argb);
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%`;
}
