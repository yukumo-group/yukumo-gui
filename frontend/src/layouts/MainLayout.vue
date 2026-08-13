<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import { Terminal, X } from '@lucide/vue';
import SplitPane from '../components/split/SplitPane.vue';
import AppRailNav from '../components/navigation/AppRailNav.vue';
import AppBottomNav from '../components/navigation/AppBottomNav.vue';
import {
  TERMINAL_HEIGHT_DEFAULT,
  TERMINAL_HEIGHT_MAX,
  TERMINAL_HEIGHT_MIN,
  latestStatusMessage,
  showTerminal,
  terminalHeight,
  toggleTerminal,
} from '../composables/terminal';

const { t } = useI18n();

const workspaceRef = ref<HTMLElement | null>(null);
const isSmUp = ref(false);

const tooltipPlacement = computed(() => (isSmUp.value ? 'bottom' : 'top'));

const statusMessage = computed(
  () => latestStatusMessage.value ?? t('layout.statusIdle'),
);

const terminalToggleLabel = computed(() =>
  showTerminal.value
    ? t('layout.closeTerminal')
    : t('layout.toggleTerminal'),
);

let smMediaQuery: MediaQueryList | undefined;

function syncViewport(): void {
  if (!smMediaQuery) return;
  isSmUp.value = smMediaQuery.matches;
}

onMounted(() => {
  smMediaQuery = window.matchMedia('(min-width: 640px)');
  syncViewport();
  smMediaQuery.addEventListener('change', syncViewport);
});

onUnmounted(() => {
  smMediaQuery?.removeEventListener('change', syncViewport);
});
</script>

<template>
  <div
    class="layout-chrome relative flex h-screen w-screen flex-col overflow-hidden sm:flex-row"
  >
    <AppRailNav />

    <main
      class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0 sm:p-1"
    >
      <div
        class="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-hidden rounded-none bg-body p-0 sm:rounded-2xl sm:p-2"
      >
        <div
          ref="workspaceRef"
          class="flex min-h-0 w-full min-w-0 flex-1 flex-col"
        >
          <div
            class="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto"
          >
            <RouterView v-slot="{ Component, route }">
              <Transition name="page">
                <component :is="Component" :key="route.path" />
              </Transition>
            </RouterView>
          </div>

          <SplitPane
            v-model:size="terminalHeight"
            v-model:open="showTerminal"
            orientation="horizontal"
            side="end"
            :min="TERMINAL_HEIGHT_MIN"
            :max="TERMINAL_HEIGHT_MAX"
            :default-size="TERMINAL_HEIGHT_DEFAULT"
            :collapse-gap="false"
            :container-el="workspaceRef"
            chrome-class="rounded-xl bg-surface-container"
            :resize-label="t('layout.resizeTerminal')"
            :panel-label="t('layout.terminalAriaLabel')"
          >
            <aside class="h-full min-h-0 overflow-y-auto p-3 text-on-surface-variant text-sm">
              {{ t('layout.terminalEmpty') }}
            </aside>

            <template #persistent>
              <div
                class="flex shrink-0 items-center gap-1 border-outline/30 px-2 py-0.5"
                :class="showTerminal ? 'border-t' : ''"
                role="status"
                :aria-label="t('layout.statusBarAriaLabel')"
              >
                <p class="min-w-0 flex-1 truncate px-1 text-on-surface-variant text-sm">
                  {{ statusMessage }}
                </p>

                <var-tooltip
                  :content="terminalToggleLabel"
                  :placement="tooltipPlacement"
                >
                  <var-button
                    text
                    round
                    :aria-pressed="showTerminal"
                    :aria-label="terminalToggleLabel"
                    @click="toggleTerminal"
                  >
                    <X
                      v-if="showTerminal"
                      :size="18"
                      aria-hidden="true"
                    />
                    <Terminal
                      v-else
                      :size="18"
                      aria-hidden="true"
                    />
                  </var-button>
                </var-tooltip>
              </div>
            </template>
          </SplitPane>
        </div>
      </div>
    </main>

    <AppBottomNav />
  </div>
</template>

<style scoped>
.layout-chrome {
  background-color: var(--rail-navigation-background);
}
</style>
