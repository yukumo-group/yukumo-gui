<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  timelinePlayback,
  reconcileTimelineDuration,
} from '../../composables/timelineSession';
import { useTimelineViewport } from '../../composables/useTimelineViewport';
import { useTimelineClipAdd } from '../../composables/timeline/useTimelineClipAdd';
import { useTimelineClipDelete } from '../../composables/timeline/useTimelineClipDelete';
import { useTimelineClipDrag } from '../../composables/timeline/useTimelineClipDrag';
import { useTimelineClipResize } from '../../composables/timeline/useTimelineClipResize';
import { useTimelineClipSplit } from '../../composables/timeline/useTimelineClipSplit';
import { useTimelineDocument } from '../../composables/timeline/useTimelineDocument';
import { useTimelineEdgeScroll } from '../../composables/timeline/useTimelineEdgeScroll';
import { useTimelineClipboard } from '../../composables/timeline/useTimelineClipboard';
import { useTimelineClipInspector } from '../../composables/timeline/useTimelineClipInspector';
import { useTimelineEditMode } from '../../composables/timeline/useTimelineEditMode';
import { useTimelineFitBound } from '../../composables/timeline/useTimelineFitBound';
import { useTimelineHotkeys } from '../../composables/timeline/useTimelineHotkeys';
import { useTimelineGestures } from '../../composables/timeline/useTimelineGestures';
import { useTimelineLaneInteractions } from '../../composables/timeline/useTimelineLaneInteractions';
import { useTimelineMarquee } from '../../composables/timeline/useTimelineMarquee';
import { useTimelineRulerScrub } from '../../composables/timeline/useTimelineRulerScrub';
import { useTimelineSelection } from '../../composables/timeline/useTimelineSelection';
import { useTimelineTrackReorder } from '../../composables/timeline/useTimelineTrackReorder';
import { TIMELINE_SCROLLBAR_SIZE_PX } from '../../types/timeline';
import TimelineClipDialogs from './TimelineClipDialogs.vue';
import TimelineLanesBoard from './TimelineLanesBoard.vue';
import TimelineRuler from './TimelineRuler.vue';
import TimelineScrollbar from './TimelineScrollbar.vue';
import TimelineTrackList from './TimelineTrackList.vue';

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
  setEngine,
  applyClipPlacements,
  applyClipRanges,
  addClip,
  removeClips,
  splitClip,
  insertClips,
  setClipText,
  applySpeakerToClips,
  setDefaultSpeaker,
  lastAssignedSpeaker,
  reconcileUnsupportedSpeakers,
  setClipsVolume,
  setClipsPan,
  setClipsMuted,
  setClipsColor,
} = useTimelineDocument(t);

const { fitBoundSec, freezeFitBound, unfreezeFitBound } =
  useTimelineFitBound(contentBoundSec);

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
const { editMode, stickyEditMode, setEditMode, pushOverlay, popOverlay, clearOverlays } =
  useTimelineEditMode();

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

const { onClipPointerDown, endClipDrag, blockedClipIds, isDragging } =
  useTimelineClipDrag({
    clips,
    tracks,
    selection,
    viewport,
    edgeScroll,
    applyClipPlacements,
    onDragStart: freezeFitBound,
    onDragEnd: () => {
      unfreezeFitBound();
      reconcileUnsupportedSpeakers();
    },
  });

const { onClipResizePointerDown, endClipResize, isResizing } =
  useTimelineClipResize({
    clips,
    selection,
    viewport,
    edgeScroll,
    applyClipRanges,
    onResizeStart: freezeFitBound,
    onResizeEnd: unfreezeFitBound,
  });

const { marqueeStyle, startMarquee, endMarquee, isMarqueeActive } =
  useTimelineMarquee({
    tracks,
    clipsForTrack,
    selection,
    viewport,
    lanesViewportRef,
    edgeScroll,
  });

const { addPreviewStyle, addPreviewInvalid, startAdd, cancelAdd } =
  useTimelineClipAdd({
    tracks,
    clips,
    viewport,
    lanesViewportRef,
    edgeScroll,
    addClip: (trackId, startSec, durationSec) => {
      const clip = addClip(trackId, startSec, durationSec);
      if (clip) {
        if (stickyEditMode.value === 'select') {
          selection.addClipToSelection(clip.id);
        } else {
          selection.setSelection([clip.id]);
        }
      }
      return clip;
    },
    onAddStart: freezeFitBound,
    onAddEnd: unfreezeFitBound,
  });

const {
  selectedClips,
  firstSelectedClip,
  rememberPointerSplitTime,
  onSplitRequest,
  canToolbarSplit,
  showClipToolbar,
  voiceDialogShow,
  contentDialogShow,
  voiceEngine,
  voiceSpeaker,
  voiceDialogTitle,
  splitDialogShow,
  splitDialogText,
  splitDialogInitialIndex,
  requestRemoveClips,
  deleteSelection,
  openDefaultSpeakerDialog,
  openClipVoiceDialog,
  onToolbarSplit,
  onToolbarMute,
  onVoiceConfirm,
  onContentConfirm,
  onSplitConfirm,
  onClipUpdateText,
} = useTimelineClipInspector({
  t,
  tracks,
  clips,
  selection,
  lastAssignedSpeaker,
  applySpeakerToClips,
  setDefaultSpeaker,
  setClipText,
  splitClip,
  removeClips,
  setClipsMuted,
  setEditMode,
  lanesViewportRef,
  pxPerSec,
  scrollXPx,
  scrollYPx,
  editMode,
  isDragging,
  isResizing,
  isMarqueeActive,
});

const { deleteMarqueeStyle, dangerClipIds, startDelete, cancelDelete } =
  useTimelineClipDelete({
    tracks,
    clipsForTrack,
    viewport,
    lanesViewportRef,
    edgeScroll,
    requestRemoveClips,
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
  viewport,
  lanesViewportRef,
  onSplitRequest,
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

const { previewOffsetY, isReorderDragging, onReorderStart, onReorderEnd } =
  useTimelineTrackReorder({
    tracks,
    trackHeightPx,
  });

const {
  onLanesBackgroundDown,
  onClipDown,
  onClipResizeDown,
  onClipDblclick,
  onLanesMove,
  onLanesUp,
} = useTimelineLaneInteractions({
  editMode,
  stickyEditMode,
  pushOverlay,
  popOverlay,
  selection,
  startMarquee,
  startAdd,
  startDelete,
  onClipPointerDown,
  onClipResizePointerDown,
  splitAtPointer,
  rememberPointerSplitTime,
  onSplitPointerMove,
  onLanesPointerDown,
  onLanesPointerMove,
  onLanesPointerUp,
  onGesturePointerDown,
  onGesturePointerMove,
  onGesturePointerUp,
  endClipDrag,
  endClipResize,
  endMarquee,
  cancelAdd,
  cancelDelete,
  clearSplitPreview,
});

const { copySelection, cutSelection, pasteAtPlayhead } = useTimelineClipboard({
  tracks,
  clips,
  selection,
  pxPerSec,
  insertClips,
  removeClips,
  setEditMode,
});

useTimelineHotkeys({
  editMode,
  setEditMode,
  pushOverlay,
  popOverlay,
  clearOverlays,
  copySelection,
  cutSelection,
  pasteAtPlayhead,
  deleteSelection,
});

const playheadLeftPx = computed(() =>
  localXAtTime(timelinePlayback.currentTimeSec.value),
);

onUnmounted(() => {
  onReorderEnd();
  edgeScroll.stop();
  clearOverlays();
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
    <div class="flex min-h-0 min-w-0 flex-1">
      <TimelineTrackList
        :tracks="tracks"
        :track-height-px="trackHeightPx"
        :scroll-y-px="scrollYPx"
        :edit-mode="editMode"
        :last-assigned-speaker="lastAssignedSpeaker"
        :is-track-dimmed="isTrackDimmed"
        :preview-offset-y="previewOffsetY"
        :is-reorder-dragging="isReorderDragging"
        @update:edit-mode="setEditMode"
        @open-default-speaker="openDefaultSpeakerDialog"
        @toggle-mute="toggleMute"
        @toggle-solo="toggleSolo"
        @reorder-start="onReorderStart"
        @update-volume="setVolume"
        @update-pan="setPan"
        @update-engine="setEngine"
        @add-track="addTrack"
      />

      <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          class="flex shrink-0"
          :style="{ height: `${TIMELINE_SCROLLBAR_SIZE_PX}px` }"
        >
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
            @contextmenu.prevent
          >
            <TimelineLanesBoard
              :tracks="tracks"
              :track-height-px="trackHeightPx"
              :px-per-sec="pxPerSec"
              :scroll-x-px="scrollXPx"
              :scroll-y-px="scrollYPx"
              :content-width-px="contentWidthPx"
              :content-duration-sec="contentDurationSec"
              :viewport-height-px="viewportHeightPx"
              :clips-for-track="clipsForTrack"
              :selected-clip-ids="selectedClipIdSet"
              :highlighted-clip-ids="highlightedClipIds"
              :is-track-dimmed="isTrackDimmed"
              :preview-offset-y="previewOffsetY"
              :is-reorder-dragging="isReorderDragging"
              :edit-mode="editMode"
              :clip-aria-label="clipAriaLabel"
              :add-preview-style="addPreviewStyle"
              :add-preview-invalid="addPreviewInvalid"
              :split-preview-style="splitPreviewStyle"
              :marquee-style="marqueeStyle"
              :delete-marquee-style="deleteMarqueeStyle"
              :playhead-left-px="playheadLeftPx"
              :show-clip-toolbar="showClipToolbar"
              :selected-clips="selectedClips"
              :can-toolbar-split="canToolbarSplit"
              @clip-pointer-down="onClipDown"
              @clip-resize-pointer-down="onClipResizeDown"
              @clip-dblclick="onClipDblclick"
              @clip-update-text="onClipUpdateText"
              @voice="openClipVoiceDialog"
              @content="contentDialogShow = true"
              @split="onToolbarSplit"
              @color="setClipsColor(selection.selectedClipIds.value, $event)"
              @volume="setClipsVolume(selection.selectedClipIds.value, $event)"
              @pan="setClipsPan(selection.selectedClipIds.value, $event)"
              @mute="onToolbarMute"
              @copy="copySelection"
              @cut="cutSelection"
              @delete="deleteSelection"
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

    <TimelineClipDialogs
      :voice-show="voiceDialogShow"
      :voice-engine="voiceEngine"
      :voice-speaker="voiceSpeaker"
      :voice-title="voiceDialogTitle"
      :content-show="contentDialogShow"
      :content-text="firstSelectedClip?.text ?? ''"
      :split-show="splitDialogShow"
      :split-text="splitDialogText"
      :split-initial-index="splitDialogInitialIndex"
      @update:voice-show="voiceDialogShow = $event"
      @update:content-show="contentDialogShow = $event"
      @update:split-show="splitDialogShow = $event"
      @voice-confirm="onVoiceConfirm"
      @content-confirm="onContentConfirm"
      @split-confirm="onSplitConfirm"
    />
  </div>
</template>
