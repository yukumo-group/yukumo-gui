import { computed, ref, type Ref } from 'vue';
import { ensureTimelineDuration, snapClipsEnabled } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineViewport } from '../useTimelineViewport';
import {
  TIMELINE_CLIP_MIN_DURATION_SEC,
  type TimelineClip,
  type TimelineTrack,
} from '../../types/timeline';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';
import {
  clientToContentPoint,
  gapAroundTime,
  timeAtContentX,
  trackIndexAtContentY,
} from './timelinePointer';

interface AddDraft {
  trackId: string;
  trackIndex: number;
  originSec: number;
  startSec: number;
  durationSec: number;
  gapStartSec: number;
  gapEndSec: number;
  lastClientX: number;
  lastClientY: number;
}

export function useTimelineClipAdd(options: {
  tracks: Ref<TimelineTrack[]>;
  clips: Ref<TimelineClip[]>;
  viewport: Pick<
    TimelineViewport,
    'pxPerSec' | 'trackHeightPx' | 'scrollXPx' | 'scrollYPx'
  >;
  lanesViewportRef: Ref<HTMLElement | null>;
  edgeScroll: TimelineEdgeScroll;
  addClip: (
    trackId: string,
    startSec: number,
    durationSec: number,
  ) => TimelineClip | null;
  onAddStart?: () => void;
  onAddEnd?: () => void;
}) {
  const draft = ref<AddDraft | null>(null);

  const addPreviewStyle = computed(() => {
    const d = draft.value;
    if (!d) return null;
    const { pxPerSec, trackHeightPx } = options.viewport;
    return {
      left: `${d.startSec * pxPerSec.value}px`,
      width: `${Math.max(1, d.durationSec * pxPerSec.value)}px`,
      top: `${d.trackIndex * trackHeightPx.value + 4}px`,
      height: `${Math.max(0, trackHeightPx.value - 8)}px`,
    };
  });

  const addPreviewInvalid = computed(() => {
    const d = draft.value;
    if (!d) return false;
    return d.durationSec < TIMELINE_CLIP_MIN_DURATION_SEC;
  });

  function resolveTime(clientX: number, clientY: number): number | null {
    const el = options.lanesViewportRef.value;
    if (!el) return null;
    const point = clientToContentPoint(
      el,
      clientX,
      clientY,
      options.viewport.scrollXPx.value,
      options.viewport.scrollYPx.value,
    );
    return timeAtContentX(point.contentX, options.viewport.pxPerSec.value);
  }

  function clampToGap(timeSec: number, d: AddDraft): number {
    return Math.min(d.gapEndSec, Math.max(d.gapStartSec, timeSec));
  }

  function applyFromPointer(): void {
    const d = draft.value;
    if (!d) return;
    const raw = resolveTime(d.lastClientX, d.lastClientY);
    if (raw === null) return;
    const snapped = snapClipsEnabled.value
      ? snapTimeToRuler(raw, options.viewport.pxPerSec.value)
      : raw;
    const a = clampToGap(d.originSec, d);
    const b = clampToGap(snapped, d);
    d.startSec = Math.min(a, b);
    d.durationSec = Math.abs(b - a);
    ensureTimelineDuration(d.startSec + d.durationSec);
  }

  function onAddMove(e: PointerEvent): void {
    const d = draft.value;
    if (!d) return;
    d.lastClientX = e.clientX;
    d.lastClientY = e.clientY;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
    applyFromPointer();
  }

  function finishAdd(commit: boolean): void {
    const d = draft.value;
    const wasAdding = d !== null;
    if (commit && d && d.durationSec >= TIMELINE_CLIP_MIN_DURATION_SEC) {
      options.addClip(d.trackId, d.startSec, d.durationSec);
    }
    draft.value = null;
    options.edgeScroll.stop();
    window.removeEventListener('pointermove', onAddMove);
    window.removeEventListener('pointerup', endAdd);
    window.removeEventListener('pointercancel', endAdd);
    if (wasAdding) {
      options.onAddEnd?.();
    }
  }

  function endAdd(): void {
    finishAdd(true);
  }

  function cancelAdd(): void {
    finishAdd(false);
  }

  function startAdd(e: PointerEvent): void {
    if (e.button !== 0) return;
    const el = options.lanesViewportRef.value;
    if (!el) return;
    const { pxPerSec, trackHeightPx, scrollXPx, scrollYPx } = options.viewport;
    const point = clientToContentPoint(
      el,
      e.clientX,
      e.clientY,
      scrollXPx.value,
      scrollYPx.value,
    );
    const trackIndex = trackIndexAtContentY(
      point.contentY,
      trackHeightPx.value,
      options.tracks.value.length,
    );
    if (trackIndex === null) return;
    const track = options.tracks.value[trackIndex];
    if (!track) return;

    const rawTime = timeAtContentX(point.contentX, pxPerSec.value);
    const gap = gapAroundTime(options.clips.value, track.id, rawTime);
    if (!gap) return;
    if (gap.endSec - gap.startSec < TIMELINE_CLIP_MIN_DURATION_SEC) return;

    const originSec = snapClipsEnabled.value
      ? snapTimeToRuler(rawTime, pxPerSec.value)
      : rawTime;

    draft.value = {
      trackId: track.id,
      trackIndex,
      originSec,
      startSec: originSec,
      durationSec: 0,
      gapStartSec: gap.startSec,
      gapEndSec: gap.endSec,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
    };

    options.onAddStart?.();
    window.addEventListener('pointermove', onAddMove);
    window.addEventListener('pointerup', endAdd);
    window.addEventListener('pointercancel', endAdd);
    options.edgeScroll.start(
      options.edgeScroll.lanesEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        applyFromPointer();
      },
    );
  }

  return {
    addPreviewStyle,
    addPreviewInvalid,
    startAdd,
    endAdd,
    cancelAdd,
  };
}
