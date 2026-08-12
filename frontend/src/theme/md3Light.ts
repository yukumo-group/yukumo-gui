import { Themes, type StyleVars } from '@varlet/ui';
import { themeOverrides } from './overrides';

/**
 * MD3 light with inverted surface tones:
 * lower containers → more tinted / darker
 * higher containers → brighter / less saturated
 */
export const md3Light: StyleVars = {
  ...Themes.md3Light,
  ...themeOverrides,
  '--hsl-body': '276, 12%, 94%',
  '--color-body': 'hsla(var(--hsl-body), 1)',
  '--hsl-surface-container-low': '278, 8%, 98%',
  '--color-surface-container-low': 'hsla(var(--hsl-surface-container-low), 1)',
  '--hsl-surface-container': '276, 14%, 97%',
  '--color-surface-container': 'hsla(var(--hsl-surface-container), 1)',
  '--hsl-surface-container-high': '276, 10%, 98.5%',
  '--color-surface-container-high': 'hsla(var(--hsl-surface-container-high), 1)',
  '--hsl-surface-container-highest': '280, 6%, 99.5%',
  '--color-surface-container-highest':
    'hsla(var(--hsl-surface-container-highest), 1)',
  // Softer, less opaque elevation shadows (MD3 defaults are 0.2 / 0.14 / 0.12)
  '--shadow-key-umbra-opacity': 'rgba(0, 0, 0, 0.06)',
  '--shadow-key-penumbra-opacity': 'rgba(0, 0, 0, 0.05)',
  '--shadow-key-ambient-opacity': 'rgba(0, 0, 0, 0.04)',
};
