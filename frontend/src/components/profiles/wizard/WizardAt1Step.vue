<script setup lang="ts">
import type { AquesTalk1Config } from '../../../types/profile';
import AquesTalk1Form from '../AquesTalk1Form.vue';

const at1 = defineModel<AquesTalk1Config>({ required: true });

const emit = defineEmits<{
  clearError: [];
}>();
</script>

<template>
  <AquesTalk1Form
    v-model="at1"
    @clear-error="emit('clearError')"
  />
</template>
