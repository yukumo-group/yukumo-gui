<script setup lang="ts">
import { computed } from 'vue';
import { motion } from 'motion-v';

const props = withDefaults(
  defineProps<{
    active: boolean;
    text: string;
    gap?: number;
  }>(),
  {
    gap: 4,
  },
);

const animate = computed(() =>
  props.active
    ? { height: 'auto', opacity: 1, marginTop: props.gap }
    : { height: 0, opacity: 0, marginTop: 0 },
);

const transition = {
  type: 'spring' as const,
  visualDuration: 0.28,
  bounce: 0.12,
  opacity: { type: 'tween' as const, duration: 0.18, ease: 'easeOut' },
};
</script>

<template>
  <motion.span
    class="block overflow-hidden text-center text-[12px] leading-tight whitespace-nowrap"
    :class="active ? 'font-semibold' : 'font-normal'"
    :initial="false"
    :animate="animate"
    :transition="transition"
  >
    {{ text }}
  </motion.span>
</template>
