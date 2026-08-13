<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  show: boolean;
  text: string;
  initialIndex: number;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [index: number];
}>();

const { t } = useI18n();

const maxIndex = computed(() => Math.max(1, props.text.length - 1));

const index = ref(clampIndex(props.initialIndex));

function clampIndex(value: number): number {
  if (props.text.length <= 1) return 1;
  return Math.min(maxIndex.value, Math.max(1, Math.round(value)));
}

watch(
  () => props.show,
  (show) => {
    if (show) index.value = clampIndex(props.initialIndex);
  },
);

const leftText = computed(() => props.text.slice(0, index.value));
const rightText = computed(() => props.text.slice(index.value));
const canSplit = computed(() => props.text.length > 1);

function setShow(value: boolean): void {
  emit('update:show', value);
}

function onSlider(value: number | number[]): void {
  const n = Array.isArray(value) ? value[0] : value;
  if (typeof n !== 'number') return;
  index.value = clampIndex(n);
}

function onConfirm(): void {
  if (!canSplit.value) return;
  emit('confirm', index.value);
  setShow(false);
}
</script>

<template>
  <var-dialog
    :show="show"
    dialog-class="timeline-clip-split-dialog"
    width="32rem"
    :title="t('pages.generate.timeline.splitDialogTitle')"
    :confirm-button="false"
    :cancel-button="false"
    :close-on-click-overlay="true"
    :close-on-key-escape="true"
    @update:show="setShow"
  >
    <div class="flex flex-col gap-4 text-left">
      <p class="text-sm text-on-surface-variant">
        {{ t('pages.generate.timeline.splitDialogHint') }}
      </p>
      <div
        class="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface-container px-3 py-2 text-sm text-text"
        :aria-label="t('pages.generate.timeline.splitPreviewAriaLabel')"
      >
        <span>{{ leftText }}</span>
        <span
          class="mx-0.5 inline-block font-bold text-primary"
          aria-hidden="true"
        >|</span>
        <span>{{ rightText }}</span>
      </div>
      <var-slider
        :model-value="index"
        :min="1"
        :max="maxIndex"
        :step="1"
        :disabled="!canSplit"
        :label="true"
        @update:model-value="onSlider"
      />
    </div>
    <template #actions="{ slotClass }">
      <div :class="[slotClass, 'flex w-full justify-end gap-2']">
        <var-button
          text
          @click="setShow(false)"
        >
          {{ t('pages.generate.timeline.dialogCancel') }}
        </var-button>
        <var-button
          type="primary"
          :disabled="!canSplit"
          @click="onConfirm"
        >
          {{ t('pages.generate.timeline.splitConfirm') }}
        </var-button>
      </div>
    </template>
  </var-dialog>
</template>

<style>
.timeline-clip-split-dialog {
  max-width: min(32rem, 92vw);
}
</style>
