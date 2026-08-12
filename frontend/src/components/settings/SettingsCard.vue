<template>
  <var-paper class="settings-card overflow-hidden rounded-2xl" :elevation="1">
    <slot />
  </var-paper>
</template>

<style scoped>
:deep(.settings-item + .settings-item) {
  position: relative;
}

:deep(.settings-item + .settings-item)::before {
  content: '';
  position: absolute;
  top: 0;
  right: 1rem;
  left: 1rem;
  border-top: 1px solid var(--color-on-surface-variant);
  opacity: 0.2;
  pointer-events: none;
}
</style>
