<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AquesTalk2Config } from '../../types/profile';
import {
  AT2_PHONTS,
  RESAMPLE_PITCH_MAX,
  RESAMPLE_PITCH_MIN,
  SPEED_MAX,
  SPEED_MIN,
} from '../../types/profile';
import WizardSliderField from './wizard/WizardSliderField.vue';

const at2 = defineModel<AquesTalk2Config>({ required: true });

withDefaults(
  defineProps<{
    size?: 'normal' | 'small';
  }>(),
  {
    size: 'small',
  },
);

const emit = defineEmits<{
  clearError: [];
}>();

const { t } = useI18n();

const phontOptions = computed(() => {
  const current = at2.value.phontName.trim();
  if (current && !(AT2_PHONTS as readonly string[]).includes(current)) {
    return [current, ...AT2_PHONTS];
  }
  return [...AT2_PHONTS];
});

function phontLabel(id: string): string {
  return id.endsWith('.phont') ? id : `${id}.phont`;
}

function onPhontChange(value: string | number): void {
  at2.value.phontName = String(value);
  emit('clearError');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <var-select
      :model-value="at2.phontName"
      :size="size"
      variant="outlined"
      :placeholder="t('pages.profiles.wizard.phontNamePlaceholder')"
      @update:model-value="onPhontChange"
    >
      <var-option
        v-for="id in phontOptions"
        :key="id"
        :value="id"
        :label="phontLabel(id)"
      />
    </var-select>
    <WizardSliderField
      v-model="at2.speed"
      :label="t('pages.profiles.wizard.speed')"
      :min="SPEED_MIN"
      :max="SPEED_MAX"
    />
    <WizardSliderField
      v-model="at2.pitch"
      :label="t('pages.profiles.wizard.resamplePitch')"
      :hint="t('pages.profiles.wizard.resamplePitchHint')"
      :min="RESAMPLE_PITCH_MIN"
      :max="RESAMPLE_PITCH_MAX"
    />
  </div>
</template>
