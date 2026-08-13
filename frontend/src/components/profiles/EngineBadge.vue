<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AquesTalkVersion } from '../../types/profile';

const props = defineProps<{
  version: AquesTalkVersion;
}>();

const { t } = useI18n();

const badgeType = computed(() => {
  const map: Record<AquesTalkVersion, 'success' | 'warning' | 'danger'> = {
    1: 'success',
    2: 'warning',
    10: 'danger',
  };
  return map[props.version];
});

const labelKey = computed(() => {
  const map: Record<AquesTalkVersion, string> = {
    1: 'pages.profiles.engines.at1',
    2: 'pages.profiles.engines.at2',
    10: 'pages.profiles.engines.at10',
  };
  return map[props.version];
});
</script>

<template>
  <var-badge
    class="engine-badge"
    :type="badgeType"
    :value="t(labelKey)"
  />
</template>

<style scoped>
.engine-badge {
  position: static;
  --badge-content-font-size: 0.75rem;
  --badge-content-padding: 2px 6px;
}

.engine-badge :deep(.var-badge__content),
.engine-badge :deep(.var-badge--right-top) {
  position: static;
  top: auto;
  right: auto;
  transform: none;
}
</style>
