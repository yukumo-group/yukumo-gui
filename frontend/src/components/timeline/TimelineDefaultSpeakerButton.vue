<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CUSTOM_PROFILE_ID } from '../../types/profile';
import type { TimelineClipSpeaker } from '../../types/timeline';
import { characterProfiles } from '../../composables/useCharacterProfiles';
import { User } from '@lucide/vue';

const props = defineProps<{
  speaker: TimelineClipSpeaker;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n();

const avatarUrl = computed(() => {
  const id = props.speaker.profileId;
  if (!id || id === CUSTOM_PROFILE_ID) return null;
  return (
    characterProfiles.value.find((profile) => profile.id === id)
      ?.imageDataUrl ?? null
  );
});
</script>

<template>
  <var-tooltip
    :content="t('pages.generate.timeline.defaultSpeaker')"
    placement="bottom"
  >
    <button
      type="button"
      class="inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high"
      :aria-label="t('pages.generate.timeline.defaultSpeaker')"
      @click="emit('click')"
    >
      <span
        class="flex size-6 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt=""
          class="size-full object-cover"
        />
        <User
          v-else
          :size="14"
          aria-hidden="true"
        />
      </span>
    </button>
  </var-tooltip>
</template>
