import type { Ref } from 'vue';
import {
  createEdgeAutoScroll,
  type EdgeAutoScroll,
  type EdgeAutoScrollSession,
} from '../useEdgeAutoScroll';
import type { TimelineViewport } from '../useTimelineViewport';

export function useTimelineEdgeScroll(options: {
  lanesViewportRef: Ref<HTMLElement | null>;
  rulerRef: Ref<HTMLElement | null>;
  panBy: TimelineViewport['panBy'];
}) {
  const lanesEdgeScroll = createEdgeAutoScroll({
    getRect: () =>
      options.lanesViewportRef.value?.getBoundingClientRect() ?? null,
    panBy: options.panBy,
    axes: { x: true, y: true },
  });

  const rulerEdgeScroll = createEdgeAutoScroll({
    getRect: () => options.rulerRef.value?.getBoundingClientRect() ?? null,
    panBy: options.panBy,
    axes: { x: true, y: false },
  });

  let session: EdgeAutoScrollSession | null = null;

  function start(
    scroller: EdgeAutoScroll,
    clientX: number,
    clientY: number,
    onFrame?: (scrollDx: number, scrollDy: number) => void,
  ): void {
    stop();
    session = scroller.start(clientX, clientY, onFrame);
  }

  function updatePointer(clientX: number, clientY: number): void {
    session?.updatePointer(clientX, clientY);
  }

  function stop(): void {
    session?.stop();
    session = null;
    lanesEdgeScroll.stop();
    rulerEdgeScroll.stop();
  }

  return {
    lanesEdgeScroll,
    rulerEdgeScroll,
    start,
    updatePointer,
    stop,
  };
}

export type TimelineEdgeScroll = ReturnType<typeof useTimelineEdgeScroll>;
