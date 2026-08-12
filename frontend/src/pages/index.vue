<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { editor as MonacoEditor } from 'monaco-editor';
import { resolvedTheme } from '../theme/theme';

const { t } = useI18n();

const script = ref('');

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
  <section class="flex w-full max-w-5xl flex-col gap-4 text-left">
    <header class="flex flex-col gap-2">
      <h1 class="font-bold tracking-wide text-text text-3xl">
        {{ t('pages.generate.title') }}
      </h1>
      <p class="leading-relaxed text-text opacity-70 text-base">
        {{ t('pages.generate.description') }}
      </p>
    </header>

    <div
      class="h-[min(70vh,560px)] min-h-80 overflow-hidden rounded-lg border border-outline/40 bg-surface-container"
      role="region"
      :aria-label="t('pages.generate.editorAriaLabel')"
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
  </section>
</template>
