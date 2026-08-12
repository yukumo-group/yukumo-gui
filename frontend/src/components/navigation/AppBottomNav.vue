<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { bottomDestinations } from '../../navigation/destinations';

const route = useRoute();
const router = useRouter();

// Help is not a bottom-nav item; keep Settings highlighted while on Help.
const active = computed<string>({
  get(): string {
    if (route.path === '/help') {
      return '/settings';
    }
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
  <nav
    class="relative z-20 shrink-0 sm:hidden"
    aria-label="Main navigation"
  >
    <var-bottom-navigation
      variant
      v-model:active="active"
      :fixed="false"
      :safe-area="true"
    >
      <var-bottom-navigation-item
        v-for="destination in bottomDestinations"
        :key="destination.path"
        :name="destination.path"
        :label="destination.label"
      >
        <template #icon>
          <component :is="destination.icon" />
        </template>
      </var-bottom-navigation-item>
    </var-bottom-navigation>
  </nav>
</template>

<style scoped>
:deep(.var-bottom-navigation-item .var-ripple) {
  display: none;
}
:deep(.var-bottom-navigation-item .var-bottom-navigation-item__label) {
  font-size: 12px;
}
</style>
