<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Terminal, X } from '@lucide/vue';
import type { editor as MonacoEditor } from 'monaco-editor';
import SplitPane from '../split/SplitPane.vue';
import TimelineEditor from '../timeline/TimelineEditor.vue';
import {
  FILE_TREE_WIDTH_DEFAULT,
  FILE_TREE_WIDTH_MAX,
  FILE_TREE_WIDTH_MIN,
  TERMINAL_HEIGHT_DEFAULT,
  TERMINAL_HEIGHT_MAX,
  TERMINAL_HEIGHT_MIN,
  fileTreeWidth,
  latestStatusMessage,
  rightPanel,
  showFileTree,
  showTerminal,
  terminalHeight,
  toggleTerminal,
} from '../../composables/generateWorkspace';
import { resolvedTheme } from '../../theme/theme';

const { t } = useI18n();

const script = ref('');
const isSmUp = ref(false);
const workspaceRef = ref<HTMLElement | null>(null);
const mainRowRef = ref<HTMLElement | null>(null);

const monacoTheme = computed(() =>
  resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
);

const tooltipPlacement = computed(() => (isSmUp.value ? 'bottom' : 'top'));

const statusMessage = computed(
  () => latestStatusMessage.value ?? t('pages.generate.statusIdle'),
);

const terminalToggleLabel = computed(() =>
  showTerminal.value
    ? t('pages.generate.closeTerminal')
    : t('pages.generate.toggleTerminal'),
);

const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
};

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
    ref="workspaceRef"
    class="flex min-h-0 flex-1 flex-col"
  >
    <div
      ref="mainRowRef"
      class="flex min-h-0 min-w-0 flex-1"
    >
      <SplitPane
        v-model:size="fileTreeWidth"
        v-model:open="showFileTree"
        orientation="vertical"
        side="start"
        :min="FILE_TREE_WIDTH_MIN"
        :max="FILE_TREE_WIDTH_MAX"
        :default-size="FILE_TREE_WIDTH_DEFAULT"
        :container-el="mainRowRef"
        :resize-label="t('pages.generate.resizeFileTree')"
        :panel-label="t('pages.generate.fileTreeAriaLabel')"
      >
        <aside class="h-full min-h-0 overflow-hidden rounded-xl bg-surface-container" />
      </SplitPane>

      <div
        v-show="rightPanel === 'code'"
        class="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border-2 border-outline/40 bg-surface-container"
        role="region"
        :aria-label="t('pages.generate.codeEditorAriaLabel')"
      >
        <VueMonacoEditor
          v-model:value="script"
          language="plaintext"
          :theme="monacoTheme"
          :options="editorOptions"
          height="100%"
        >
          <template #default>
            <span class="text-on-surface-variant text-sm">
              {{ t('pages.generate.editorLoading') }}
            </span>
          </template>
          <template #failure>
            <span class="text-danger text-sm">
              {{ t('pages.generate.editorLoadFailed') }}
            </span>
          </template>
        </VueMonacoEditor>
      </div>

      <aside
        v-show="rightPanel === 'timeline'"
        class="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl bg-surface-container"
        role="region"
        :aria-label="t('pages.generate.timelineAriaLabel')"
      >
        <TimelineEditor />
      </aside>
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
      :resize-label="t('pages.generate.resizeTerminal')"
      :panel-label="t('pages.generate.terminalAriaLabel')"
    >
      <aside class="h-full min-h-0 overflow-y-auto p-3 text-on-surface-variant text-sm">
        {{ t('pages.generate.terminalEmpty') }}
      </aside>

      <template #persistent>
        <div
          class="flex shrink-0 items-center gap-1 border-outline/30 px-2 py-0.5"
          :class="showTerminal ? 'border-t' : ''"
          role="status"
          :aria-label="t('pages.generate.statusBarAriaLabel')"
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
</template>
