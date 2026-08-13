<script setup lang="ts">
import type { AquesTalkVersion } from '../../types/profile';
import EngineBadge from './EngineBadge.vue';

defineProps<{
  version: AquesTalkVersion;
  label: string;
}>();
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    <EngineBadge :version="version" />
    <span class="truncate">{{ label }}</span>
  </div>
</template>
