<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from '@lucide/vue';
import { timelinePlayback, reconcileTimelineDuration } from '../../composables/timelineSession';
import { useTimelineViewport } from '../../composables/useTimelineViewport';
import { useTimelineClipAdd } from '../../composables/timeline/useTimelineClipAdd';
import { useTimelineClipDelete } from '../../composables/timeline/useTimelineClipDelete';
import { useTimelineClipDrag } from '../../composables/timeline/useTimelineClipDrag';
import { useTimelineClipResize, type ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';
import { useTimelineClipSplit } from '../../composables/timeline/useTimelineClipSplit';
import { useTimelineDocument } from '../../composables/timeline/useTimelineDocument';
import { useTimelineEdgeScroll } from '../../composables/timeline/useTimelineEdgeScroll';
import { useTimelineEditMode } from '../../composables/timeline/useTimelineEditMode';
import { useTimelineGestures } from '../../composables/timeline/useTimelineGestures';
import { useTimelineMarquee } from '../../composables/timeline/useTimelineMarquee';
import { useTimelineRulerScrub } from '../../composables/timeline/useTimelineRulerScrub';
import { useTimelineSelection } from '../../composables/timeline/useTimelineSelection';
import { useTimelineTrackReorder } from '../../composables/timeline/useTimelineTrackReorder';
import {
  TIMELINE_BOTTOM_PAD_PX,
  TIMELINE_HEADER_WIDTH_PX,
  TIMELINE_RULER_HEIGHT_PX,
  TIMELINE_SCROLLBAR_SIZE_PX,
} from '../../types/timeline';
import TimelineEditModeBar from './TimelineEditModeBar.vue';
import TimelineGridLines from './TimelineGridLines.vue';
import TimelineLane from './TimelineLane.vue';
import TimelinePlayhead from './TimelinePlayhead.vue';
import TimelineRuler from './TimelineRuler.vue';
import TimelineScrollbar from './TimelineScrollbar.vue';
import TimelineTrackHeader from './TimelineTrackHeader.vue';

const { t } = useI18n();

const {
  tracks,
  clips,
  trackCount,
  contentDurationSec,
  contentBoundSec,
  isTrackDimmed,
  clipsForTrack,
  clipAriaLabel,
  addTrack,
  toggleMute,
  toggleSolo,
  setVolume,
  setPan,
  applyClipPlacements,
  applyClipRanges,
  addClip,
  removeClips,
  splitClip,
} = useTimelineDocument(t);

/** Fit/min zoom bound — frozen during drag/scrub, committed on gesture end. */
const fitBoundSec = ref(contentBoundSec.value);
const fitBoundFrozen = ref(false);

function commitFitBound(): void {
  fitBoundSec.value = contentBoundSec.value;
}

watch(contentBoundSec, (value) => {
  if (!fitBoundFrozen.value) {
    fitBoundSec.value = value;
  }
});

function freezeFitBound(): void {
  fitBoundFrozen.value = true;
}

function unfreezeFitBound(): void {
  fitBoundFrozen.value = false;
  commitFitBound();
}

const viewport = useTimelineViewport({
  trackCount,
  contentDurationSec,
  contentBoundSec,
  fitBoundSec,
  reconcileDuration: reconcileTimelineDuration,
});

const {
  pxPerSec,
  trackHeightPx,
  scrollXPx,
  scrollYPx,
  viewportWidthPx,
  viewportHeightPx,
  contentWidthPx,
  contentHeightPx,
  setViewportSize,
  panBy,
  setScrollX,
  setScrollY,
  zoomXAt,
  zoomYAt,
  localXAtTime,
} = viewport;

const selection = useTimelineSelection();
const { selectedClipIdSet } = selection;
const { editMode } = useTimelineEditMode();

const lanesViewportRef = ref<HTMLElement | null>(null);
const rulerRef = ref<HTMLElement | null>(null);
const rulerComponentRef = ref<{
  seekFromClientX: (clientX: number, el: HTMLElement) => void;
} | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const edgeScroll = useTimelineEdgeScroll({
  lanesViewportRef,
  rulerRef,
  panBy,
});

const { onClipPointerDown, endClipDrag, blockedClipIds } = useTimelineClipDrag({
  clips,
  tracks,
  selection,
  viewport,
  edgeScroll,
  applyClipPlacements,
  onDragStart: freezeFitBound,
  onDragEnd: unfreezeFitBound,
});

const { onClipResizePointerDown, endClipResize } = useTimelineClipResize({
  clips,
  selection,
  viewport,
  edgeScroll,
  applyClipRanges,
  onResizeStart: freezeFitBound,
  onResizeEnd: unfreezeFitBound,
});

const { marqueeStyle, startMarquee, endMarquee } = useTimelineMarquee({
  tracks,
  clipsForTrack,
  selection,
  viewport,
  lanesViewportRef,
  edgeScroll,
});

const {
  addPreviewStyle,
  addPreviewInvalid,
  startAdd,
  cancelAdd,
} = useTimelineClipAdd({
  tracks,
  clips,
  viewport,
  lanesViewportRef,
  edgeScroll,
  addClip: (trackId, startSec, durationSec) => {
    const clip = addClip(trackId, startSec, durationSec);
    if (clip) selection.setSelection([clip.id]);
    return clip;
  },
  onAddStart: freezeFitBound,
  onAddEnd: unfreezeFitBound,
});

const { deleteMarqueeStyle, dangerClipIds, startDelete, cancelDelete } =
  useTimelineClipDelete({
    tracks,
    clipsForTrack,
    selection,
    viewport,
    lanesViewportRef,
    edgeScroll,
    removeClips,
  });

const {
  splitPreviewStyle,
  onSplitPointerMove,
  onSplitPointerLeave,
  splitAtPointer,
  clearSplitPreview,
} = useTimelineClipSplit({
  tracks,
  clips,
  selection,
  viewport,
  lanesViewportRef,
  splitClip,
});

const highlightedClipIds = computed(() => {
  const next = new Set(blockedClipIds.value);
  for (const id of dangerClipIds.value) next.add(id);
  return next;
});

const { onSeek, onRulerScrubStart, onRulerScrubMove, onRulerScrubEnd } =
  useTimelineRulerScrub({
    rulerRef,
    rulerComponentRef,
    pxPerSec,
    edgeScroll,
    onScrubStart: freezeFitBound,
    onScrubEnd: unfreezeFitBound,
  });

const {
  onLanesPointerDown,
  onLanesPointerMove,
  onLanesPointerUp,
  onGesturePointerDown,
  onGesturePointerMove,
  onGesturePointerUp,
} = useTimelineGestures({
  rootRef,
  lanesViewportRef,
  rulerRef,
  viewport: {
    pxPerSec,
    trackHeightPx,
    setViewportSize,
    panBy,
    zoomXAt,
    zoomYAt,
  },
});

const {
  previewOffsetY,
  isReorderDragging,
  onReorderStart,
  onReorderEnd,
} = useTimelineTrackReorder({
  tracks,
  trackHeightPx,
});

function onLanesBackgroundDown(e: PointerEvent): void {
  if (e.button === 0 && e.pointerType !== 'touch') {
    switch (editMode.value) {
      case 'select':
        startMarquee(e);
        break;
      case 'add':
        startAdd(e);
        break;
      case 'delete':
        startDelete(e);
        break;
      default:
        break;
    }
  }
  onLanesPointerDown(e);
  onGesturePointerDown(e);
}

function onClipDown(clipId: string, e: PointerEvent): void {
  switch (editMode.value) {
    case 'select':
      onClipPointerDown(clipId, e);
      break;
    case 'delete':
      startDelete(e, clipId);
      break;
    case 'split':
      splitAtPointer(clipId, e);
      break;
    default:
      break;
  }
}

function onClipResizeDown(
  clipId: string,
  edge: ClipResizeEdge,
  e: PointerEvent,
): void {
  if (editMode.value !== 'select') return;
  onClipResizePointerDown(clipId, edge, e);
}

function onLanesMove(e: PointerEvent): void {
  onLanesPointerMove(e);
  onGesturePointerMove(e);
  if (editMode.value === 'split') {
    onSplitPointerMove(e);
  }
}

function onLanesUp(e: PointerEvent): void {
  onLanesPointerUp(e);
  onGesturePointerUp(e);
}

function cancelToolGestures(): void {
  endClipDrag();
  endClipResize();
  endMarquee();
  cancelAdd();
  cancelDelete();
  clearSplitPreview();
}

watch(editMode, (mode) => {
  cancelToolGestures();
  if (mode !== 'select') {
    selection.clearSelection();
  }
});

const playheadLeftPx = computed(() =>
  localXAtTime(timelinePlayback.currentTimeSec.value),
);

onUnmounted(() => {
  onReorderEnd();
  cancelToolGestures();
  edgeScroll.stop();
});

defineExpose({
  togglePlay: timelinePlayback.togglePlay,
  play: timelinePlayback.play,
  pause: timelinePlayback.pause,
  seek: timelinePlayback.seek,
  isPlaying: timelinePlayback.isPlaying,
  elapsedLabel: timelinePlayback.elapsedLabel,
  currentTimeSec: timelinePlayback.currentTimeSec,
});
</script>

<template>
  <div
    ref="rootRef"
    class="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden touch-none select-none"
  >
    <div
      class="flex shrink-0"
      :style="{ height: `${TIMELINE_SCROLLBAR_SIZE_PX}px` }"
    >
      <div
        class="shrink-0 border-b border-outline/20 bg-surface-container"
        :style="{ width: `${TIMELINE_HEADER_WIDTH_PX}px` }"
      />
      <TimelineScrollbar
        class="min-w-0 flex-1 border-b border-outline/20"
        orientation="horizontal"
        :content-size="contentWidthPx"
        :viewport-size="viewportWidthPx"
        :scroll="scrollXPx"
        :ariaLabel="t('pages.generate.timeline.hScrollAriaLabel')"
        @scroll="setScrollX"
      />
      <div
        class="shrink-0 border-b border-l border-outline/20 bg-surface-container"
        :style="{ width: `${TIMELINE_SCROLLBAR_SIZE_PX}px` }"
      />
    </div>

    <div class="flex min-h-0 min-w-0 flex-1">
      <div
        class="flex shrink-0 flex-col overflow-hidden border-r border-outline/30"
        :style="{ width: `${TIMELINE_HEADER_WIDTH_PX}px` }"
      >
        <div
          class="flex shrink-0 items-center border-b border-outline/30 px-1"
          :style="{ height: `${TIMELINE_RULER_HEIGHT_PX}px` }"
        >
          <TimelineEditModeBar v-model="editMode" />
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
              @toggle-mute="toggleMute(track.id)"
              @toggle-solo="toggleSolo(track.id)"
              @reorder-start="onReorderStart(track.id, $event)"
              @update-volume="setVolume(track.id, $event)"
              @update-pan="setPan(track.id, $event)"
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
            @click="addTrack"
          >
            <Plus :size="16" class="mr-1" aria-hidden="true" />
            {{ t('pages.generate.timeline.addTrack') }}
          </var-button>
        </div>
      </div>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div ref="rulerRef">
          <TimelineRuler
            ref="rulerComponentRef"
            :px-per-sec="pxPerSec"
            :scroll-x-px="scrollXPx"
            :viewport-width-px="viewportWidthPx"
            :content-duration-sec="contentDurationSec"
            @seek="onSeek"
            @scrub-start="onRulerScrubStart"
            @scrub-move="onRulerScrubMove"
            @scrub-end="onRulerScrubEnd"
          />
        </div>
        <div class="flex min-h-0 min-w-0 flex-1">
          <div
            ref="lanesViewportRef"
            class="relative min-h-0 min-w-0 flex-1 overflow-hidden"
            :class="{
              'cursor-crosshair': editMode === 'add',
              'cursor-pointer': editMode === 'delete',
              'cursor-col-resize': editMode === 'split',
            }"
            @pointerdown="onLanesBackgroundDown"
            @pointermove="onLanesMove"
            @pointerup="onLanesUp"
            @pointercancel="onLanesUp"
            @pointerleave="onSplitPointerLeave"
            @auxclick.prevent
          >
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
                :height-px="trackCount * trackHeightPx"
              />
              <TimelineLane
                v-for="(track, index) in tracks"
                :key="track.id"
                :track-id="track.id"
                :height-px="trackHeightPx"
                :px-per-sec="pxPerSec"
                :content-width-px="contentWidthPx"
                :clips="clipsForTrack(track.id)"
                :selected-clip-ids="selectedClipIdSet"
                :blocked-clip-ids="highlightedClipIds"
                :dimmed="isTrackDimmed(track)"
                :preview-offset-y="previewOffsetY(track.id, index)"
                :is-dragging="isReorderDragging(track.id)"
                :edit-mode="editMode"
                :clip-aria-label="clipAriaLabel"
                @clip-pointer-down="onClipDown"
                @clip-resize-pointer-down="onClipResizeDown"
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
                :class="
                  splitPreviewStyle.valid ? 'bg-primary' : 'bg-danger'
                "
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
          </div>

          <TimelineScrollbar
            class="shrink-0 self-stretch border-l border-outline/20"
            orientation="vertical"
            :content-size="contentHeightPx"
            :viewport-size="viewportHeightPx"
            :scroll="scrollYPx"
            :ariaLabel="t('pages.generate.timeline.vScrollAriaLabel')"
            @scroll="setScrollY"
          />
        </div>
      </div>
    </div>
  </div>
</template>
