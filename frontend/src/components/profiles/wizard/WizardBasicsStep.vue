<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const name = defineModel<string>('name', { required: true });
const description = defineModel<string>('description', { required: true });
const engines = defineModel<Array<number | string>>('engines', {
  required: true,
});

const emit = defineEmits<{
  clearError: [];
}>();

const { t } = useI18n();
</script>

<template>
  <var-input
    v-model="name"
    size="small"
    variant="outlined"
    :placeholder="t('pages.profiles.wizard.namePlaceholder')"
    :aria-label="t('pages.profiles.wizard.namePlaceholder')"
    @update:model-value="emit('clearError')"
  />
  <var-input
    v-model="description"
    size="small"
    variant="outlined"
    textarea
    :rows="3"
    :placeholder="t('pages.profiles.wizard.descriptionPlaceholder')"
    :aria-label="t('pages.profiles.wizard.descriptionPlaceholder')"
  />
  <div class="flex flex-col gap-1">
    <p class="text-base font-medium text-text">
      {{ t('pages.profiles.wizard.engines') }}
    </p>
    <p class="text-sm text-on-surface-variant">
      {{ t('pages.profiles.wizard.enginesHint') }}
    </p>
    <var-checkbox-group
      v-model="engines"
      @update:model-value="emit('clearError')"
    >
      <var-checkbox :checked-value="1">
        {{ t('pages.profiles.engines.at1') }}
      </var-checkbox>
      <var-checkbox :checked-value="2">
        {{ t('pages.profiles.engines.at2') }}
      </var-checkbox>
      <var-checkbox :checked-value="10">
        {{ t('pages.profiles.engines.at10') }}
      </var-checkbox>
    </var-checkbox-group>
  </div>
</template>
