<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from '@lucide/vue';
import { Dialog } from '@varlet/ui';
import { snapTimeToRuler } from '../../composables/timelineGrid';
import {
  snapClipsEnabled,
  timelinePlayback,
  reconcileTimelineDuration,
} from '../../composables/timelineSession';
import { clientToContentPoint, timeAtContentX } from '../../composables/timeline/timelinePointer';
import { useTimelineViewport } from '../../composables/useTimelineViewport';
import { useTimelineClipAdd } from '../../composables/timeline/useTimelineClipAdd';
import { useTimelineClipDelete } from '../../composables/timeline/useTimelineClipDelete';
import { useTimelineClipDrag } from '../../composables/timeline/useTimelineClipDrag';
import { useTimelineClipResize, type ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';
import { useTimelineClipSplit } from '../../composables/timeline/useTimelineClipSplit';
import { useTimelineDocument } from '../../composables/timeline/useTimelineDocument';
import { useTimelineEdgeScroll } from '../../composables/timeline/useTimelineEdgeScroll';
import { useTimelineClipboard } from '../../composables/timeline/useTimelineClipboard';
import { useTimelineEditMode } from '../../composables/timeline/useTimelineEditMode';
import { useTimelineHotkeys } from '../../composables/timeline/useTimelineHotkeys';
import { useTimelineGestures } from '../../composables/timeline/useTimelineGestures';
import { useTimelineMarquee } from '../../composables/timeline/useTimelineMarquee';
import { useTimelineRulerScrub } from '../../composables/timeline/useTimelineRulerScrub';
import { useTimelineSelection } from '../../composables/timeline/useTimelineSelection';
import { useTimelineTrackReorder } from '../../composables/timeline/useTimelineTrackReorder';
import { cloneSpeaker } from '../../composables/timeline/clipModel';
import type { AquesTalkVersion } from '../../types/profile';
import type { TimelineClipSpeaker } from '../../types/timeline';
import {
  TIMELINE_BOTTOM_PAD_PX,
  TIMELINE_CLIP_MIN_DURATION_SEC,
  TIMELINE_HEADER_WIDTH_PX,
  TIMELINE_RULER_HEIGHT_PX,
  TIMELINE_SCROLLBAR_SIZE_PX,
} from '../../types/timeline';
import TimelineClipContentDialog from './TimelineClipContentDialog.vue';
import TimelineClipSplitDialog from './TimelineClipSplitDialog.vue';
import TimelineClipToolbar from './TimelineClipToolbar.vue';
import TimelineClipVoiceDialog from './TimelineClipVoiceDialog.vue';
import TimelineDefaultSpeakerButton from './TimelineDefaultSpeakerButton.vue';
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
const { editMode, stickyEditMode, setEditMode, pushOverlay, popOverlay, clearOverlays } =
  useTimelineEditMode();

let rmbDeleteOverlay = false;

function endRmbDeleteOverlay(e: PointerEvent): void {
  if (!rmbDeleteOverlay) return;
  if (e.type !== 'pointercancel' && e.button !== 2) return;
  rmbDeleteOverlay = false;
  popOverlay('delete');
  window.removeEventListener('pointerup', endRmbDeleteOverlay);
  window.removeEventListener('pointercancel', endRmbDeleteOverlay);
}

function armRmbDeleteOverlay(): void {
  if (rmbDeleteOverlay) return;
  rmbDeleteOverlay = true;
  window.addEventListener('pointerup', endRmbDeleteOverlay);
  window.addEventListener('pointercancel', endRmbDeleteOverlay);
}

function syncHeldModifierOverlays(e: PointerEvent): void {
  if (e.ctrlKey) pushOverlay('add');
  if (e.altKey) pushOverlay('split');
}

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

const { deleteMarqueeStyle, dangerClipIds, startDelete, cancelDelete } =
  useTimelineClipDelete({
    tracks,
    clipsForTrack,
    viewport,
    lanesViewportRef,
    edgeScroll,
    requestRemoveClips,
  });

const splitDraft = ref<{ clipId: string; atSec: number } | null>(null);
const lastPointerTimeSec = ref<number | null>(null);

function pointerTimeAtClient(clientX: number): number | null {
  const el = lanesViewportRef.value;
  if (!el) return null;
  const point = clientToContentPoint(
    el,
    clientX,
    0,
    scrollXPx.value,
    scrollYPx.value,
  );
  const raw = timeAtContentX(point.contentX, pxPerSec.value);
  return snapClipsEnabled.value
    ? snapTimeToRuler(raw, pxPerSec.value)
    : raw;
}

function rememberPointerSplitTime(clientX: number): void {
  const timeSec = pointerTimeAtClient(clientX);
  if (timeSec === null) return;
  const ids = selection.selectedClipIdSet.value;
  if (ids.size !== 1) return;
  const clip = clips.value.find((item) => ids.has(item.id));
  if (!clip) return;
  if (timeSec <= clip.startSec || timeSec >= clip.startSec + clip.durationSec) {
    return;
  }
  lastPointerTimeSec.value = timeSec;
}

function onSplitRequest(clipId: string, timeSec: number): void {
  const clip = clips.value.find((item) => item.id === clipId);
  if (!clip || clip.text.length <= 1) return;
  splitDraft.value = { clipId, atSec: timeSec };
}

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
  syncHeldModifierOverlays(e);
  if (e.button === 2 && e.pointerType !== 'touch') {
    e.preventDefault();
    pushOverlay('delete');
    startDelete(e);
    armRmbDeleteOverlay();
    return;
  }
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
  syncHeldModifierOverlays(e);
  if (e.button === 2) {
    e.preventDefault();
    pushOverlay('delete');
    startDelete(e, clipId);
    armRmbDeleteOverlay();
    return;
  }
  switch (editMode.value) {
    case 'select':
      onClipPointerDown(clipId, e);
      rememberPointerSplitTime(e.clientX);
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

function onClipDblclick(clipId: string): void {
  endClipDrag();
  selection.setSelection([clipId]);
}

function onClipUpdateText(clipId: string, text: string): void {
  setClipText(clipId, text);
}

function onLanesMove(e: PointerEvent): void {
  onLanesPointerMove(e);
  onGesturePointerMove(e);
  rememberPointerSplitTime(e.clientX);
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

watch(
  editMode,
  () => {
    cancelToolGestures();
  },
  { flush: 'sync' },
);

watch(
  stickyEditMode,
  (mode) => {
    if (mode !== 'select') {
      selection.clearSelection();
    }
  },
  { flush: 'sync' },
);

const { copySelection, cutSelection, pasteAtPlayhead } = useTimelineClipboard({
  tracks,
  clips,
  selection,
  pxPerSec,
  insertClips,
  removeClips,
  setEditMode,
});

const selectedClips = computed(() => {
  const ids = selection.selectedClipIdSet.value;
  return clips.value.filter((clip) => ids.has(clip.id));
});

const firstSelectedClip = computed(() => selectedClips.value[0] ?? null);

const voiceDialogTarget = ref<'clips' | 'default'>('clips');

const voiceEngine = computed<AquesTalkVersion>(() => {
  if (voiceDialogTarget.value === 'default') {
    return tracks.value[0]?.engine ?? 2;
  }
  const clip = firstSelectedClip.value;
  if (!clip) return tracks.value[0]?.engine ?? 2;
  return tracks.value.find((track) => track.id === clip.trackId)?.engine ?? 2;
});

const voiceSpeaker = computed<TimelineClipSpeaker>(() => {
  if (voiceDialogTarget.value === 'default') {
    return cloneSpeaker(lastAssignedSpeaker.value);
  }
  return firstSelectedClip.value
    ? cloneSpeaker(firstSelectedClip.value.speaker)
    : cloneSpeaker(lastAssignedSpeaker.value);
});

function isValidTimeSplit(
  startSec: number,
  durationSec: number,
  atSec: number,
): boolean {
  const left = atSec - startSec;
  const right = startSec + durationSec - atSec;
  return (
    left >= TIMELINE_CLIP_MIN_DURATION_SEC &&
    right >= TIMELINE_CLIP_MIN_DURATION_SEC
  );
}

watch(selection.selectedClipIds, () => {
  lastPointerTimeSec.value = null;
});

const canToolbarSplit = computed(() => {
  if (selectedClips.value.length !== 1) return false;
  const clip = firstSelectedClip.value;
  const at = lastPointerTimeSec.value;
  if (!clip || at === null || clip.text.length <= 1) return false;
  return isValidTimeSplit(clip.startSec, clip.durationSec, at);
});

const showClipToolbar = computed(
  () =>
    editMode.value === 'select' &&
    selectedClips.value.length > 0 &&
    !isDragging.value &&
    !isResizing.value &&
    !isMarqueeActive.value,
);

const voiceDialogShow = ref(false);
const contentDialogShow = ref(false);

const voiceDialogTitle = computed(() =>
  voiceDialogTarget.value === 'default'
    ? t('pages.generate.timeline.defaultSpeakerDialogTitle')
    : t('pages.generate.timeline.voiceDialogTitle'),
);

function openDefaultSpeakerDialog(): void {
  voiceDialogTarget.value = 'default';
  voiceDialogShow.value = true;
}

function openClipVoiceDialog(): void {
  voiceDialogTarget.value = 'clips';
  voiceDialogShow.value = true;
}

function splitIndexFromTime(clip: {
  startSec: number;
  durationSec: number;
  text: string;
}, atSec: number): number {
  if (clip.text.length <= 1) return 1;
  const ratio = (atSec - clip.startSec) / clip.durationSec;
  return Math.min(
    clip.text.length - 1,
    Math.max(1, Math.round(ratio * clip.text.length)),
  );
}

const splitDialogShow = computed({
  get: () => splitDraft.value !== null,
  set: (value: boolean) => {
    if (!value) splitDraft.value = null;
  },
});

const splitDialogClip = computed(() => {
  const draft = splitDraft.value;
  if (!draft) return null;
  return clips.value.find((clip) => clip.id === draft.clipId) ?? null;
});

const splitDialogText = computed(() => splitDialogClip.value?.text ?? '');

const splitDialogInitialIndex = computed(() => {
  const draft = splitDraft.value;
  const clip = splitDialogClip.value;
  if (!draft || !clip) return 1;
  return splitIndexFromTime(clip, draft.atSec);
});

let deleteConfirmPending = false;

async function requestRemoveClips(ids: readonly string[]): Promise<void> {
  if (ids.length === 0 || deleteConfirmPending) return;
  deleteConfirmPending = true;
  try {
    const result = await Dialog({
      title: t('pages.generate.timeline.deleteConfirmTitle'),
      message: t('pages.generate.timeline.deleteConfirmMessage', {
        n: ids.length,
      }),
      confirmButtonText: t('pages.generate.timeline.deleteConfirm'),
      cancelButtonText: t('pages.generate.timeline.deleteCancel'),
      confirmButtonProps: { type: 'danger' },
    });
    if (result !== 'confirm') return;
    const idSet = new Set(ids);
    removeClips(ids);
    selection.setSelection(
      selection.selectedClipIds.value.filter((id) => !idSet.has(id)),
    );
  } finally {
    deleteConfirmPending = false;
  }
}

function deleteSelection(): boolean {
  const ids = selection.selectedClipIds.value;
  if (ids.length === 0) return false;
  void requestRemoveClips(ids);
  return true;
}

function onToolbarSplit(): void {
  const clip = firstSelectedClip.value;
  const at = lastPointerTimeSec.value;
  if (!clip || at === null || !canToolbarSplit.value) return;
  onSplitRequest(clip.id, at);
}

function onToolbarMute(): void {
  const ids = selection.selectedClipIds.value;
  const allMuted =
    selectedClips.value.length > 0 &&
    selectedClips.value.every((clip) => clip.muted);
  setClipsMuted(ids, !allMuted);
}

function onVoiceConfirm(speaker: TimelineClipSpeaker): void {
  if (voiceDialogTarget.value === 'default') {
    setDefaultSpeaker(speaker);
    return;
  }
  applySpeakerToClips(selection.selectedClipIds.value, speaker);
}

function onContentConfirm(text: string): void {
  const clip = firstSelectedClip.value;
  if (!clip) return;
  setClipText(clip.id, text);
}

function onSplitConfirm(index: number): void {
  const draft = splitDraft.value;
  if (!draft) return;
  const right = splitClip(draft.clipId, draft.atSec, index);
  if (right) {
    selection.setSelection([draft.clipId, right.id]);
    setEditMode('select');
  }
}

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
  cancelToolGestures();
  edgeScroll.stop();
  clearOverlays();
  if (rmbDeleteOverlay) {
    rmbDeleteOverlay = false;
    window.removeEventListener('pointerup', endRmbDeleteOverlay);
    window.removeEventListener('pointercancel', endRmbDeleteOverlay);
  }
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
            v-model="editMode"
            class="min-w-0 flex-1"
          />
          <TimelineDefaultSpeakerButton
            :speaker="lastAssignedSpeaker"
            @click="openDefaultSpeakerDialog"
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
              @toggle-mute="toggleMute(track.id)"
              @toggle-solo="toggleSolo(track.id)"
              @reorder-start="onReorderStart(track.id, $event)"
              @update-volume="setVolume(track.id, $event)"
              @update-pan="setPan(track.id, $event)"
              @update-engine="setEngine(track.id, $event)"
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
                @clip-dblclick="onClipDblclick"
                @clip-update-text="onClipUpdateText"
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

            <div
              v-if="showClipToolbar"
              class="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3"
            >
              <TimelineClipToolbar
                :clips="selectedClips"
                :can-split="canToolbarSplit"
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

    <TimelineClipVoiceDialog
      v-model:show="voiceDialogShow"
      :version="voiceEngine"
      :speaker="voiceSpeaker"
      :title="voiceDialogTitle"
      @confirm="onVoiceConfirm"
    />
    <TimelineClipContentDialog
      v-model:show="contentDialogShow"
      :text="firstSelectedClip?.text ?? ''"
      @confirm="onContentConfirm"
    />
    <TimelineClipSplitDialog
      v-model:show="splitDialogShow"
      :text="splitDialogText"
      :initial-index="splitDialogInitialIndex"
      @confirm="onSplitConfirm"
    />
  </div>
</template>
