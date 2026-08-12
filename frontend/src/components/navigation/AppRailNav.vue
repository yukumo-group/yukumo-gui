<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  helpDestination,
  primaryDestinations,
  settingsDestination,
} from '../../navigation/destinations';
import NavIcon from './NavIcon.vue';
import NavLabel from './NavLabel.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const mainDestinations = [...primaryDestinations, helpDestination];

const active = computed<string>({
  get(): string {
    return route.path;
  },
  set(path: string): void {
    if (path !== route.path) {
      void router.push(path);
    }
  },
});
</script>

<template>
  <aside
    class="relative z-20 hidden h-full shrink-0 sm:flex flex-col shadow-md"
    :aria-label="t('nav.mainAriaLabel')"
  >
    <var-rail-navigation
      v-model:active="active"
      :show-label="true"
      class="h-full"
    >
      <var-tooltip
        v-for="destination in mainDestinations" 
        :key="destination.path" 
        :content="t(destination.labelKey)"
        :disabled="active === destination.path"
        placement="right"
      >
        <var-rail-navigation-item :name="destination.path">
          <template #icon>
            <NavIcon
              :icon="destination.icon"
              :active="active === destination.path"
            />
          </template>
          <template #default="{ active: itemActive }">
            <NavLabel
              :active="itemActive"
              :text="t(destination.labelKey)"
            />
          </template>
        </var-rail-navigation-item>
      </var-tooltip>

      <template #end>
        <var-rail-navigation-item :name="settingsDestination.path">
          <template #icon>
            <NavIcon
              :icon="settingsDestination.icon"
              :active="active === settingsDestination.path"
              variant="settings"
            />
          </template>
          <template #default="{ active: itemActive }">
            <NavLabel
              :active="itemActive"
              :text="t(settingsDestination.labelKey)"
            />
          </template>
        </var-rail-navigation-item>
      </template>
    </var-rail-navigation>
  </aside>
</template>

<style scoped>
:deep(.var-rail-navigation-item) {
  min-height: auto;
}
:deep(.var-rail-navigation-item__label) {
  margin-top: 0;
  display: block;
  max-width: 100%;
}
</style>
