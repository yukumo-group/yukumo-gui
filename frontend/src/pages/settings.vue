<script setup lang="ts">
import { ChevronRight, Monitor, Moon, Sun } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsCard from '../components/settings/SettingsCard.vue';
import SettingsItem from '../components/settings/SettingsItem.vue';
import {
  appLocale,
  isAppLocale,
  setLocale,
  type AppLocale,
} from '../i18n';
import { helpDestination } from '../navigation/destinations';
import {
  setPreference,
  themePreference,
  type ThemePreference,
} from '../theme/theme';

const { t } = useI18n();
const router = useRouter();

let lastPointer = { x: 0, y: 0 };

const localeOptions: { value: AppLocale; labelKey: string }[] = [
  { value: 'en-US', labelKey: 'pages.settings.language.enUS' },
  { value: 'ja-JP', labelKey: 'pages.settings.language.jaJP' },
  { value: 'zh-CN', labelKey: 'pages.settings.language.zhCN' },
];

function openHelp(): void {
  void router.push(helpDestination.path);
}

function capturePointer(event: Event): void {
  if (event instanceof MouseEvent || event instanceof PointerEvent) {
    lastPointer = { x: event.clientX, y: event.clientY };
    return;
  }
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
    const touch = event.changedTouches[0] ?? event.touches[0];
    if (touch) {
      lastPointer = { x: touch.clientX, y: touch.clientY };
    }
  }
}

function onThemeChange(value: ThemePreference): void {
  void setPreference(value, lastPointer);
}

function onLocaleChange(value: string | number): void {
  const next = String(value);
  if (isAppLocale(next)) {
    setLocale(next);
  }
}
</script>

<template>
  <section class="flex w-full max-w-3xl flex-col gap-4 text-left">
    <header class="flex flex-col gap-1">
      <h1 class="font-bold tracking-wide text-text text-3xl">
        {{ t('pages.settings.title') }}
      </h1>
      <p class="leading-relaxed text-text opacity-70 text-base">
        {{ t('pages.settings.description') }}
      </p>
    </header>

    <SettingsCard>
      <SettingsItem
        :title="t('pages.settings.appearance.title')"
        :description="t('pages.settings.appearance.description')"
      >
        <var-segmented-buttons
          :model-value="themePreference"
          checkmark
          size="small"
          @update:model-value="onThemeChange"
        >
          <var-segmented-button
            checked-value="light"
            @click="capturePointer"
          >
            <template #default="{ checked }">
              <span class="inline-flex items-center gap-1.5">
                <Sun v-if="!checked" :size="16" aria-hidden="true" />
                {{ t('pages.settings.appearance.light') }}
              </span>
            </template>
          </var-segmented-button>

          <var-segmented-button
            checked-value="dark"
            @click="capturePointer"
          >
            <template #default="{ checked }">
              <span class="inline-flex items-center gap-1.5">
                <Moon v-if="!checked" :size="16" aria-hidden="true" />
                {{ t('pages.settings.appearance.dark') }}
              </span>
            </template>
          </var-segmented-button>

          <var-segmented-button
            checked-value="system"
            @click="capturePointer"
          >
            <template #default="{ checked }">
              <span class="inline-flex items-center gap-1.5">
                <Monitor v-if="!checked" :size="16" aria-hidden="true" />
                {{ t('pages.settings.appearance.system') }}
              </span>
            </template>
          </var-segmented-button>
        </var-segmented-buttons>
      </SettingsItem>

      <SettingsItem
        :title="t('pages.settings.language.title')"
        :description="t('pages.settings.language.description')"
      >
        <var-select
          :model-value="appLocale"
          variant="outlined"
          size="small"
          class="w-52"
          @update:model-value="onLocaleChange"
        >
          <var-option
            v-for="option in localeOptions"
            :key="option.value"
            :label="t(option.labelKey)"
            :value="option.value"
          />
        </var-select>
      </SettingsItem>
    </SettingsCard>

    <div class="sm:hidden">
      <var-cell
        :title="t(helpDestination.labelKey)"
        border
        ripple
        @click="openHelp"
      >
        <template #icon>
          <component :is="helpDestination.icon" :size="22" />
        </template>
        <template #extra>
          <ChevronRight :size="20" />
        </template>
      </var-cell>
    </div>
  </section>
</template>
