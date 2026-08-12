const enUS = {
  nav: {
    generate: 'Generate',
    profiles: 'Profiles',
    utilities: 'Utilities',
    help: 'Help',
    settings: 'Settings',
    mainAriaLabel: 'Main navigation',
  },
  pages: {
    generate: {
      title: 'Generate',
      description: 'Create and run Yukumo scripts from this workspace.',
    },
    profiles: {
      title: 'Profiles',
      description: 'Browse and manage profiles available for script generation.',
    },
    utilities: {
      title: 'Utilities',
      description: 'Access helper tools and maintenance utilities for your workspace.',
    },
    help: {
      title: 'Help',
      description: 'Learn how to use Yukumo Script and find answers to common questions.',
    },
    settings: {
      title: 'Settings',
      description: 'Configure application preferences and workspace options.',
      appearance: {
        title: 'Appearance',
        description: 'Switch between MD3 light, dark, or follow the device.',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      accentColor: {
        title: 'Accent color',
        description: 'Pick a hue for Material You light and dark themes.',
        ariaLabel: 'Accent color hue',
        toggleSlider: 'Show or hide accent color slider',
      },
      language: {
        title: 'Language',
        description: 'Choose the interface language.',
        enUS: 'English',
        jaJP: '日本語',
        zhCN: '简体中文',
      },
    },
  },
} as const;

export default enUS;
