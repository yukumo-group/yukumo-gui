import { computed, ref, type Ref } from 'vue';
import type { TimelineViewport } from '../useTimelineViewport';
import type { TimelineClip, TimelineTrack } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';
import {
  clientToContentPoint,
  clipsIntersectingRect,
} from './timelinePointer';

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
    const point = clientToContentPoint(
      el,
      clientX,
      clientY,
      options.viewport.scrollXPx.value,
      options.viewport.scrollYPx.value,
    );
    return { x: point.contentX, y: point.contentY };
  }

  function clipsIntersectingMarquee(m: MarqueeState): string[] {
    return clipsIntersectingRect(
      options.tracks.value,
      options.clipsForTrack,
      {
        left: Math.min(m.originContentX, m.currentContentX),
        right: Math.max(m.originContentX, m.currentContentX),
        top: Math.min(m.originContentY, m.currentContentY),
        bottom: Math.max(m.originContentY, m.currentContentY),
      },
      options.viewport.pxPerSec.value,
      options.viewport.trackHeightPx.value,
    );
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
