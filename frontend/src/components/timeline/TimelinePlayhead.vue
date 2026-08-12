<script setup lang="ts">
defineProps<{
  leftPx: number;
  heightPx: number;
}>();
</script>

<template>
  <div
    class="pointer-events-none absolute top-0 z-20"
    :style="{ left: `${leftPx}px`, height: `${heightPx}px` }"
    aria-hidden="true"
  >
    <div
      class="absolute -top-0 left-1/2 size-0 -translate-x-1/2 border-x-[5px] border-t-[8px] border-x-transparent border-t-primary"
    />
    <div class="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-primary" />
  </div>
</template>
