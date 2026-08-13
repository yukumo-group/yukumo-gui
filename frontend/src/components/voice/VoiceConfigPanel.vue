<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AquesTalk1Form from '../profiles/AquesTalk1Form.vue';
import AquesTalk2Form from '../profiles/AquesTalk2Form.vue';
import AquesTalk10Form from '../profiles/AquesTalk10Form.vue';
import ProfileSelectLabel from '../profiles/ProfileSelectLabel.vue';
import { createDefaultAquesTalk10 } from '../../composables/aquestalkPresets';
import { characterProfiles } from '../../composables/useCharacterProfiles';
import type {
  AquesTalk1Config,
  AquesTalk10Config,
  AquesTalk2Config,
  AquesTalkVersion,
  CharacterProfile,
} from '../../types/profile';
import {
  CUSTOM_PROFILE_ID,
  createDefaultAquesTalk1,
  createDefaultAquesTalk2,
  supportedVersions,
} from '../../types/profile';

const props = defineProps<{
  version: AquesTalkVersion;
  profileId: string;
  at1: AquesTalk1Config;
  at2: AquesTalk2Config;
  at10: AquesTalk10Config;
}>();

const emit = defineEmits<{
  'update:profileId': [value: string];
  'update:at1': [value: AquesTalk1Config];
  'update:at2': [value: AquesTalk2Config];
  'update:at10': [value: AquesTalk10Config];
}>();

const { t } = useI18n();

/** Suppresses profile→custom switch while loading a saved profile into the forms. */
let syncingConfig = false;

const compatibleProfiles = computed(() =>
  characterProfiles.value.filter((profile) =>
    supportedVersions(profile).includes(props.version),
  ),
);

const selectedProfile = computed<CharacterProfile | null>(() => {
  if (props.profileId === CUSTOM_PROFILE_ID) return null;
  return (
    compatibleProfiles.value.find((profile) => profile.id === props.profileId) ??
    null
  );
});

const selectedProfileLabel = computed(() =>
  selectedProfile.value
    ? selectedProfile.value.name
    : t('pages.utilities.quickGenerate.customProfile'),
);

const selectedProfileImage = computed(
  () => selectedProfile.value?.imageDataUrl ?? null,
);

function withConfigSync(fn: () => void): void {
  syncingConfig = true;
  fn();
  void nextTick(() => {
    syncingConfig = false;
  });
}

function resetCustomConfigs(): void {
  withConfigSync(() => {
    emit('update:at1', createDefaultAquesTalk1());
    emit('update:at2', createDefaultAquesTalk2());
    emit('update:at10', createDefaultAquesTalk10());
  });
}

function applyProfileConfig(id: string): void {
  if (id === CUSTOM_PROFILE_ID) return;
  const profile = characterProfiles.value.find((item) => item.id === id);
  if (!profile) return;
  withConfigSync(() => {
    if (profile.aquestalk1) {
      emit('update:at1', { ...profile.aquestalk1 });
    }
    if (profile.aquestalk2) {
      emit('update:at2', { ...profile.aquestalk2 });
    }
    if (profile.aquestalk10) {
      emit('update:at10', { ...profile.aquestalk10 });
    }
  });
}

function markCustomized(): void {
  if (syncingConfig) return;
  if (props.profileId !== CUSTOM_PROFILE_ID) {
    emit('update:profileId', CUSTOM_PROFILE_ID);
  }
}

function onProfileChange(value: string | number): void {
  const id = String(value);
  emit('update:profileId', id);
  if (id === CUSTOM_PROFILE_ID) {
    resetCustomConfigs();
    return;
  }
  applyProfileConfig(id);
}

watch(
  () => [props.at1, props.at2, props.at10],
  () => {
    markCustomized();
  },
  { deep: true },
);

watch(
  () => props.version,
  () => {
    if (props.profileId === CUSTOM_PROFILE_ID) return;
    const stillCompatible = compatibleProfiles.value.some(
      (profile) => profile.id === props.profileId,
    );
    if (!stillCompatible) {
      emit('update:profileId', CUSTOM_PROFILE_ID);
      resetCustomConfigs();
    } else {
      applyProfileConfig(props.profileId);
    }
  },
);

watch(characterProfiles, () => {
  if (props.profileId === CUSTOM_PROFILE_ID) return;
  const exists = characterProfiles.value.some(
    (profile) => profile.id === props.profileId,
  );
  if (!exists) {
    emit('update:profileId', CUSTOM_PROFILE_ID);
    resetCustomConfigs();
  }
});
</script>

<template>
  <div class="flex min-h-0 w-full flex-col gap-3">
    <var-select
      :model-value="profileId"
      size="small"
      variant="outlined"
      :placeholder="t('pages.utilities.quickGenerate.profile')"
      @update:model-value="onProfileChange"
    >
      <template #selected>
        <ProfileSelectLabel
          :name="selectedProfileLabel"
          :image-data-url="selectedProfileImage"
        />
      </template>
      <var-option
        :value="CUSTOM_PROFILE_ID"
        :label="t('pages.utilities.quickGenerate.customProfile')"
      >
        <ProfileSelectLabel
          :name="t('pages.utilities.quickGenerate.customProfile')"
          :image-data-url="null"
        />
      </var-option>
      <var-option
        v-for="profile in compatibleProfiles"
        :key="profile.id"
        :value="profile.id"
        :label="profile.name"
      >
        <ProfileSelectLabel
          :name="profile.name"
          :image-data-url="profile.imageDataUrl"
        />
      </var-option>
    </var-select>

    <p
      v-if="compatibleProfiles.length === 0"
      class="text-sm text-on-surface-variant"
    >
      {{ t('pages.utilities.quickGenerate.noCompatibleProfiles') }}
    </p>

    <div class="flex max-h-80 flex-col gap-3 overflow-y-auto sm:max-h-none">
      <p class="text-sm font-medium text-on-surface-variant">
        {{ t('pages.utilities.quickGenerate.customConfig') }}
      </p>
      <AquesTalk1Form
        v-if="version === 1"
        :model-value="at1"
        @update:model-value="emit('update:at1', $event)"
      />
      <AquesTalk2Form
        v-else-if="version === 2"
        :model-value="at2"
        @update:model-value="emit('update:at2', $event)"
      />
      <AquesTalk10Form
        v-else
        :model-value="at10"
        @update:model-value="emit('update:at10', $event)"
      />
    </div>
  </div>
</template>
