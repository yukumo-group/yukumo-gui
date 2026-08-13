<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AquesTalkVersion } from '../../types/profile';
import type { TimelineClipSpeaker } from '../../types/timeline';
import { cloneSpeaker } from '../../composables/timeline/clipModel';
import VoiceConfigPanel from '../voice/VoiceConfigPanel.vue';

const props = defineProps<{
  show: boolean;
  version: AquesTalkVersion;
  speaker: TimelineClipSpeaker;
  title: string;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [speaker: TimelineClipSpeaker];
}>();

const { t } = useI18n();

const draft = ref<TimelineClipSpeaker>(cloneSpeaker(props.speaker));

watch(
  () => props.show,
  (show) => {
    if (show) draft.value = cloneSpeaker(props.speaker);
  },
);

function setShow(value: boolean): void {
  emit('update:show', value);
}

function onConfirm(): void {
  emit('confirm', cloneSpeaker(draft.value));
  setShow(false);
}
</script>

<template>
  <var-dialog
    :show="show"
    dialog-class="timeline-clip-voice-dialog"
    width="24rem"
    :title="title"
    :confirm-button="false"
    :cancel-button="false"
    :close-on-click-overlay="true"
    :close-on-key-escape="true"
    @update:show="setShow"
  >
    <VoiceConfigPanel
      :key="`${show}-${version}`"
      :version="version"
      v-model:profile-id="draft.profileId"
      v-model:at1="draft.aquestalk1"
      v-model:at2="draft.aquestalk2"
      v-model:at10="draft.aquestalk10"
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
.timeline-clip-voice-dialog {
  max-width: min(24rem, 92vw);
}
</style>
