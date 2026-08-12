<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  helpDestination,
  primaryDestinations,
  settingsDestination,
} from '../../navigation/destinations';
import NavIcon from './NavIcon.vue';

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
    class="relative z-20 hidden h-full shrink-0 sm:flex flex-col"
    aria-label="Main navigation"
  >
    <var-rail-navigation
      v-model:active="active"
      :show-label="true"
      class="h-full"
    >
      <var-rail-navigation-item
        v-for="destination in mainDestinations"
        :key="destination.path"
        :name="destination.path"
        :label="destination.label"
      >
        <template #icon>
          <NavIcon
            :icon="destination.icon"
            :active="active === destination.path"
          />
        </template>
      </var-rail-navigation-item>

      <template #end>
        <var-rail-navigation-item
          :name="settingsDestination.path"
          :label="settingsDestination.label"
        >
          <template #icon>
            <NavIcon
              :icon="settingsDestination.icon"
              :active="active === settingsDestination.path"
              variant="settings"
            />
          </template>
        </var-rail-navigation-item>
      </template>
    </var-rail-navigation>
  </aside>
</template>

<style scoped>
:deep(.var-rail-navigation-item--active .var-rail-navigation-item__label) {
  font-weight: 600;
}
</style>
