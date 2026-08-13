<script setup lang="ts">
import type { AquesTalk2Config } from '../../../types/profile';
import AquesTalk2Form from '../AquesTalk2Form.vue';

const at2 = defineModel<AquesTalk2Config>({ required: true });

const emit = defineEmits<{
  clearError: [];
}>();
</script>

<template>
  <AquesTalk2Form
    v-model="at2"
    @clear-error="emit('clearError')"
  />
</template>
