import { computed, ref, type Ref } from 'vue';
import { snapClipsEnabled } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineViewport } from '../useTimelineViewport';
import {
  TIMELINE_CLIP_MIN_DURATION_SEC,
  type TimelineClip,
} from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';

export type ClipResizeEdge = 'left' | 'right';

interface ClipResizeOrigin {
  startSec: number;
  durationSec: number;
  trackId: string;
}

interface ClipResizeState {
  edge: ClipResizeEdge;
  primaryId: string;
  ids: string[];
  origins: Map<string, ClipResizeOrigin>;
  grabClientX: number;
  originScrollX: number;
  lastClientX: number;
}

function findPrevEndSec(
  trackId: string,
  originStart: number,
  resizingIds: ReadonlySet<string>,
  origins: Map<string, ClipResizeOrigin>,
  allClips: TimelineClip[],
): number {
  let prevEnd = 0;
  for (const other of allClips) {
    if (resizingIds.has(other.id)) continue;
    if (other.trackId !== trackId) continue;
    const end = other.startSec + other.durationSec;
    if (end <= originStart + 1e-9) {
      prevEnd = Math.max(prevEnd, end);
    }
  }
  for (const [, origin] of origins) {
    if (origin.trackId !== trackId) continue;
    const end = origin.startSec + origin.durationSec;
    if (end <= originStart + 1e-9) {
      prevEnd = Math.max(prevEnd, end);
    }
  }
  return prevEnd;
}

function findNextStartSec(
  trackId: string,
  originEnd: number,
  resizingIds: ReadonlySet<string>,
  origins: Map<string, ClipResizeOrigin>,
  allClips: TimelineClip[],
): number {
  let nextStart = Number.POSITIVE_INFINITY;
  for (const other of allClips) {
    if (resizingIds.has(other.id)) continue;
    if (other.trackId !== trackId) continue;
    if (other.startSec >= originEnd - 1e-9) {
      nextStart = Math.min(nextStart, other.startSec);
    }
  }
  for (const [, origin] of origins) {
    if (origin.trackId !== trackId) continue;
    if (origin.startSec >= originEnd - 1e-9) {
      nextStart = Math.min(nextStart, origin.startSec);
    }
  }
  return nextStart;
}

function clampDeltaForEdge(
  edge: ClipResizeEdge,
  rawDeltaSec: number,
  origins: Map<string, ClipResizeOrigin>,
  allClips: TimelineClip[],
  minDurationSec: number,
): number {
  const resizingIds = new Set(origins.keys());
  let delta = rawDeltaSec;

  for (const [, origin] of origins) {
    const originEnd = origin.startSec + origin.durationSec;
    if (edge === 'right') {
      const nextStart = findNextStartSec(
        origin.trackId,
        originEnd,
        resizingIds,
        origins,
        allClips,
      );
      const minEnd = origin.startSec + minDurationSec;
      const maxEnd = nextStart;
      const minDelta = minEnd - originEnd;
      const maxDelta = maxEnd - originEnd;
      delta = Math.min(delta, maxDelta);
      delta = Math.max(delta, minDelta);
    } else {
      const prevEnd = findPrevEndSec(
        origin.trackId,
        origin.startSec,
        resizingIds,
        origins,
        allClips,
      );
      const minStart = Math.max(0, prevEnd);
      const maxStart = originEnd - minDurationSec;
      const minDelta = minStart - origin.startSec;
      const maxDelta = maxStart - origin.startSec;
      delta = Math.min(delta, maxDelta);
      delta = Math.max(delta, minDelta);
    }
  }

  return delta;
}

export function useTimelineClipResize(options: {
  clips: Ref<TimelineClip[]>;
  selection: TimelineSelection;
  viewport: Pick<TimelineViewport, 'pxPerSec' | 'scrollXPx'>;
  edgeScroll: TimelineEdgeScroll;
  applyClipRanges: (
    next: Map<string, { startSec: number; durationSec: number }>,
    pxPerSec: number,
    snap: boolean,
  ) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}) {
  const clipResize = ref<ClipResizeState | null>(null);

  function applyFromPointer(): void {
    const d = clipResize.value;
    if (!d) return;

    const { pxPerSec, scrollXPx } = options.viewport;
    const primaryOrigin = d.origins.get(d.primaryId);
    if (!primaryOrigin) return;

    const dx =
      d.lastClientX - d.grabClientX + (scrollXPx.value - d.originScrollX);
    let rawDeltaSec = dx / pxPerSec.value;

    if (snapClipsEnabled.value) {
      if (d.edge === 'right') {
        const rawEnd =
          primaryOrigin.startSec + primaryOrigin.durationSec + rawDeltaSec;
        const snappedEnd = snapTimeToRuler(rawEnd, pxPerSec.value);
        rawDeltaSec =
          snappedEnd - (primaryOrigin.startSec + primaryOrigin.durationSec);
      } else {
        const rawStart = primaryOrigin.startSec + rawDeltaSec;
        const snappedStart = snapTimeToRuler(rawStart, pxPerSec.value);
        rawDeltaSec = snappedStart - primaryOrigin.startSec;
      }
    }

    const deltaSec = clampDeltaForEdge(
      d.edge,
      rawDeltaSec,
      d.origins,
      options.clips.value,
      TIMELINE_CLIP_MIN_DURATION_SEC,
    );

    const next = new Map<string, { startSec: number; durationSec: number }>();
    for (const [id, origin] of d.origins) {
      if (d.edge === 'right') {
        next.set(id, {
          startSec: origin.startSec,
          durationSec: Math.max(
            TIMELINE_CLIP_MIN_DURATION_SEC,
            origin.durationSec + deltaSec,
          ),
        });
      } else {
        const startSec = origin.startSec + deltaSec;
        next.set(id, {
          startSec,
          durationSec: Math.max(
            TIMELINE_CLIP_MIN_DURATION_SEC,
            origin.durationSec - deltaSec,
          ),
        });
      }
    }

    options.applyClipRanges(next, pxPerSec.value, false);
  }

  function onClipResizeMove(e: PointerEvent): void {
    const d = clipResize.value;
    if (!d) return;
    d.lastClientX = e.clientX;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
    applyFromPointer();
  }

  function endClipResize(): void {
    const wasResizing = clipResize.value !== null;
    clipResize.value = null;
    options.edgeScroll.stop();
    window.removeEventListener('pointermove', onClipResizeMove);
    window.removeEventListener('pointerup', endClipResize);
    window.removeEventListener('pointercancel', endClipResize);
    if (wasResizing) {
      options.onResizeEnd?.();
    }
  }

  function onClipResizePointerDown(
    clipId: string,
    edge: ClipResizeEdge,
    e: PointerEvent,
  ): void {
    if (e.button !== 0) return;
    const {
      selectedClipIds,
      selectedClipIdSet,
      setSelection,
      addClipToSelection,
      toggleClipInSelection,
    } = options.selection;

    if (e.shiftKey) {
      addClipToSelection(clipId);
    } else if (e.ctrlKey || e.metaKey) {
      toggleClipInSelection(clipId);
      return;
    } else if (!selectedClipIdSet.value.has(clipId)) {
      setSelection([clipId]);
    }

    const ids = selectedClipIdSet.value.has(clipId)
      ? [...selectedClipIds.value]
      : [clipId];
    if (!ids.includes(clipId)) {
      ids.push(clipId);
    }

    const origins = new Map<string, ClipResizeOrigin>();
    for (const id of ids) {
      const clip = options.clips.value.find((c) => c.id === id);
      if (!clip) continue;
      origins.set(id, {
        startSec: clip.startSec,
        durationSec: clip.durationSec,
        trackId: clip.trackId,
      });
    }

    if (!origins.has(clipId)) return;

    clipResize.value = {
      edge,
      primaryId: clipId,
      ids: [...origins.keys()],
      origins,
      grabClientX: e.clientX,
      originScrollX: options.viewport.scrollXPx.value,
      lastClientX: e.clientX,
    };

    options.onResizeStart?.();

    window.addEventListener('pointermove', onClipResizeMove);
    window.addEventListener('pointerup', endClipResize);
    window.addEventListener('pointercancel', endClipResize);

    options.edgeScroll.start(
      options.edgeScroll.lanesEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        applyFromPointer();
      },
    );
  }

  const isResizing = computed(() => clipResize.value !== null);

  return {
    onClipResizePointerDown,
    endClipResize,
    isResizing,
  };
}
