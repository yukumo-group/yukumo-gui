import { ref, type Ref } from 'vue';
import type { TimelineViewport } from '../useTimelineViewport';
import type { TimelineTrack } from '../../types/timeline';

interface ReorderDrag {
  id: string;
  fromIndex: number;
  hoverIndex: number;
  deltaY: number;
}

export function useTimelineTrackReorder(options: {
  tracks: Ref<TimelineTrack[]>;
  trackHeightPx: TimelineViewport['trackHeightPx'];
}) {
  const reorderDrag = ref<ReorderDrag | null>(null);
  let reorderStartClientY = 0;

  function clampIndex(index: number): number {
    return Math.min(options.tracks.value.length - 1, Math.max(0, index));
  }

  function previewOffsetY(trackId: string, index: number): number {
    const d = reorderDrag.value;
    if (!d) return 0;
    const h = options.trackHeightPx.value;
    if (trackId === d.id) return d.deltaY;
    if (
      d.fromIndex < d.hoverIndex &&
      index > d.fromIndex &&
      index <= d.hoverIndex
    ) {
      return -h;
    }
    if (
      d.fromIndex > d.hoverIndex &&
      index >= d.hoverIndex &&
      index < d.fromIndex
    ) {
      return h;
    }
    return 0;
  }

  function isReorderDragging(trackId: string): boolean {
    return reorderDrag.value?.id === trackId;
  }

  function onReorderMove(e: PointerEvent): void {
    const d = reorderDrag.value;
    if (!d) return;
    const deltaY = e.clientY - reorderStartClientY;
    const h = options.trackHeightPx.value;
    const center = d.fromIndex * h + h / 2 + deltaY;
    const hoverIndex = clampIndex(Math.floor(center / h));
    reorderDrag.value = {
      ...d,
      deltaY,
      hoverIndex,
    };
  }

  function onReorderEnd(): void {
    const d = reorderDrag.value;
    if (d && d.fromIndex !== d.hoverIndex) {
      const next = [...options.tracks.value];
      const [item] = next.splice(d.fromIndex, 1);
      next.splice(d.hoverIndex, 0, item);
      options.tracks.value = next;
    }
    reorderDrag.value = null;
    window.removeEventListener('pointermove', onReorderMove);
    window.removeEventListener('pointerup', onReorderEnd);
    window.removeEventListener('pointercancel', onReorderEnd);
  }

  function onReorderStart(trackId: string, e: PointerEvent): void {
    if (e.button !== 0) return;
    e.preventDefault();
    const fromIndex = options.tracks.value.findIndex((tr) => tr.id === trackId);
    if (fromIndex < 0) return;
    reorderStartClientY = e.clientY;
    reorderDrag.value = {
      id: trackId,
      fromIndex,
      hoverIndex: fromIndex,
      deltaY: 0,
    };
    window.addEventListener('pointermove', onReorderMove);
    window.addEventListener('pointerup', onReorderEnd);
    window.addEventListener('pointercancel', onReorderEnd);
  }

  return {
    previewOffsetY,
    isReorderDragging,
    onReorderStart,
    onReorderEnd,
  };
}
