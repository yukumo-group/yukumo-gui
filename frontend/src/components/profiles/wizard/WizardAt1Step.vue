<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AquesTalk1Config } from '../../../types/profile';
import {
  AT1_MODULES,
  RESAMPLE_PITCH_MAX,
  RESAMPLE_PITCH_MIN,
  SPEED_MAX,
  SPEED_MIN,
} from '../../../types/profile';
import WizardSliderField from './WizardSliderField.vue';

const at1 = defineModel<AquesTalk1Config>({ required: true });

const emit = defineEmits<{
  clearError: [];
}>();

const { t } = useI18n();

const moduleOptions = computed(() => {
  const current = at1.value.voiceId.trim();
  if (current && !(AT1_MODULES as readonly string[]).includes(current)) {
    return [current, ...AT1_MODULES];
  }
  return [...AT1_MODULES];
});

function onModuleChange(value: string | number): void {
  at1.value.voiceId = String(value);
  emit('clearError');
}
</script>

<template>
  <var-select
    :model-value="at1.voiceId"
    variant="outlined"
    :placeholder="t('pages.profiles.wizard.voiceIdPlaceholder')"
    @update:model-value="onModuleChange"
  >
    <var-option
      v-for="id in moduleOptions"
      :key="id"
      :value="id"
      :label="id"
    />
  </var-select>
  <WizardSliderField
    v-model="at1.speed"
    :label="t('pages.profiles.wizard.speed')"
    :min="SPEED_MIN"
    :max="SPEED_MAX"
  />
  <WizardSliderField
    v-model="at1.pitch"
    :label="t('pages.profiles.wizard.resamplePitch')"
    :hint="t('pages.profiles.wizard.resamplePitchHint')"
    :min="RESAMPLE_PITCH_MIN"
    :max="RESAMPLE_PITCH_MAX"
  />
</template>
