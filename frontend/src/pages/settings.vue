<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { helpDestination } from '../navigation/destinations';

const router = useRouter();

function openHelp(): void {
  void router.push(helpDestination.path);
}
</script>

<template>
  <section class="flex w-full max-w-3xl flex-col gap-6 text-left">
    <header class="flex flex-col gap-2">
      <h1 class="font-bold tracking-wide text-[var(--color-text)] text-3xl">
        Settings
      </h1>
      <p class="leading-relaxed text-[var(--color-text)] opacity-70 text-base">
        Configure application preferences and workspace options.
      </p>
    </header>

    <!-- Compact only: Help is rail-only on wide screens -->
    <div class="sm:hidden">
      <var-cell
        :title="helpDestination.label"
        border
        ripple
        @click="openHelp"
      >
        <template #icon>
          <component :is="helpDestination.icon" :size="22" />
        </template>
        <template #extra>
          <ChevronRight :size="20" />
        </template>
      </var-cell>
    </div>
  </section>
</template>
