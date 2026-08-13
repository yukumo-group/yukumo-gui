<script setup lang="ts">
import { User } from '@lucide/vue';

defineProps<{
  name: string;
  imageDataUrl?: string | null;
}>();
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center gap-2 mt-0.5">
    <div
      class="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant"
    >
      <img
        v-if="imageDataUrl"
        :src="imageDataUrl"
        alt=""
        class="size-full object-cover"
      />
      <User
        v-else
        :size="14"
        aria-hidden="true"
      />
    </div>
    <span class="truncate">{{ name }}</span>
  </div>
</template>
