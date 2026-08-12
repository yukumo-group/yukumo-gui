import { computed, ref, type Ref } from 'vue';
import type { TimelineViewport } from '../useTimelineViewport';
import type { TimelineClip, TimelineTrack } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';
import {
  clientToContentPoint,
  clipsIntersectingRect,
} from './timelinePointer';

const DELETE_DRAG_THRESHOLD_PX = 3;

interface DeleteGesture {
  originContentX: number;
  originContentY: number;
  currentContentX: number;
  currentContentY: number;
  originClipId: string | null;
  lastClientX: number;
  lastClientY: number;
}

export function useTimelineClipDelete(options: {
  tracks: Ref<TimelineTrack[]>;
  clipsForTrack: (trackId: string) => TimelineClip[];
  selection: TimelineSelection;
  viewport: Pick<
    TimelineViewport,
    'pxPerSec' | 'trackHeightPx' | 'scrollXPx' | 'scrollYPx'
  >;
  lanesViewportRef: Ref<HTMLElement | null>;
  edgeScroll: TimelineEdgeScroll;
  removeClips: (ids: readonly string[]) => void;
}) {
  const gesture = ref<DeleteGesture | null>(null);

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

  function isDrag(g: DeleteGesture): boolean {
    return (
      Math.abs(g.currentContentX - g.originContentX) >=
        DELETE_DRAG_THRESHOLD_PX ||
      Math.abs(g.currentContentY - g.originContentY) >= DELETE_DRAG_THRESHOLD_PX
    );
  }

  function intersectingIds(g: DeleteGesture): string[] {
    return clipsIntersectingRect(
      options.tracks.value,
      options.clipsForTrack,
      {
        left: Math.min(g.originContentX, g.currentContentX),
        right: Math.max(g.originContentX, g.currentContentX),
        top: Math.min(g.originContentY, g.currentContentY),
        bottom: Math.max(g.originContentY, g.currentContentY),
      },
      options.viewport.pxPerSec.value,
      options.viewport.trackHeightPx.value,
    );
  }

  const deleteMarqueeStyle = computed(() => {
    const g = gesture.value;
    if (!g || !isDrag(g)) return null;
    const left =
      Math.min(g.originContentX, g.currentContentX) -
      options.viewport.scrollXPx.value;
    const top =
      Math.min(g.originContentY, g.currentContentY) -
      options.viewport.scrollYPx.value;
    const width = Math.abs(g.currentContentX - g.originContentX);
    const height = Math.abs(g.currentContentY - g.originContentY);
    if (width < 1 && height < 1) return null;
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  });

  const dangerClipIds = computed(() => {
    const g = gesture.value;
    if (!g) return new Set<string>();
    if (isDrag(g)) return new Set(intersectingIds(g));
    if (g.originClipId) return new Set([g.originClipId]);
    return new Set<string>();
  });

  function updateFromPointer(clientX: number, clientY: number): void {
    const g = gesture.value;
    if (!g) return;
    const point = contentPointFromClient(clientX, clientY);
    gesture.value = {
      ...g,
      currentContentX: point.x,
      currentContentY: point.y,
      lastClientX: clientX,
      lastClientY: clientY,
    };
  }

  function onDeleteMove(e: PointerEvent): void {
    if (!gesture.value) return;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
    updateFromPointer(e.clientX, e.clientY);
  }

  function finishDelete(commit: boolean): void {
    const g = gesture.value;
    if (commit && g) {
      const ids = isDrag(g)
        ? intersectingIds(g)
        : g.originClipId
          ? [g.originClipId]
          : [];
      if (ids.length > 0) {
        options.removeClips(ids);
        const remaining = options.selection.selectedClipIds.value.filter(
          (id) => !ids.includes(id),
        );
        options.selection.setSelection(remaining);
      }
    }
    gesture.value = null;
    options.edgeScroll.stop();
    window.removeEventListener('pointermove', onDeleteMove);
    window.removeEventListener('pointerup', endDelete);
    window.removeEventListener('pointercancel', endDelete);
  }

  function endDelete(): void {
    finishDelete(true);
  }

  function cancelDelete(): void {
    finishDelete(false);
  }

  function startDelete(e: PointerEvent, originClipId: string | null = null): void {
    if (e.button !== 0) return;
    const point = contentPointFromClient(e.clientX, e.clientY);
    gesture.value = {
      originContentX: point.x,
      originContentY: point.y,
      currentContentX: point.x,
      currentContentY: point.y,
      originClipId,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
    };
    window.addEventListener('pointermove', onDeleteMove);
    window.addEventListener('pointerup', endDelete);
    window.addEventListener('pointercancel', endDelete);
    options.edgeScroll.start(
      options.edgeScroll.lanesEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        const g = gesture.value;
        if (!g) return;
        updateFromPointer(g.lastClientX, g.lastClientY);
      },
    );
  }

  return {
    deleteMarqueeStyle,
    dangerClipIds,
    startDelete,
    endDelete,
    cancelDelete,
  };
}
