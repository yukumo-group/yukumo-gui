<script setup lang="ts">
import { computed } from 'vue';
import { User } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { CharacterProfile } from '../../types/profile';
import { supportedVersions } from '../../types/profile';
import EngineBadge from './EngineBadge.vue';

const props = withDefaults(
  defineProps<{
    profile: Pick<
      CharacterProfile,
      | 'name'
      | 'description'
      | 'imageDataUrl'
      | 'aquestalk1'
      | 'aquestalk2'
      | 'aquestalk10'
    >;
    interactive?: boolean;
  }>(),
  {
    interactive: true,
  },
);

const emit = defineEmits<{
  select: [];
}>();

const { t } = useI18n();

const versions = computed(() => supportedVersions(props.profile));

const ariaLabel = computed(() =>
  t('pages.profiles.cardAriaLabel', { name: props.profile.name }),
);
</script>

<template>
  <component
    :is="interactive ? 'button' : 'article'"
    class="character-card relative flex flex-col overflow-hidden rounded-2xl bg-surface-container text-left text-text"
    :type="interactive ? 'button' : undefined"
    :aria-label="interactive ? ariaLabel : undefined"
    v-ripple="interactive ? { color: 'var(--color-primary)' } : false"
    @click="interactive ? emit('select') : undefined"
  >
    <var-paper class="flex h-full flex-col overflow-hidden rounded-2xl" :elevation="1">
      <div
        class="character-thumb relative shrink-0 overflow-hidden bg-surface-container-high"
      >
        <img
          v-if="profile.imageDataUrl"
          :src="profile.imageDataUrl"
          alt=""
          class="size-full object-cover"
        />
        <div
          v-else
          class="flex size-full flex-col items-center justify-center gap-2 text-on-surface-variant"
        >
          <User :size="40" aria-hidden="true" />
          <span class="text-sm opacity-80">{{ t('pages.profiles.noImage') }}</span>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-1.5 p-3">
        <h2 class="truncate font-bold text-text text-base">
          {{ profile.name }}
        </h2>
        <p
          v-if="profile.description"
          class="line-clamp-2 text-sm leading-snug text-on-surface-variant"
        >
          {{ profile.description }}
        </p>
        <div class="mt-auto flex flex-wrap gap-1 pt-1">
          <EngineBadge
            v-for="version in versions"
            :key="version"
            :version="version"
          />
        </div>
      </div>
    </var-paper>
  </component>
</template>

<style scoped>
.character-card {
  cursor: default;
  width: 100%;
  min-width: 0;
}

.character-thumb {
  width: 100%;
  aspect-ratio: 1;
}

button.character-card {
  cursor: pointer;
}

button.character-card :deep(.var-paper)::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: hsla(var(--hsl-text), 0.08);
  opacity: 0;
  transition: opacity 120ms ease;
}

button.character-card:hover :deep(.var-paper)::after {
  opacity: 1;
}

button.character-card:focus-visible :deep(.var-paper)::after,
button.character-card:active :deep(.var-paper)::after {
  background: hsla(var(--hsl-text), 0.12);
  opacity: 1;
}

button.character-card:hover :deep(.var-paper),
button.character-card:focus-visible :deep(.var-paper) {
  box-shadow:
    0 2px 4px -1px var(--shadow-key-umbra-opacity),
    0 6px 20px -2px var(--shadow-key-penumbra-opacity),
    0 12px 32px -6px var(--shadow-key-ambient-opacity);
}

button.character-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

</style>
