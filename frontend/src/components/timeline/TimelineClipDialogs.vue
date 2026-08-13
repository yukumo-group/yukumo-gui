<script setup lang="ts">
import type { AquesTalkVersion } from '../../types/profile';
import type { TimelineClipSpeaker } from '../../types/timeline';
import TimelineClipContentDialog from './TimelineClipContentDialog.vue';
import TimelineClipSplitDialog from './TimelineClipSplitDialog.vue';
import TimelineClipVoiceDialog from './TimelineClipVoiceDialog.vue';

defineProps<{
  voiceShow: boolean;
  voiceEngine: AquesTalkVersion;
  voiceSpeaker: TimelineClipSpeaker;
  voiceTitle: string;
  contentShow: boolean;
  contentText: string;
  splitShow: boolean;
  splitText: string;
  splitInitialIndex: number;
}>();

const emit = defineEmits<{
  'update:voiceShow': [value: boolean];
  'update:contentShow': [value: boolean];
  'update:splitShow': [value: boolean];
  voiceConfirm: [speaker: TimelineClipSpeaker];
  contentConfirm: [text: string];
  splitConfirm: [index: number];
}>();
</script>

<template>
  <TimelineClipVoiceDialog
    :show="voiceShow"
    :version="voiceEngine"
    :speaker="voiceSpeaker"
    :title="voiceTitle"
    @update:show="emit('update:voiceShow', $event)"
    @confirm="emit('voiceConfirm', $event)"
  />
  <TimelineClipContentDialog
    :show="contentShow"
    :text="contentText"
    @update:show="emit('update:contentShow', $event)"
    @confirm="emit('contentConfirm', $event)"
  />
  <TimelineClipSplitDialog
    :show="splitShow"
    :text="splitText"
    :initial-index="splitInitialIndex"
    @update:show="emit('update:splitShow', $event)"
    @confirm="emit('splitConfirm', $event)"
  />
</template>
