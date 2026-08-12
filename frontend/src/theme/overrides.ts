import type { StyleVars } from '@varlet/ui';

/** Applied via StyleProvider so values win over MD3 theme defaults. */
export const themeOverrides: StyleVars = {
  // Match card `rounded-2xl` (1rem)
  '--select-scroller-border-radius': '1rem',
  '--menu-border-radius': '1rem',
  '--menu-select-menu-border-radius': '1rem',
  '--field-decorator-line-border-radius': '1rem',
  '--field-decorator-filled-border-radius': '1rem',
  // Flush select option list (default is `6px 0`)
  '--select-scroller-padding': '0',
};
