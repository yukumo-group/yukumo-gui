<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
  min: number;
  max: number;
  step?: number;
}>();

const model = defineModel<number>({ required: true });

function onSliderUpdate(value: number | number[]): void {
  model.value = Array.isArray(value) ? (value[0] ?? 0) : value;
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between text-base">
      <span class="font-medium">{{ label }}</span>
      <span class="tabular-nums text-on-surface-variant">
        {{ model }}
      </span>
    </div>
    <var-slider
      :model-value="model"
      :min="min"
      :max="max"
      :step="step ?? 1"
      @update:model-value="onSliderUpdate"
    />
    <p
      v-if="hint"
      class="text-sm text-on-surface-variant"
    >
      {{ hint }}
    </p>
  </div>
</template>
