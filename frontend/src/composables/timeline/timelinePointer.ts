import type { TimelineClip, TimelineTrack } from '../../types/timeline';

/** Vertical inset matching clip `top-1` / `bottom-1` padding. */
const CLIP_VERTICAL_INSET_PX = 4;

export function clientToContentPoint(
  lanesEl: HTMLElement,
  clientX: number,
  clientY: number,
  scrollXPx: number,
  scrollYPx: number,
): { contentX: number; contentY: number; localX: number; localY: number } {
  const rect = lanesEl.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  return {
    localX,
    localY,
    contentX: scrollXPx + localX,
    contentY: scrollYPx + localY,
  };
}

export function trackIndexAtContentY(
  contentY: number,
  trackHeightPx: number,
  trackCount: number,
): number | null {
  if (trackHeightPx <= 0 || trackCount <= 0) return null;
  const index = Math.floor(contentY / trackHeightPx);
  if (index < 0 || index >= trackCount) return null;
  return index;
}

export function timeAtContentX(contentX: number, pxPerSec: number): number {
  if (pxPerSec <= 0) return 0;
  return Math.max(0, contentX / pxPerSec);
}

export function clipAtTimeOnTrack(
  clips: readonly TimelineClip[],
  trackId: string,
  timeSec: number,
): TimelineClip | null {
  for (const clip of clips) {
    if (clip.trackId !== trackId) continue;
    if (
      timeSec >= clip.startSec &&
      timeSec < clip.startSec + clip.durationSec
    ) {
      return clip;
    }
  }
  return null;
}

export function gapAroundTime(
  clips: readonly TimelineClip[],
  trackId: string,
  timeSec: number,
): { startSec: number; endSec: number } | null {
  if (clipAtTimeOnTrack(clips, trackId, timeSec)) return null;

  let startSec = 0;
  let endSec = Number.POSITIVE_INFINITY;
  for (const clip of clips) {
    if (clip.trackId !== trackId) continue;
    const clipEnd = clip.startSec + clip.durationSec;
    if (clipEnd <= timeSec) {
      startSec = Math.max(startSec, clipEnd);
    }
    if (clip.startSec >= timeSec) {
      endSec = Math.min(endSec, clip.startSec);
    }
  }
  return { startSec, endSec };
}

export function clipsIntersectingRect(
  tracks: readonly TimelineTrack[],
  clipsForTrack: (trackId: string) => TimelineClip[],
  rect: { left: number; right: number; top: number; bottom: number },
  pxPerSec: number,
  trackHeightPx: number,
): string[] {
  const hit: string[] = [];
  tracks.forEach((track, index) => {
    const trackTop = index * trackHeightPx;
    const trackBottom = trackTop + trackHeightPx;
    if (trackBottom < rect.top || trackTop > rect.bottom) return;

    for (const clip of clipsForTrack(track.id)) {
      const clipLeft = clip.startSec * pxPerSec;
      const clipRight = clipLeft + clip.durationSec * pxPerSec;
      const clipTop = trackTop + CLIP_VERTICAL_INSET_PX;
      const clipBottom = trackBottom - CLIP_VERTICAL_INSET_PX;
      if (
        clipRight >= rect.left &&
        clipLeft <= rect.right &&
        clipBottom >= rect.top &&
        clipTop <= rect.bottom
      ) {
        hit.push(clip.id);
      }
    }
  });
  return hit;
}
