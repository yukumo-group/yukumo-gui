<script setup lang="ts">
import type { AquesTalk10Config } from '../../../types/profile';
import AquesTalk10Form from '../AquesTalk10Form.vue';

const at10 = defineModel<AquesTalk10Config>({ required: true });
</script>

<template>
  <AquesTalk10Form v-model="at10" />
</template>
