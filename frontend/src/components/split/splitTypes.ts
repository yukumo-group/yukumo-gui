export const SPLIT_GAP_PX = 8;

/** Drag this far past min before a hideable panel auto-collapses. */
export const SPLIT_AUTO_HIDE_THRESHOLD_PX = 64;

/** Matches split spring visualDuration (+ settle buffer). */
export const SPLIT_AUTO_HIDE_ANIM_MS = 320;

export const SPLIT_SPRING = {
  type: 'spring' as const,
  visualDuration: 0.28,
  bounce: 0.08,
  opacity: { type: 'tween' as const, duration: 0.18, ease: 'easeOut' },
};

export type SplitOrientation = 'vertical' | 'horizontal';

/** Panel sits before the handle (start) or after it (end). */
export type SplitSide = 'start' | 'end';

export function clampSplitSize(
  px: number,
  min: number,
  max: number,
  containerPx?: number,
  reservePx = 0,
): number {
  let resolvedMax = max;
  if (containerPx != null && Number.isFinite(containerPx)) {
    resolvedMax = Math.min(
      max,
      Math.max(min, containerPx - reservePx),
    );
  }
  return Math.min(resolvedMax, Math.max(min, Math.round(px)));
}
