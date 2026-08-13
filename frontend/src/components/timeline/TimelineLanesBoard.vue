<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';
import type {
  TimelineClip,
  TimelineClipColor,
  TimelineEditMode,
  TimelineTrack,
} from '../../types/timeline';
import { TIMELINE_BOTTOM_PAD_PX } from '../../types/timeline';
import TimelineClipToolbar from './TimelineClipToolbar.vue';
import TimelineGridLines from './TimelineGridLines.vue';
import TimelineLane from './TimelineLane.vue';
import TimelinePlayhead from './TimelinePlayhead.vue';

defineProps<{
  tracks: TimelineTrack[];
  trackHeightPx: number;
  pxPerSec: number;
  scrollXPx: number;
  scrollYPx: number;
  contentWidthPx: number;
  contentDurationSec: number;
  viewportHeightPx: number;
  clipsForTrack: (trackId: string) => TimelineClip[];
  selectedClipIds: ReadonlySet<string>;
  highlightedClipIds: ReadonlySet<string>;
  isTrackDimmed: (track: TimelineTrack) => boolean;
  previewOffsetY: (trackId: string, index: number) => number;
  isReorderDragging: (trackId: string) => boolean;
  editMode: TimelineEditMode;
  clipAriaLabel: (clip: TimelineClip) => string;
  addPreviewStyle: CSSProperties | null;
  addPreviewInvalid: boolean;
  splitPreviewStyle: {
    left: string;
    top: string;
    height: string;
    valid: boolean;
  } | null;
  marqueeStyle: CSSProperties | null;
  deleteMarqueeStyle: CSSProperties | null;
  playheadLeftPx: number;
  showClipToolbar: boolean;
  selectedClips: TimelineClip[];
  canToolbarSplit: boolean;
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
  voice: [];
  content: [];
  split: [];
  color: [value: TimelineClipColor];
  volume: [value: number];
  pan: [value: number];
  mute: [];
  copy: [];
  cut: [];
  delete: [];
}>();
</script>

<template>
  <div
    class="absolute top-0 left-0"
    :style="{
      transform: `translate(${-scrollXPx}px, ${-scrollYPx}px)`,
      width: `${contentWidthPx}px`,
    }"
  >
    <TimelineGridLines
      :px-per-sec="pxPerSec"
      :content-duration-sec="contentDurationSec"
      :height-px="tracks.length * trackHeightPx"
    />
    <TimelineLane
      v-for="(track, index) in tracks"
      :key="track.id"
      :track-id="track.id"
      :height-px="trackHeightPx"
      :px-per-sec="pxPerSec"
      :content-width-px="contentWidthPx"
      :clips="clipsForTrack(track.id)"
      :selected-clip-ids="selectedClipIds"
      :blocked-clip-ids="highlightedClipIds"
      :dimmed="isTrackDimmed(track)"
      :preview-offset-y="previewOffsetY(track.id, index)"
      :is-dragging="isReorderDragging(track.id)"
      :edit-mode="editMode"
      :clip-aria-label="clipAriaLabel"
      @clip-pointer-down="
        (clipId, event) => emit('clipPointerDown', clipId, event)
      "
      @clip-resize-pointer-down="
        (clipId, edge, event) =>
          emit('clipResizePointerDown', clipId, edge, event)
      "
      @clip-dblclick="(clipId) => emit('clipDblclick', clipId)"
      @clip-update-text="
        (clipId, text) => emit('clipUpdateText', clipId, text)
      "
    />
    <div
      v-if="addPreviewStyle"
      class="pointer-events-none absolute z-20 rounded-md border"
      :class="
        addPreviewInvalid
          ? 'border-danger bg-danger/25'
          : 'border-primary/60 bg-primary/20'
      "
      :style="addPreviewStyle"
      aria-hidden="true"
    />
    <div
      v-if="splitPreviewStyle"
      class="pointer-events-none absolute z-20 w-0.5 -translate-x-1/2"
      :class="splitPreviewStyle.valid ? 'bg-primary' : 'bg-danger'"
      :style="{
        left: splitPreviewStyle.left,
        top: splitPreviewStyle.top,
        height: splitPreviewStyle.height,
      }"
      aria-hidden="true"
    />
    <div
      :style="{
        height: `${TIMELINE_BOTTOM_PAD_PX}px`,
        width: `${contentWidthPx}px`,
      }"
      aria-hidden="true"
    />
  </div>

  <div
    v-if="marqueeStyle"
    class="pointer-events-none absolute z-30 border border-primary bg-primary/15"
    :style="marqueeStyle"
    aria-hidden="true"
  />
  <div
    v-if="deleteMarqueeStyle"
    class="pointer-events-none absolute z-30 border border-danger bg-danger/15"
    :style="deleteMarqueeStyle"
    aria-hidden="true"
  />

  <TimelinePlayhead
    :left-px="playheadLeftPx"
    :height-px="viewportHeightPx"
  />

  <div
    v-if="showClipToolbar"
    class="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3"
  >
    <TimelineClipToolbar
      :clips="selectedClips"
      :can-split="canToolbarSplit"
      @voice="emit('voice')"
      @content="emit('content')"
      @split="emit('split')"
      @color="emit('color', $event)"
      @volume="emit('volume', $event)"
      @pan="emit('pan', $event)"
      @mute="emit('mute')"
      @copy="emit('copy')"
      @cut="emit('cut')"
      @delete="emit('delete')"
    />
  </div>
</template>
