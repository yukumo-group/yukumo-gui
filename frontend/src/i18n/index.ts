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

const STORAGE_KEY = 'yukumo-locale';

const localePreference: Ref<AppLocale> = ref(readStoredLocale());

export const appLocale = computed(() => localePreference.value);

export const i18n = createI18n({
  legacy: false,
  locale: localePreference.value,
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

export function initI18n(): void {
  applyLocale(localePreference.value);
}

export function setLocale(next: AppLocale): void {
  if (next === localePreference.value) {
    return;
  }
  localePreference.value = next;
  writeStoredLocale(next);
  applyLocale(next);
}

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

function applyLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  Locale.use(locale);
  document.documentElement.lang = locale;
}

function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isAppLocale(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage failures (private mode / WebView quirks).
  }
  return detectSystemLocale();
}

function writeStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures (private mode / WebView quirks).
  }
}

function detectSystemLocale(): AppLocale {
  const language = navigator.language.toLowerCase();
  if (language.startsWith('ja')) {
    return 'ja-JP';
  }
  if (language.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
}
