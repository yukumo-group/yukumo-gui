import type { StyleVars } from '@varlet/ui';

/** Applied via StyleProvider so values win over MD3 theme defaults. */
export const themeOverrides: StyleVars = {
  // Menus/cards: `rounded-2xl` (1rem). Fields/selects: `rounded-xl` (0.75rem).
  '--select-scroller-border-radius': '1rem',
  '--menu-border-radius': '1rem',
  '--menu-select-menu-border-radius': '1rem',
  '--field-decorator-line-border-radius': '0.75rem',
  '--field-decorator-filled-border-radius': '0.75rem',
  // Flush select option list (default is `6px 0`)
  '--select-scroller-padding': '0',
  // MD3 default is surface-container-highest, which matches paper/card fills here.
  '--slider-track-background': 'hsla(var(--hsl-on-surface-variant), 0.38)',
};
