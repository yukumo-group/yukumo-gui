import { computed, ref, type Ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { Locale } from '@varlet/ui';
import enUS from '@varlet/ui/es/locale/en-US';
import jaJP from '@varlet/ui/es/locale/ja-JP';
import zhCN from '@varlet/ui/es/locale/zh-CN';

import enUSMessages from './messages/en-US';
import jaJPMessages from './messages/ja-JP';
import zhCNMessages from './messages/zh-CN';

export const APP_LOCALES = ['en-US', 'ja-JP', 'zh-CN'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
export type LocalePreference = AppLocale | 'system';

const STORAGE_KEY = 'yukumo-locale';

const preference: Ref<LocalePreference> = ref(readStoredPreference());

export const appLocale = computed(() => preference.value);

export const resolvedLocale = computed<AppLocale>(() =>
  resolveLocale(preference.value),
);

export const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(preference.value),
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUSMessages,
    'ja-JP': jaJPMessages,
    'zh-CN': zhCNMessages,
  },
});

Locale.add('en-US', enUS);
Locale.add('ja-JP', jaJP);
Locale.add('zh-CN', zhCN);

let initialized = false;

export function initI18n(): void {
  if (!initialized) {
    initialized = true;
    window.addEventListener('languagechange', () => {
      if (preference.value === 'system') {
        applyLocale(detectSystemLocale());
      }
    });
  }
  applyLocale(resolvedLocale.value);
}

export function setLocale(next: LocalePreference): void {
  if (next === preference.value) {
    return;
  }
  preference.value = next;
  writeStoredPreference(next);
  applyLocale(resolveLocale(next));
}

export function resetLocale(): void {
  preference.value = 'system';
  writeStoredPreference('system');
  applyLocale(detectSystemLocale());
}

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

export function isLocalePreference(value: string): value is LocalePreference {
  return value === 'system' || isAppLocale(value);
}

function resolveLocale(mode: LocalePreference): AppLocale {
  if (mode === 'system') {
    return detectSystemLocale();
  }
  return mode;
}

function applyLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  Locale.use(locale);
  document.documentElement.lang = locale;
}

function readStoredPreference(): LocalePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocalePreference(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage failures (private mode / WebView quirks).
  }
  return 'system';
}

function writeStoredPreference(locale: LocalePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures (private mode / WebView quirks).
  }
}

function getPreferredLanguages(): string[] {
  if (typeof navigator === 'undefined') {
    return ['en'];
  }

  const nav = navigator as Navigator & { userLanguage?: string };
  if (navigator.languages && navigator.languages.length > 0) {
    return [...navigator.languages];
  }
  return [navigator.language || nav.userLanguage || 'en'];
}

function matchAppLocale(tag: string): AppLocale | null {
  const lower = tag.toLowerCase();

  for (const locale of APP_LOCALES) {
    if (lower === locale.toLowerCase()) {
      return locale;
    }
  }

  if (lower.startsWith('ja')) {
    return 'ja-JP';
  }
  if (lower.startsWith('zh')) {
    return 'zh-CN';
  }
  if (lower.startsWith('en')) {
    return 'en-US';
  }

  return null;
}

function detectSystemLocale(): AppLocale {
  for (const tag of getPreferredLanguages()) {
    const matched = matchAppLocale(tag);
    if (matched) {
      return matched;
    }
  }
  return 'en-US';
}
