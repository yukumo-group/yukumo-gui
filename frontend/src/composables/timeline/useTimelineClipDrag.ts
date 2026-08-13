import { computed, ref, type Ref } from 'vue';
import { snapClipsEnabled } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineViewport } from '../useTimelineViewport';
import type { TimelineClip, TimelineTrack } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';

interface ClipDragOrigin {
  startSec: number;
  trackIndex: number;
  durationSec: number;
}

interface ClipPlacement {
  startSec: number;
  trackIndex: number;
}

interface ClipDragState {
  primaryId: string;
  ids: string[];
  origins: Map<string, ClipDragOrigin>;
  grabClientX: number;
  grabClientY: number;
  originScrollX: number;
  originScrollY: number;
  lastClientX: number;
  lastClientY: number;
  lastValid: Map<string, ClipPlacement>;
  placementInvalid: boolean;
}

function rangesOverlap(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number,
): boolean {
  return aStart < bStart + bDuration && bStart < aStart + aDuration;
}

function placementsOverlap(
  proposed: Map<string, ClipPlacement & { durationSec: number }>,
  allClips: TimelineClip[],
  tracks: TimelineTrack[],
): boolean {
  const movingIds = new Set(proposed.keys());
  const trackIdAt = (index: number) => tracks[index]?.id;

  for (const [, p] of proposed) {
    const trackId = trackIdAt(p.trackIndex);
    if (!trackId) return true;
    for (const other of allClips) {
      if (movingIds.has(other.id)) continue;
      if (other.trackId !== trackId) continue;
      if (
        rangesOverlap(
          p.startSec,
          p.durationSec,
          other.startSec,
          other.durationSec,
        )
      ) {
        return true;
      }
    }
  }

  const list = [...proposed.values()];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = list[i]!;
      const b = list[j]!;
      if (a.trackIndex !== b.trackIndex) continue;
      if (
        rangesOverlap(a.startSec, a.durationSec, b.startSec, b.durationSec)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function useTimelineClipDrag(options: {
  clips: Ref<TimelineClip[]>;
  tracks: Ref<TimelineTrack[]>;
  selection: TimelineSelection;
  viewport: Pick<
    TimelineViewport,
    'pxPerSec' | 'trackHeightPx' | 'scrollXPx' | 'scrollYPx'
  >;
  edgeScroll: TimelineEdgeScroll;
  applyClipPlacements: (
    next: Map<string, { startSec: number; trackId: string }>,
    pxPerSec: number,
    snap: boolean,
  ) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const clipDrag = ref<ClipDragState | null>(null);

  const blockedClipIds = computed(() => {
    const d = clipDrag.value;
    if (!d?.placementInvalid) return new Set<string>();
    return new Set(d.ids);
  });

  function commitPlacements(placements: Map<string, ClipPlacement>): void {
    const { pxPerSec } = options.viewport;
    const tracks = options.tracks.value;
    const next = new Map<string, { startSec: number; trackId: string }>();
    for (const [id, p] of placements) {
      const trackId = tracks[p.trackIndex]?.id;
      if (!trackId) continue;
      next.set(id, { startSec: p.startSec, trackId });
    }
    options.applyClipPlacements(next, pxPerSec.value, false);
  }

  function applyFromPointer(): void {
    const d = clipDrag.value;
    if (!d) return;

    const { pxPerSec, trackHeightPx, scrollXPx, scrollYPx } = options.viewport;
    const tracks = options.tracks.value;
    const trackCount = tracks.length;
    if (trackCount === 0) return;

    const dx =
      d.lastClientX - d.grabClientX + (scrollXPx.value - d.originScrollX);
    const dy =
      d.lastClientY - d.grabClientY + (scrollYPx.value - d.originScrollY);

    const rawDeltaSec = dx / pxPerSec.value;
    const primaryOrigin = d.origins.get(d.primaryId);
    if (!primaryOrigin) return;

    const rawPrimary = primaryOrigin.startSec + rawDeltaSec;
    const snappedPrimary = snapClipsEnabled.value
      ? snapTimeToRuler(rawPrimary, pxPerSec.value)
      : Math.max(0, rawPrimary);
    let deltaSec = snappedPrimary - primaryOrigin.startSec;

    let minOriginStart = Infinity;
    let minOriginTrack = Infinity;
    let maxOriginTrack = -Infinity;
    for (const id of d.ids) {
      const origin = d.origins.get(id);
      if (!origin) continue;
      minOriginStart = Math.min(minOriginStart, origin.startSec);
      minOriginTrack = Math.min(minOriginTrack, origin.trackIndex);
      maxOriginTrack = Math.max(maxOriginTrack, origin.trackIndex);
    }
    if (minOriginStart + deltaSec < 0) {
      deltaSec = -minOriginStart;
    }

    const h = Math.max(1, trackHeightPx.value);
    let trackDelta = Math.round(dy / h);
    if (minOriginTrack + trackDelta < 0) {
      trackDelta = -minOriginTrack;
    }
    if (maxOriginTrack + trackDelta > trackCount - 1) {
      trackDelta = trackCount - 1 - maxOriginTrack;
    }

    const proposed = new Map<
      string,
      ClipPlacement & { durationSec: number }
    >();
    for (const id of d.ids) {
      const origin = d.origins.get(id);
      if (!origin) continue;
      proposed.set(id, {
        startSec: origin.startSec + deltaSec,
        trackIndex: origin.trackIndex + trackDelta,
        durationSec: origin.durationSec,
      });
    }

    const invalid = placementsOverlap(proposed, options.clips.value, tracks);
    d.placementInvalid = invalid;

    const placements = new Map<string, ClipPlacement>();
    for (const [id, p] of proposed) {
      placements.set(id, {
        startSec: p.startSec,
        trackIndex: p.trackIndex,
      });
    }
    commitPlacements(placements);

    if (!invalid) {
      d.lastValid = new Map(placements);
    }
  }

  function onClipDragMove(e: PointerEvent): void {
    const d = clipDrag.value;
    if (!d) return;
    d.lastClientX = e.clientX;
    d.lastClientY = e.clientY;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
    applyFromPointer();
  }

  function endClipDrag(): void {
    const d = clipDrag.value;
    const wasDragging = d !== null;
    if (d?.placementInvalid) {
      commitPlacements(d.lastValid);
    }
    clipDrag.value = null;
    options.edgeScroll.stop();
    window.removeEventListener('pointermove', onClipDragMove);
    window.removeEventListener('pointerup', endClipDrag);
    window.removeEventListener('pointercancel', endClipDrag);
    if (wasDragging) {
      options.onDragEnd?.();
    }
  }

  function onClipPointerDown(clipId: string, e: PointerEvent): void {
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

    const trackIndexById = new Map(
      options.tracks.value.map((track, index) => [track.id, index]),
    );

    const origins = new Map<string, ClipDragOrigin>();
    const lastValid = new Map<string, ClipPlacement>();
    for (const id of ids) {
      const clip = options.clips.value.find((c) => c.id === id);
      if (!clip) continue;
      const trackIndex = trackIndexById.get(clip.trackId);
      if (trackIndex === undefined) continue;
      origins.set(id, {
        startSec: clip.startSec,
        trackIndex,
        durationSec: clip.durationSec,
      });
      lastValid.set(id, { startSec: clip.startSec, trackIndex });
    }

    if (!origins.has(clipId)) return;

    clipDrag.value = {
      primaryId: clipId,
      ids: [...origins.keys()],
      origins,
      grabClientX: e.clientX,
      grabClientY: e.clientY,
      originScrollX: options.viewport.scrollXPx.value,
      originScrollY: options.viewport.scrollYPx.value,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      lastValid,
      placementInvalid: false,
    };

    options.onDragStart?.();

    window.addEventListener('pointermove', onClipDragMove);
    window.addEventListener('pointerup', endClipDrag);
    window.addEventListener('pointercancel', endClipDrag);

    options.edgeScroll.start(
      options.edgeScroll.lanesEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        applyFromPointer();
      },
    );
  }

  const isDragging = computed(() => clipDrag.value !== null);

  return {
    onClipPointerDown,
    endClipDrag,
    blockedClipIds,
    isDragging,
  };
}
