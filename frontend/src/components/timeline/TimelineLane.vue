<script setup lang="ts">
import type { TimelineClip, TimelineEditMode } from '../../types/timeline';
import { TIMELINE_INLINE_LABEL_HEIGHT_PX } from '../../types/timeline';
import type { ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';
import TimelineClipBlock from './TimelineClip.vue';

defineProps<{
  trackId: string;
  heightPx: number;
  pxPerSec: number;
  contentWidthPx: number;
  clips: TimelineClip[];
  selectedClipIds: ReadonlySet<string>;
  blockedClipIds: ReadonlySet<string>;
  dimmed: boolean;
  previewOffsetY: number;
  isDragging: boolean;
  editMode: TimelineEditMode;
  clipAriaLabel: (clip: TimelineClip) => string;
}>();

const emit = defineEmits<{
  clipPointerDown: [clipId: string, event: PointerEvent];
  clipResizePointerDown: [
    clipId: string,
    edge: ClipResizeEdge,
    event: PointerEvent,
  ];
  clipDblclick: [clipId: string];
  clipUpdateText: [clipId: string, text: string];
}>();
</script>

<template>
  <div
    class="relative z-1 shrink-0 border-b border-outline/15"
    :class="[
      dimmed ? 'bg-surface-container/50' : 'bg-transparent',
      isDragging ? 'z-30 bg-primary/5 shadow-md' : '',
    ]"
    :style="{
      height: `${heightPx}px`,
      width: `${contentWidthPx}px`,
      transform: previewOffsetY ? `translateY(${previewOffsetY}px)` : undefined,
    }"
  >
    <TimelineClipBlock
      v-for="clip in clips"
      :key="clip.id"
      :clip="clip"
      :px-per-sec="pxPerSec"
      :selected="selectedClipIds.has(clip.id)"
      :blocked="blockedClipIds.has(clip.id)"
      :dimmed="dimmed"
      :inline="heightPx < TIMELINE_INLINE_LABEL_HEIGHT_PX"
      :editMode="editMode"
      :ariaLabel="clipAriaLabel(clip)"
      @pointer-down="emit('clipPointerDown', clip.id, $event)"
      @resize-pointer-down="
        (edge, event) => emit('clipResizePointerDown', clip.id, edge, event)
      "
      @dblclick="emit('clipDblclick', clip.id)"
      @update-text="(text) => emit('clipUpdateText', clip.id, text)"
    />
  </div>
</template>
