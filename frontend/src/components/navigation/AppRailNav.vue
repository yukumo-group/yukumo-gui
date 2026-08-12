<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  helpDestination,
  primaryDestinations,
  settingsDestination,
} from '../../navigation/destinations';

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
          <component :is="destination.icon" />
        </template>
      </var-rail-navigation-item>

      <template #end>
        <var-rail-navigation-item
          :name="settingsDestination.path"
          :label="settingsDestination.label"
        >
          <template #icon>
            <component :is="settingsDestination.icon" />
          </template>
        </var-rail-navigation-item>
      </template>
    </var-rail-navigation>
  </aside>
</template>
