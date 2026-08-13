<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SpeechTextEditor from '../voice/SpeechTextEditor.vue';

const props = defineProps<{
  show: boolean;
  text: string;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [text: string];
}>();

const { t } = useI18n();

const draft = ref(props.text);

watch(
  () => props.show,
  (show) => {
    if (show) draft.value = props.text;
  },
);

function setShow(value: boolean): void {
  emit('update:show', value);
}

function onConfirm(): void {
  emit('confirm', draft.value);
  setShow(false);
}
</script>

<template>
  <var-dialog
    :show="show"
    dialog-class="timeline-clip-content-dialog"
    width="36rem"
    :title="t('pages.generate.timeline.contentDialogTitle')"
    :confirm-button="false"
    :cancel-button="false"
    :close-on-click-overlay="true"
    :close-on-key-escape="true"
    @update:show="setShow"
  >
    <SpeechTextEditor
      v-model="draft"
      :ariaLabel="t('pages.utilities.quickGenerate.editorAriaLabel')"
    />
    <template #actions="{ slotClass }">
      <div :class="[slotClass, 'flex w-full justify-end gap-2']">
        <var-button
          text
          @click="setShow(false)"
        >
          {{ t('pages.generate.timeline.dialogCancel') }}
        </var-button>
        <var-button
          type="primary"
          @click="onConfirm"
        >
          {{ t('pages.generate.timeline.dialogApply') }}
        </var-button>
      </div>
    </template>
  </var-dialog>
</template>

<style>
.timeline-clip-content-dialog {
  max-width: min(36rem, 92vw);
}
</style>
