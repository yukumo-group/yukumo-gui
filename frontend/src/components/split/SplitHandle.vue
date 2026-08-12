<script setup lang="ts">
import { computed } from 'vue';
import { motion } from 'motion-v';
import type { SplitOrientation } from './splitTypes';

const props = withDefaults(
  defineProps<{
    orientation: SplitOrientation;
    open: boolean;
    active: boolean;
    value: number;
    min: number;
    max: number;
    gap: number;
    label: string;
    transition: Record<string, unknown>;
    /** When false, keep `gap` even while closed (spacer only). */
    collapseGap?: boolean;
  }>(),
  {
    collapseGap: true,
  },
);

const isVertical = computed(() => props.orientation === 'vertical');

const gapSize = computed(() =>
  props.open || !props.collapseGap ? props.gap : 0,
);

const animate = computed(() =>
  isVertical.value
    ? { width: gapSize.value, minWidth: 0 }
    : { height: gapSize.value, minHeight: 0 },
);

const gripClass = computed(() =>
  isVertical.value ? 'h-10 w-1' : 'h-1 w-10',
);
</script>

<template>
  <motion.div
    class="split-handle group relative z-10 flex shrink-0 touch-none items-center justify-center overflow-hidden"
    :class="[
      isVertical ? 'min-w-0 cursor-ew-resize' : 'min-h-0 cursor-ns-resize',
      open ? '' : 'pointer-events-none',
    ]"
    role="separator"
    :aria-orientation="orientation"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="value"
    :aria-label="label"
    :aria-hidden="!open"
    :tabindex="open ? 0 : -1"
    :initial="false"
    :animate="animate"
    :transition="transition"
  >
    <!-- Absolute so grip size does not block width/height collapsing to 0 -->
    <div
      class="split-handle__grip absolute rounded-full bg-outline/50"
      :class="[gripClass, active ? 'is-active bg-primary' : '']"
      aria-hidden="true"
    />
  </motion.div>
</template>

<style scoped>
.split-handle__grip {
  opacity: 0;
  transition:
    opacity 140ms ease,
    background-color 140ms ease;
}

.split-handle:hover .split-handle__grip,
.split-handle:focus-visible .split-handle__grip,
.split-handle__grip.is-active {
  opacity: 1;
}

.split-handle:hover .split-handle__grip:not(.is-active) {
  background-color: var(--color-outline);
}
</style>
