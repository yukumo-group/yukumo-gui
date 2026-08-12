import { computed, ref, type Ref } from 'vue';
import type { TimelineViewport } from '../useTimelineViewport';
import type { TimelineClip, TimelineTrack } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';

const MARQUEE_THRESHOLD_PX = 3;

interface MarqueeState {
  originContentX: number;
  originContentY: number;
  currentContentX: number;
  currentContentY: number;
  additive: boolean;
  lastClientX: number;
  lastClientY: number;
}

export function useTimelineMarquee(options: {
  tracks: Ref<TimelineTrack[]>;
  clipsForTrack: (trackId: string) => TimelineClip[];
  selection: TimelineSelection;
  viewport: Pick<
    TimelineViewport,
    'pxPerSec' | 'trackHeightPx' | 'scrollXPx' | 'scrollYPx'
  >;
  lanesViewportRef: Ref<HTMLElement | null>;
  edgeScroll: TimelineEdgeScroll;
}) {
  const marquee = ref<MarqueeState | null>(null);

  const marqueeStyle = computed(() => {
    const m = marquee.value;
    if (!m) return null;
    const left =
      Math.min(m.originContentX, m.currentContentX) -
      options.viewport.scrollXPx.value;
    const top =
      Math.min(m.originContentY, m.currentContentY) -
      options.viewport.scrollYPx.value;
    const width = Math.abs(m.currentContentX - m.originContentX);
    const height = Math.abs(m.currentContentY - m.originContentY);
    if (width < 1 && height < 1) return null;
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  });

  function contentPointFromClient(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const el = options.lanesViewportRef.value;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: options.viewport.scrollXPx.value + (clientX - rect.left),
      y: options.viewport.scrollYPx.value + (clientY - rect.top),
    };
  }

  function clipsIntersectingMarquee(m: MarqueeState): string[] {
    const left = Math.min(m.originContentX, m.currentContentX);
    const right = Math.max(m.originContentX, m.currentContentX);
    const top = Math.min(m.originContentY, m.currentContentY);
    const bottom = Math.max(m.originContentY, m.currentContentY);
    const hit: string[] = [];
    const { pxPerSec, trackHeightPx } = options.viewport;

    options.tracks.value.forEach((track, index) => {
      const trackTop = index * trackHeightPx.value;
      const trackBottom = trackTop + trackHeightPx.value;
      if (trackBottom < top || trackTop > bottom) return;

      for (const clip of options.clipsForTrack(track.id)) {
        const clipLeft = clip.startSec * pxPerSec.value;
        const clipRight = clipLeft + clip.durationSec * pxPerSec.value;
        const clipTop = trackTop + 4;
        const clipBottom = trackBottom - 4;
        if (
          clipRight >= left &&
          clipLeft <= right &&
          clipBottom >= top &&
          clipTop <= bottom
        ) {
          hit.push(clip.id);
        }
      }
    });

    return hit;
  }

  function updateFromPointer(clientX: number, clientY: number): void {
    const m = marquee.value;
    if (!m) return;
    const point = contentPointFromClient(clientX, clientY);
    marquee.value = {
      ...m,
      currentContentX: point.x,
      currentContentY: point.y,
      lastClientX: clientX,
      lastClientY: clientY,
    };
  }

  function onMarqueeMove(e: PointerEvent): void {
    if (!marquee.value) return;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
    updateFromPointer(e.clientX, e.clientY);
  }

  function endMarquee(): void {
    const m = marquee.value;
    if (m) {
      const w = Math.abs(m.currentContentX - m.originContentX);
      const h = Math.abs(m.currentContentY - m.originContentY);
      const { clearSelection, setSelection, selectedClipIds } =
        options.selection;
      if (w < MARQUEE_THRESHOLD_PX && h < MARQUEE_THRESHOLD_PX) {
        if (!m.additive) clearSelection();
      } else {
        const hit = clipsIntersectingMarquee(m);
        if (m.additive) {
          setSelection([...selectedClipIds.value, ...hit]);
        } else {
          setSelection(hit);
        }
      }
    }
    marquee.value = null;
    options.edgeScroll.stop();
    window.removeEventListener('pointermove', onMarqueeMove);
    window.removeEventListener('pointerup', endMarquee);
    window.removeEventListener('pointercancel', endMarquee);
  }

  function startMarquee(e: PointerEvent): void {
    const point = contentPointFromClient(e.clientX, e.clientY);
    marquee.value = {
      originContentX: point.x,
      originContentY: point.y,
      currentContentX: point.x,
      currentContentY: point.y,
      additive: e.ctrlKey || e.metaKey,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
    };
    window.addEventListener('pointermove', onMarqueeMove);
    window.addEventListener('pointerup', endMarquee);
    window.addEventListener('pointercancel', endMarquee);
    options.edgeScroll.start(
      options.edgeScroll.lanesEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        const m = marquee.value;
        if (!m) return;
        updateFromPointer(m.lastClientX, m.lastClientY);
      },
    );
  }

  return {
    marqueeStyle,
    startMarquee,
    endMarquee,
  };
}
