<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
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
  setHue,
  setPreference,
  themeHue,
  themePreference,
  type ThemePreference,
} from '../theme/theme';

const HUE_THROTTLE_MS = 120;

const { t } = useI18n();
const router = useRouter();

let lastPointer = { x: 0, y: 0 };
let pendingHue: number | null = null;
let hueThrottleTimer: ReturnType<typeof setTimeout> | null = null;

const localeOptions: { value: AppLocale; labelKey: string }[] = [
  { value: 'en-US', labelKey: 'pages.settings.language.enUS' },
  { value: 'ja-JP', labelKey: 'pages.settings.language.jaJP' },
  { value: 'zh-CN', labelKey: 'pages.settings.language.zhCN' },
];

const accentOpen = ref(false);
const sliderHue = ref(themeHue.value);

const accentPreview = computed(
  () => `hsl(${sliderHue.value} 75% 50%)`,
);

watch(themeHue, (value) => {
  if (pendingHue === null) {
    sliderHue.value = value;
  }
});

onBeforeUnmount(() => {
  clearHueThrottle();
  flushPendingHue();
});

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

function onHueInput(value: number | number[]): void {
  const next = Array.isArray(value) ? value[0] : value;
  if (typeof next !== 'number') {
    return;
  }

  sliderHue.value = next;
  pendingHue = next;

  if (hueThrottleTimer !== null) {
    return;
  }

  hueThrottleTimer = setTimeout(() => {
    hueThrottleTimer = null;
    flushPendingHue();
  }, HUE_THROTTLE_MS);
}

function onHueEnd(): void {
  clearHueThrottle();
  flushPendingHue();
}

function flushPendingHue(): void {
  if (pendingHue === null) {
    return;
  }
  setHue(pendingHue);
  pendingHue = null;
}

function clearHueThrottle(): void {
  if (hueThrottleTimer === null) {
    return;
  }
  clearTimeout(hueThrottleTimer);
  hueThrottleTimer = null;
}

function toggleAccentSlider(): void {
  accentOpen.value = !accentOpen.value;
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

      <div class="settings-item flex flex-col">
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <p class="truncate font-semibold text-text text-base">
              {{ t('pages.settings.accentColor.title') }}
            </p>
            <p class="truncate text-on-surface-variant text-sm">
              {{ t('pages.settings.accentColor.description') }}
            </p>
          </div>

          <button
            type="button"
            class="accent-swatch size-8 shrink-0 rounded-full border border-outline"
            :class="{ 'accent-swatch--open': accentOpen }"
            :style="{ backgroundColor: accentPreview }"
            :aria-label="t('pages.settings.accentColor.toggleSlider')"
            :aria-expanded="accentOpen"
            @click="toggleAccentSlider"
          />
        </div>

        <!--
          CSS grid 0fr→1fr avoids Varlet Collapse's height pre-measure,
          which undershoots when the slider lays out after the first frame.
        -->
        <div
          class="accent-panel"
          :data-open="accentOpen"
        >
          <div class="accent-panel__inner">
            <div class="px-4 pb-3">
              <var-slider
                class="hue-slider w-full"
                :model-value="sliderHue"
                :min="0"
                :max="360"
                :step="1"
                :track-height="8"
                label-visible="never"
                :aria-label="t('pages.settings.accentColor.ariaLabel')"
                @update:model-value="onHueInput"
                @end="onHueEnd"
              />
            </div>
          </div>
        </div>
      </div>

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

<style scoped>
.accent-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms cubic-bezier(0.2, 0, 0, 1);
}

.accent-panel[data-open='true'] {
  grid-template-rows: 1fr;
}

@media (prefers-reduced-motion: reduce) {
  .accent-panel {
    transition: none;
  }
}

.accent-panel__inner {
  overflow: hidden;
  min-height: 0;
}

.accent-swatch {
  cursor: pointer;
  transition: box-shadow 160ms ease;
}

.accent-swatch--open {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.hue-slider :deep(.var-slider__horizontal-track-background) {
  background: linear-gradient(
    to right,
    hsl(0, 85%, 55%),
    hsl(60, 85%, 55%),
    hsl(120, 85%, 45%),
    hsl(180, 85%, 45%),
    hsl(240, 85%, 55%),
    hsl(300, 85%, 55%),
    hsl(360, 85%, 55%)
  ) !important;
  opacity: 1;
}

.hue-slider :deep(.var-slider__horizontal-track-fill) {
  background: transparent !important;
}

.hue-slider :deep(.var-slider__horizontal-thumb-block) {
  background: v-bind(accentPreview) !important;
  box-shadow: 0 0 0 2px var(--color-body);
}
</style>
