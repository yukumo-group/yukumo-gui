<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="flex w-full max-w-3xl flex-col gap-2 text-left">
    <h1 class="font-bold tracking-wide text-text text-3xl">
      {{ t('pages.utilities.title') }}
    </h1>
    <p class="leading-relaxed text-text opacity-70 text-base">
      {{ t('pages.utilities.description') }}
    </p>
  </section>
</template>
