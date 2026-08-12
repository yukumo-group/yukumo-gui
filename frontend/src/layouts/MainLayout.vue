<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppRailNav from '../components/navigation/AppRailNav.vue';
import AppBottomNav from '../components/navigation/AppBottomNav.vue';
import backgroundImage from '../assets/images/background.webp';
</script>

<template>
  <div
    class="relative flex h-screen w-screen flex-col overflow-hidden bg-cover bg-center bg-no-repeat sm:flex-row"
  >
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-white/70"
      aria-hidden="true"
    />

    <AppRailNav />

    <main
      class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
    >
      <RouterView v-slot="{ Component, route }">
        <Transition name="page">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <AppBottomNav />
  </div>
</template>
