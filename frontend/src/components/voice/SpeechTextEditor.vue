<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { editor as MonacoEditor } from 'monaco-editor';
import { resolvedTheme } from '../../theme/theme';

defineProps<{
  modelValue: string;
  ariaLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const monacoTheme = computed(() =>
  resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
);

const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'off',
  glyphMargin: false,
  folding: false,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'hidden',
  },
  padding: { top: 12, bottom: 12 },
};
</script>

<template>
  <div
    class="h-48 overflow-hidden rounded-xl border-2 border-outline/40 bg-surface-container sm:h-72"
    role="region"
    :aria-label="ariaLabel"
  >
    <VueMonacoEditor
      :value="modelValue"
      language="plaintext"
      :theme="monacoTheme"
      :options="editorOptions"
      height="100%"
      @update:value="emit('update:modelValue', $event ?? '')"
    >
      <template #default>
        <span class="p-3 text-on-surface-variant text-sm">
          {{ t('pages.utilities.quickGenerate.editorLoading') }}
        </span>
      </template>
      <template #failure>
        <span class="p-3 text-danger text-sm">
          {{ t('pages.utilities.quickGenerate.editorLoadFailed') }}
        </span>
      </template>
    </VueMonacoEditor>
  </div>
</template>
