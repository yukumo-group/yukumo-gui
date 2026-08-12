import { ref } from 'vue';
import { useTimelinePlayback } from './useTimelinePlayback';
import {
  TIMELINE_DURATION_PAD_SEC,
  TIMELINE_MIN_DURATION_SEC,
} from '../types/timeline';

/** Scrollable project length (can shrink, but never below the visible window). */
export const timelineContentDurationSec = ref(TIMELINE_MIN_DURATION_SEC);
/**
 * Furthest meaningful content (clips / playhead). Shrinks when content moves
 * earlier — drives min-zoom "fit project", not empty scroll room.
 */
export const timelineContentBoundSec = ref(0);
/** End of last clip — playback loops here when > 0. */
export const timelineLoopEndSec = ref(0);

export const timelinePlayback = useTimelinePlayback({
  getDurationSec: () => timelineContentDurationSec.value,
  getLoopEndSec: () => timelineLoopEndSec.value,
});

/** Snap playhead seek/scrub to ruler segment ticks. */
export const snapPlayheadEnabled = ref(true);
/** Snap clip moves to ruler segment ticks. */
export const snapClipsEnabled = ref(true);

export function setTimelineContentBound(sec: number): void {
  timelineContentBoundSec.value = Math.max(0, sec);
}

/**
 * Set scrollable length to max(min project, content+pad, visible end).
 * Safe to call while dragging: never shrinks below the current view, so scroll
 * clamping cannot fight the pointer.
 */
export function reconcileTimelineDuration(viewEndSec = 0): void {
  const next = Math.max(
    TIMELINE_MIN_DURATION_SEC,
    timelineContentBoundSec.value + TIMELINE_DURATION_PAD_SEC,
    viewEndSec,
  );
  if (next !== timelineContentDurationSec.value) {
    timelineContentDurationSec.value = next;
  }
}

/** Expand (or hold) length so `sec` stays inside the scrollable range. */
export function ensureTimelineDuration(sec: number): void {
  reconcileTimelineDuration(sec);
}

export function setTimelineLoopEnd(sec: number): void {
  timelineLoopEndSec.value = Math.max(0, sec);
}

export function toggleSnapPlayhead(): void {
  snapPlayheadEnabled.value = !snapPlayheadEnabled.value;
}

export function toggleSnapClips(): void {
  snapClipsEnabled.value = !snapClipsEnabled.value;
}
