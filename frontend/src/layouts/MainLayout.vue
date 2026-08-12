<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppRailNav from '../components/navigation/AppRailNav.vue';
import AppBottomNav from '../components/navigation/AppBottomNav.vue';
</script>

<template>
  <div
    class="layout-chrome relative flex h-screen w-screen flex-col overflow-hidden sm:flex-row"
  >
    <AppRailNav />

    <main
      class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0 sm:p-1"
    >
      <div
        class="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-hidden rounded-none bg-body p-0 sm:rounded-2xl sm:p-2"
      >
        <div
          class="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto"
        >
          <RouterView v-slot="{ Component, route }">
            <Transition name="page">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </div>
    </main>

    <AppBottomNav />
  </div>
</template>

<style scoped>
.layout-chrome {
  background-color: var(--rail-navigation-background);
}
</style>
