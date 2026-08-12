<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import CharacterCard from '../components/profiles/CharacterCard.vue';
import CharacterWizardDialog from '../components/profiles/CharacterWizardDialog.vue';
import { characterProfiles } from '../composables/useCharacterProfiles';
import type { CharacterProfile } from '../types/profile';

const { t } = useI18n();

const wizardOpen = ref(false);
const editing = ref<CharacterProfile | null>(null);

function openCreate(): void {
  editing.value = null;
  wizardOpen.value = true;
}

function openEdit(profile: CharacterProfile): void {
  editing.value = profile;
  wizardOpen.value = true;
}
</script>

<template>
  <section
    class="relative flex w-full max-w-6xl flex-col gap-4 px-4 pt-8 pb-8 text-left sm:px-6"
  >
    <header class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="font-bold tracking-wide text-text text-3xl">
          {{ t('pages.profiles.title') }}
        </h1>
        <p class="leading-relaxed text-text opacity-70 text-base">
          {{ t('pages.profiles.description') }}
        </p>
      </div>
      <var-button
        class="shrink-0"
        type="primary"
        size="small"
        :aria-label="t('pages.profiles.createAriaLabel')"
        @click="openCreate"
      >
        <Plus :size="18" aria-hidden="true" />
        {{ t('pages.profiles.create') }}
      </var-button>
    </header>

    <div
      v-if="characterProfiles.length === 0"
      class="flex flex-col items-start gap-3 rounded-2xl bg-surface-container px-4 py-6"
    >
      <p class="text-text">{{ t('pages.profiles.empty') }}</p>
      <p class="text-sm text-on-surface-variant">
        {{ t('pages.profiles.emptyHint') }}
      </p>
    </div>

    <div
      v-else
      class="character-grid"
    >
      <CharacterCard
        v-for="profile in characterProfiles"
        :key="profile.id"
        :profile="profile"
        @select="openEdit(profile)"
      />
    </div>

    <CharacterWizardDialog
      v-model:show="wizardOpen"
      :profile="editing"
    />
  </section>
</template>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 11rem);
  justify-content: start;
  gap: 1rem;
}
</style>
