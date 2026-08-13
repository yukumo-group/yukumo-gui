<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { AquesTalkVersion } from '../../types/profile';
import EngineBadge from '../profiles/EngineBadge.vue';
import VersionSelectLabel from '../profiles/VersionSelectLabel.vue';

const ENGINE_VERSIONS: AquesTalkVersion[] = [1, 2, 10];

const versionLabelKey: Record<AquesTalkVersion, string> = {
  1: 'pages.profiles.wizard.steps.at1',
  2: 'pages.profiles.wizard.steps.at2',
  10: 'pages.profiles.wizard.steps.at10',
};

const props = defineProps<{
  modelValue: AquesTalkVersion;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AquesTalkVersion];
}>();

const { t } = useI18n();

function onSelect(value: unknown): void {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n !== 1 && n !== 2 && n !== 10) return;
  emit('update:modelValue', n);
}
</script>

<template>
  <var-menu-select
    class="inline-flex shrink-0"
    :model-value="modelValue"
    size="mini"
    placement="bottom-start"
    popover-class="timeline-engine-menu"
    close-on-select
    @update:model-value="onSelect"
    @pointerdown.stop
  >
    <button
      type="button"
      class="inline-flex shrink-0 items-center rounded-sm hover:opacity-80"
      :aria-label="
        t('pages.generate.timeline.engineAriaLabel', {
          engine: t(versionLabelKey[props.modelValue]),
        })
      "
      :aria-haspopup="true"
    >
      <EngineBadge :version="modelValue" />
    </button>
    <template #options>
      <var-menu-option
        v-for="version in ENGINE_VERSIONS"
        :key="version"
        :value="version"
      >
        <VersionSelectLabel
          :version="version"
          :label="t(versionLabelKey[version])"
        />
      </var-menu-option>
    </template>
  </var-menu-select>
</template>

<style>
.timeline-engine-menu {
  --menu-select-menu-background-color: var(--color-body);
}

.timeline-engine-menu .var-menu-select__menu {
  overflow: hidden;
}
</style>
