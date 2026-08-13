<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    hint?: string;
    min: number;
    max: number;
    step?: number;
    direction?: 'horizontal' | 'vertical';
  }>(),
  {
    direction: 'horizontal',
  },
);

const model = defineModel<number>({ required: true });

function onSliderUpdate(value: number | number[]): void {
  model.value = Array.isArray(value) ? (value[0] ?? 0) : value;
}
</script>

<template>
  <div
    v-if="direction === 'vertical'"
    class="flex min-w-0 flex-1 flex-col items-center gap-1"
  >
    <span
      class="max-w-full truncate text-center text-xs font-medium text-text"
      :title="label"
    >
      {{ label }}
    </span>
    <span class="text-xs tabular-nums text-on-surface-variant">
      {{ model }}
    </span>
    <div class="flex h-44 w-full items-stretch justify-center py-1">
      <var-slider
        :model-value="model"
        direction="vertical"
        :min="min"
        :max="max"
        :step="step ?? 1"
        @update:model-value="onSliderUpdate"
      />
    </div>
  </div>
  <div
    v-else
    class="flex flex-col"
  >
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
