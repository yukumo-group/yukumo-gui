import { computed, ref, type Ref } from 'vue';
import { snapClipsEnabled } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineViewport } from '../useTimelineViewport';
import {
  TIMELINE_CLIP_MIN_DURATION_SEC,
  type TimelineClip,
  type TimelineTrack,
} from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import {
  clientToContentPoint,
  clipAtTimeOnTrack,
  timeAtContentX,
  trackIndexAtContentY,
} from './timelinePointer';

interface SplitPreview {
  clipId: string;
  trackIndex: number;
  timeSec: number;
  valid: boolean;
}

export function useTimelineClipSplit(options: {
  tracks: Ref<TimelineTrack[]>;
  clips: Ref<TimelineClip[]>;
  selection: TimelineSelection;
  viewport: Pick<
    TimelineViewport,
    'pxPerSec' | 'trackHeightPx' | 'scrollXPx' | 'scrollYPx'
  >;
  lanesViewportRef: Ref<HTMLElement | null>;
  splitClip: (clipId: string, atSec: number) => TimelineClip | null;
}) {
  const preview = ref<SplitPreview | null>(null);

  const splitPreviewStyle = computed(() => {
    const p = preview.value;
    if (!p) return null;
    const { pxPerSec, trackHeightPx } = options.viewport;
    return {
      left: `${p.timeSec * pxPerSec.value}px`,
      top: `${p.trackIndex * trackHeightPx.value + 4}px`,
      height: `${Math.max(0, trackHeightPx.value - 8)}px`,
      valid: p.valid,
    };
  });

  function hitAtClient(
    clientX: number,
    clientY: number,
  ): {
    clip: TimelineClip;
    trackIndex: number;
    timeSec: number;
  } | null {
    const el = options.lanesViewportRef.value;
    if (!el) return null;
    const { pxPerSec, trackHeightPx, scrollXPx, scrollYPx } = options.viewport;
    const point = clientToContentPoint(
      el,
      clientX,
      clientY,
      scrollXPx.value,
      scrollYPx.value,
    );
    const trackIndex = trackIndexAtContentY(
      point.contentY,
      trackHeightPx.value,
      options.tracks.value.length,
    );
    if (trackIndex === null) return null;
    const track = options.tracks.value[trackIndex];
    if (!track) return null;
    const rawTime = timeAtContentX(point.contentX, pxPerSec.value);
    const clip = clipAtTimeOnTrack(options.clips.value, track.id, rawTime);
    if (!clip) return null;
    const timeSec = snapClipsEnabled.value
      ? snapTimeToRuler(rawTime, pxPerSec.value)
      : rawTime;
    return { clip, trackIndex, timeSec };
  }

  function isValidSplit(clip: TimelineClip, timeSec: number): boolean {
    const left = timeSec - clip.startSec;
    const right = clip.startSec + clip.durationSec - timeSec;
    return (
      left >= TIMELINE_CLIP_MIN_DURATION_SEC &&
      right >= TIMELINE_CLIP_MIN_DURATION_SEC
    );
  }

  function onSplitPointerMove(e: PointerEvent): void {
    const hit = hitAtClient(e.clientX, e.clientY);
    if (!hit) {
      preview.value = null;
      return;
    }
    preview.value = {
      clipId: hit.clip.id,
      trackIndex: hit.trackIndex,
      timeSec: hit.timeSec,
      valid: isValidSplit(hit.clip, hit.timeSec),
    };
  }

  function onSplitPointerLeave(): void {
    preview.value = null;
  }

  function splitAtPointer(clipId: string, e: PointerEvent): void {
    if (e.button !== 0) return;
    const el = options.lanesViewportRef.value;
    if (!el) return;
    const clip = options.clips.value.find((c) => c.id === clipId);
    if (!clip) return;

    const point = clientToContentPoint(
      el,
      e.clientX,
      e.clientY,
      options.viewport.scrollXPx.value,
      options.viewport.scrollYPx.value,
    );
    const rawTime = timeAtContentX(
      point.contentX,
      options.viewport.pxPerSec.value,
    );
    const timeSec = snapClipsEnabled.value
      ? snapTimeToRuler(rawTime, options.viewport.pxPerSec.value)
      : rawTime;
    if (!isValidSplit(clip, timeSec)) return;
    const right = options.splitClip(clipId, timeSec);
    if (!right) return;
    options.selection.setSelection([clipId, right.id]);
    preview.value = null;
  }

  function clearSplitPreview(): void {
    preview.value = null;
  }

  return {
    splitPreviewStyle,
    onSplitPointerMove,
    onSplitPointerLeave,
    splitAtPointer,
    clearSplitPreview,
  };
}
