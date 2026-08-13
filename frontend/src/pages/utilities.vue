<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import QuickGenerateCard from '../components/utilities/QuickGenerateCard.vue';

const { t } = useI18n();
</script>

<template>
  <section
    class="flex w-full max-w-5xl flex-col gap-6 px-6 pt-8 pb-8 text-left sm:px-6"
  >
    <h1 class="font-bold tracking-wide text-text text-3xl">
      {{ t('pages.utilities.title') }}
    </h1>

    <QuickGenerateCard />
  </section>
</template>
