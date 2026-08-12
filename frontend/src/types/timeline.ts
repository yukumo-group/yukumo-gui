export interface TimelineTrack {
  id: string;
  name: string;
  muted: boolean;
  solo: boolean;
  /** 0–1 */
  volume: number;
  /** -1 (L) … 1 (R) */
  pan: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  startSec: number;
  durationSec: number;
  label: string;
}

export interface TimelineViewportState {
  pxPerSec: number;
  trackHeightPx: number;
  scrollXPx: number;
  scrollYPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  contentDurationSec: number;
  trackCount: number;
}

export const TIMELINE_PX_PER_SEC_MAX = 400;
/** Absolute floor when the project is extremely long (fit-view min can go lower than the old fixed 20). */
export const TIMELINE_PX_PER_SEC_ABS_MIN = 2;
/**
 * How much extra time min-zoom shows vs the content bound.
 * 1 = flush fit; higher = more empty room when zoomed out.
 */
export const TIMELINE_FIT_ZOOM_GRACE = 1.3;
export const TIMELINE_TRACK_HEIGHT_MIN = 40;
export const TIMELINE_TRACK_HEIGHT_MAX = 240;
export const TIMELINE_DEFAULT_PX_PER_SEC = 80;
export const TIMELINE_DEFAULT_TRACK_HEIGHT = 88;
/** Initial / never-below project length (seconds). Duration only grows from here. */
export const TIMELINE_MIN_DURATION_SEC = 30;
/** Trailing empty time kept past the furthest clip / playhead. */
export const TIMELINE_DURATION_PAD_SEC = 2;
export const TIMELINE_RULER_HEIGHT_PX = 28;
export const TIMELINE_HEADER_WIDTH_PX = 170;
export const TIMELINE_SCROLLBAR_SIZE_PX = 14;
/** Bottom spacer so the last track can scroll clear of the Add track bar. */
export const TIMELINE_BOTTOM_PAD_PX = 44;
/** Below this track height, hide volume/pan knobs (label may still show on top). */
export const TIMELINE_COMPACT_HEIGHT_PX = 70;
/** Below this, move speaker label beside the icon with ellipsis. */
export const TIMELINE_INLINE_LABEL_HEIGHT_PX = 54;
/** Smallest clip duration when resizing. */
export const TIMELINE_CLIP_MIN_DURATION_SEC = 0.05;
/** Hit / visual width of clip left & right resize edges. */
export const TIMELINE_CLIP_RESIZE_HANDLE_PX = 8;
