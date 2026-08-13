<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { TimelineClipSpeaker, TimelineEditMode, TimelineTrack } from '../../types/timeline';
import {
  TIMELINE_BOTTOM_PAD_PX,
  TIMELINE_HEADER_WIDTH_PX,
  TIMELINE_RULER_HEIGHT_PX,
  TIMELINE_SCROLLBAR_SIZE_PX,
} from '../../types/timeline';
import TimelineDefaultSpeakerButton from './TimelineDefaultSpeakerButton.vue';
import TimelineEditModeBar from './TimelineEditModeBar.vue';
import TimelineTrackHeader from './TimelineTrackHeader.vue';

defineProps<{
  tracks: TimelineTrack[];
  trackHeightPx: number;
  scrollYPx: number;
  editMode: TimelineEditMode;
  lastAssignedSpeaker: TimelineClipSpeaker;
  isTrackDimmed: (track: TimelineTrack) => boolean;
  previewOffsetY: (trackId: string, index: number) => number;
  isReorderDragging: (trackId: string) => boolean;
}>();

const emit = defineEmits<{
  'update:editMode': [mode: TimelineEditMode];
  'open-default-speaker': [];
  'toggle-mute': [trackId: string];
  'toggle-solo': [trackId: string];
  'reorder-start': [trackId: string, event: PointerEvent];
  'update-volume': [trackId: string, value: number];
  'update-pan': [trackId: string, value: number];
  'update-engine': [trackId: string, value: TimelineTrack['engine']];
  'add-track': [];
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="flex shrink-0 flex-col overflow-hidden border-r border-outline/30"
    :style="{ width: `${TIMELINE_HEADER_WIDTH_PX}px` }"
  >
    <div
      class="flex shrink-0 items-center border-b border-outline/30 pr-0.5 pl-1"
      :style="{
        height: `${TIMELINE_SCROLLBAR_SIZE_PX + TIMELINE_RULER_HEIGHT_PX}px`,
      }"
    >
      <TimelineEditModeBar
        class="min-w-0 flex-1"
        :model-value="editMode"
        @update:model-value="emit('update:editMode', $event)"
      />
      <TimelineDefaultSpeakerButton
        :speaker="lastAssignedSpeaker"
        @click="emit('open-default-speaker')"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-hidden">
      <div :style="{ transform: `translateY(${-scrollYPx}px)` }">
        <TimelineTrackHeader
          v-for="(track, index) in tracks"
          :key="track.id"
          :track="track"
          :height-px="trackHeightPx"
          :dimmed="isTrackDimmed(track)"
          :preview-offset-y="previewOffsetY(track.id, index)"
          :is-dragging="isReorderDragging(track.id)"
          :reorder-label="t('pages.generate.timeline.reorderTrack')"
          :mute-label="t('pages.generate.timeline.mute')"
          :unmute-label="t('pages.generate.timeline.unmute')"
          :solo-label="t('pages.generate.timeline.solo')"
          :unsolo-label="t('pages.generate.timeline.unsolo')"
          :volume-label="t('pages.generate.timeline.volume')"
          :pan-label="t('pages.generate.timeline.pan')"
          @toggle-mute="emit('toggle-mute', track.id)"
          @toggle-solo="emit('toggle-solo', track.id)"
          @reorder-start="emit('reorder-start', track.id, $event)"
          @update-volume="emit('update-volume', track.id, $event)"
          @update-pan="emit('update-pan', track.id, $event)"
          @update-engine="emit('update-engine', track.id, $event)"
        />
        <div
          class="shrink-0"
          :style="{ height: `${TIMELINE_BOTTOM_PAD_PX}px` }"
          aria-hidden="true"
        />
      </div>
    </div>
    <div class="shrink-0 border-t border-outline/30 p-1">
      <var-button
        block
        size="small"
        text
        type="primary"
        :aria-label="t('pages.generate.timeline.addTrack')"
        @click="emit('add-track')"
      >
        <Plus :size="16" class="mr-1" aria-hidden="true" />
        {{ t('pages.generate.timeline.addTrack') }}
      </var-button>
    </div>
  </div>
</template>
