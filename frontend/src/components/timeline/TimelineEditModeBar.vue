<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { MousePointer2, PenLine, Scissors, Trash2 } from '@lucide/vue';
import type { TimelineEditMode } from '../../types/timeline';

defineProps<{
  modelValue: TimelineEditMode;
}>();

const emit = defineEmits<{
  'update:modelValue': [mode: TimelineEditMode];
}>();

const { t } = useI18n();

const tools: {
  id: TimelineEditMode;
  icon: typeof MousePointer2;
  shortcut: string;
  labelKey:
    | 'pages.generate.timeline.editModeSelect'
    | 'pages.generate.timeline.editModeAdd'
    | 'pages.generate.timeline.editModeDelete'
    | 'pages.generate.timeline.editModeSplit';
}[] = [
  {
    id: 'select',
    icon: MousePointer2,
    shortcut: 'q',
    labelKey: 'pages.generate.timeline.editModeSelect',
  },
  {
    id: 'add',
    icon: PenLine,
    shortcut: 'w',
    labelKey: 'pages.generate.timeline.editModeAdd',
  },
  {
    id: 'delete',
    icon: Trash2,
    shortcut: 'e',
    labelKey: 'pages.generate.timeline.editModeDelete',
  },
  {
    id: 'split',
    icon: Scissors,
    shortcut: 'r',
    labelKey: 'pages.generate.timeline.editModeSplit',
  },
];
</script>

<template>
  <div
    class="flex h-full items-center justify-center gap-1"
    role="radiogroup"
    :aria-label="t('pages.generate.timeline.editModeToolbar')"
  >
    <var-tooltip
      v-for="tool in tools"
      :key="tool.id"
      :content="t(tool.labelKey)"
      placement="bottom"
    >
      <button
        type="button"
        role="radio"
        class="inline-flex size-8 items-center justify-center rounded-full transition-colors"
        :class="
          modelValue === tool.id
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        "
        :aria-checked="modelValue === tool.id"
        :aria-label="t(tool.labelKey)"
        :aria-keyshortcuts="tool.shortcut"
        @click="emit('update:modelValue', tool.id)"
      >
        <component :is="tool.icon" :size="16" aria-hidden="true" />
      </button>
    </var-tooltip>
  </div>
</template>
