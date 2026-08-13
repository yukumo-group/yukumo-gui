<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { editor as MonacoEditor } from 'monaco-editor';
import SplitPane from '../split/SplitPane.vue';
import TimelineEditor from '../timeline/TimelineEditor.vue';
import {
  FILE_TREE_WIDTH_DEFAULT,
  FILE_TREE_WIDTH_MAX,
  FILE_TREE_WIDTH_MIN,
  fileTreeWidth,
  rightPanel,
  showFileTree,
} from '../../composables/generateWorkspace';
import { resolvedTheme } from '../../theme/theme';

const { t } = useI18n();

const script = ref('');
const mainRowRef = ref<HTMLElement | null>(null);

const monacoTheme = computed(() =>
  resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
);

const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
};
</script>

<template>
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
</template>
