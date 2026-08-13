<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { applyAt10Preset } from '../../composables/aquestalkPresets';
import type {
  AquesTalk10Config,
  At10Base,
  At10Preset,
} from '../../types/profile';
import {
  AT10_ACC_MAX,
  AT10_ACC_MIN,
  AT10_FSC_MAX,
  AT10_FSC_MIN,
  AT10_LMD_MAX,
  AT10_LMD_MIN,
  AT10_PIT_MAX,
  AT10_PIT_MIN,
  AT10_PRESET_IDS,
  AT10_VOL_MAX,
  AT10_VOL_MIN,
  RESAMPLE_PITCH_MAX,
  RESAMPLE_PITCH_MIN,
  SPEED_MAX,
  SPEED_MIN,
} from '../../types/profile';
import WizardSliderField from './wizard/WizardSliderField.vue';

const at10 = defineModel<AquesTalk10Config>({ required: true });

withDefaults(
  defineProps<{
    size?: 'normal' | 'small';
  }>(),
  {
    size: 'small',
  },
);

const { t } = useI18n();

const nativeSliders: Array<{
  key: 'spd' | 'vol' | 'pit' | 'acc' | 'lmd' | 'fsc';
  min: number;
  max: number;
  labelKey: string;
}> = [
  {
    key: 'spd',
    min: SPEED_MIN,
    max: SPEED_MAX,
    labelKey: 'pages.profiles.wizard.spd',
  },
  {
    key: 'vol',
    min: AT10_VOL_MIN,
    max: AT10_VOL_MAX,
    labelKey: 'pages.profiles.wizard.vol',
  },
  {
    key: 'pit',
    min: AT10_PIT_MIN,
    max: AT10_PIT_MAX,
    labelKey: 'pages.profiles.wizard.pit',
  },
  {
    key: 'acc',
    min: AT10_ACC_MIN,
    max: AT10_ACC_MAX,
    labelKey: 'pages.profiles.wizard.acc',
  },
  {
    key: 'lmd',
    min: AT10_LMD_MIN,
    max: AT10_LMD_MAX,
    labelKey: 'pages.profiles.wizard.lmd',
  },
  {
    key: 'fsc',
    min: AT10_FSC_MIN,
    max: AT10_FSC_MAX,
    labelKey: 'pages.profiles.wizard.fsc',
  },
];

let applyingPreset = false;

function onPresetChange(value: string | number): void {
  const preset = String(value) as At10Preset;
  if (preset === 'custom') {
    at10.value.preset = 'custom';
    return;
  }
  if (!(AT10_PRESET_IDS as string[]).includes(preset)) return;
  applyingPreset = true;
  Object.assign(at10.value, applyAt10Preset(preset, at10.value.pitch));
  applyingPreset = false;
}

function onBasChange(value: string | number): void {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n !== 0 && n !== 1 && n !== 2) return;
  at10.value.bas = n as At10Base;
  if (!applyingPreset) at10.value.preset = 'custom';
}

function setNative(
  key: 'spd' | 'vol' | 'pit' | 'acc' | 'lmd' | 'fsc',
  value: number,
): void {
  at10.value[key] = value;
  if (!applyingPreset) at10.value.preset = 'custom';
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-3">
      <var-select
        class="min-w-0 flex-1"
        :model-value="at10.preset"
        :size="size"
        variant="outlined"
        :placeholder="t('pages.profiles.wizard.preset')"
        @update:model-value="onPresetChange"
      >
        <var-option
          v-for="id in AT10_PRESET_IDS"
          :key="id"
          :value="id"
          :label="t(`pages.profiles.wizard.presets.${id}`)"
        />
        <var-option
          value="custom"
          :label="t('pages.profiles.wizard.presetCustom')"
        />
      </var-select>
      <var-select
        class="min-w-0 flex-1"
        :model-value="at10.bas"
        :size="size"
        variant="outlined"
        :placeholder="t('pages.profiles.wizard.bas')"
        @update:model-value="onBasChange"
      >
        <var-option
          :value="0"
          :label="t('pages.profiles.wizard.basF1E')"
        />
        <var-option
          :value="1"
          :label="t('pages.profiles.wizard.basF2E')"
        />
        <var-option
          :value="2"
          :label="t('pages.profiles.wizard.basM1E')"
        />
      </var-select>
    </div>
    <div class="flex items-start justify-between gap-1">
      <WizardSliderField
        v-for="slider in nativeSliders"
        :key="slider.key"
        direction="vertical"
        :model-value="at10[slider.key]"
        :label="t(slider.labelKey)"
        :min="slider.min"
        :max="slider.max"
        @update:model-value="setNative(slider.key, $event)"
      />
      <WizardSliderField
        v-model="at10.pitch"
        direction="vertical"
        :label="t('pages.profiles.wizard.resamplePitch')"
        :min="RESAMPLE_PITCH_MIN"
        :max="RESAMPLE_PITCH_MAX"
      />
    </div>
  </div>
</template>
