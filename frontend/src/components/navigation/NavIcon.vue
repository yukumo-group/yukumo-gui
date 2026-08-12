<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import { motion } from 'motion-v';

const props = withDefaults(
  defineProps<{
    icon: Component;
    active: boolean;
    variant?: 'default' | 'settings';
  }>(),
  {
    variant: 'default',
  },
);

const isSettings = computed(() => props.variant === 'settings');

const animate = computed(() => {
  if (isSettings.value) {
    return { rotate: props.active ? 120 : 0 };
  }

  return {
    scale: props.active ? [0.5, 1] : 1,
  };
});

const transition = computed(() => ({
  type: 'spring' as const,
  visualDuration: isSettings.value ? 0.35 : 0.2,
  bounce: 0.35,
}));
</script>

<template>
  <motion.span
    class="inline-flex origin-center items-center justify-center"
    :animate="animate"
    :transition="transition"
  >
    <component
      :is="icon"
      :stroke-width="!isSettings && active ? 2.5 : 2"
    />
  </motion.span>
</template>
