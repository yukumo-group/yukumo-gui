import type { Component } from 'vue';
import {
  Sparkles,
  Users,
  Wrench,
  CircleHelp,
  Settings,
} from '@lucide/vue';

export interface NavDestination {
  path: string;
  labelKey: string;
  icon: Component;
}

export const primaryDestinations: NavDestination[] = [
  {
    path: '/',
    labelKey: 'nav.generate',
    icon: Sparkles,
  },
  {
    path: '/profiles',
    labelKey: 'nav.profiles',
    icon: Users,
  },
  {
    path: '/utilities',
    labelKey: 'nav.utilities',
    icon: Wrench,
  },
];

export const helpDestination: NavDestination = {
  path: '/help',
  labelKey: 'nav.help',
  icon: CircleHelp,
};

export const settingsDestination: NavDestination = {
  path: '/settings',
  labelKey: 'nav.settings',
  icon: Settings,
};

/** Bottom nav omits Help (opened from Settings on compact). */
export const bottomDestinations: NavDestination[] = [
  ...primaryDestinations,
  settingsDestination,
];
