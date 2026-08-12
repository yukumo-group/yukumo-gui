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
  label: string;
  icon: Component;
}

export const primaryDestinations: NavDestination[] = [
  {
    path: '/',
    label: 'Generate',
    icon: Sparkles,
  },
  {
    path: '/profiles',
    label: 'Profiles',
    icon: Users,
  },
  {
    path: '/utilities',
    label: 'Utilities',
    icon: Wrench,
  },
];

export const helpDestination: NavDestination = {
  path: '/help',
  label: 'Help',
  icon: CircleHelp,
};

export const settingsDestination: NavDestination = {
  path: '/settings',
  label: 'Settings',
  icon: Settings,
};

/** Bottom nav omits Help (opened from Settings on compact). */
export const bottomDestinations: NavDestination[] = [
  ...primaryDestinations,
  settingsDestination,
];
