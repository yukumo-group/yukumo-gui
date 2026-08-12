<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div
    class="settings-item flex items-center justify-between gap-3 px-4 py-3"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <p class="truncate font-semibold text-text text-base">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="truncate text-on-surface-variant text-sm"
      >
        {{ description }}
      </p>
    </div>

    <div class="shrink-0">
      <slot />
    </div>
  </div>
</template>
