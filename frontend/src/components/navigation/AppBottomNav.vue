<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { bottomDestinations } from '../../navigation/destinations';
import NavIcon from './NavIcon.vue';
import NavLabel from './NavLabel.vue';

const { t } = useI18n();
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
    :aria-label="t('nav.mainAriaLabel')"
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
      >
        <template #icon>
          <NavIcon
            :icon="destination.icon"
            :active="active === destination.path"
            :variant="destination.path === '/settings' ? 'settings' : 'default'"
          />
        </template>
        <NavLabel
          :active="active === destination.path"
          :text="t(destination.labelKey)"
          :gap="6"
        />
      </var-bottom-navigation-item>
    </var-bottom-navigation>
  </nav>
</template>

<style scoped>
:deep(.var-bottom-navigation-item .var-ripple) {
  display: none;
}
:deep(.var-bottom-navigation-item) {
  padding-top: 6px;
  padding-bottom: 6px;
}
:deep(.var-bottom-navigation-item__label) {
  margin-top: 0;
  display: block;
}
</style>
