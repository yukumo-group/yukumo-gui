import { onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue';
import type { TimelineViewport } from '../useTimelineViewport';

export function useTimelineGestures(options: {
  rootRef: Ref<HTMLElement | null>;
  lanesViewportRef: Ref<HTMLElement | null>;
  rulerRef: Ref<HTMLElement | null>;
  viewport: Pick<
    TimelineViewport,
    | 'pxPerSec'
    | 'trackHeightPx'
    | 'setViewportSize'
    | 'panBy'
    | 'zoomXAt'
    | 'zoomYAt'
  >;
}) {
  const {
    rootRef,
    lanesViewportRef,
    rulerRef,
    viewport: { pxPerSec, trackHeightPx, setViewportSize, panBy, zoomXAt, zoomYAt },
  } = options;

  function measureViewport(): void {
    const el = lanesViewportRef.value;
    if (!el) return;
    setViewportSize(el.clientWidth, el.clientHeight);
  }

  let resizeObserver: ResizeObserver | undefined;

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    const rulerEl = rulerRef.value;
    const lanes = lanesViewportRef.value;

    let overRuler = false;
    let rulerLocalX = 0;
    if (rulerEl) {
      const rulerRect = rulerEl.getBoundingClientRect();
      overRuler =
        e.clientX >= rulerRect.left &&
        e.clientX <= rulerRect.right &&
        e.clientY >= rulerRect.top &&
        e.clientY <= rulerRect.bottom;
      if (overRuler) {
        rulerLocalX = Math.max(0, e.clientX - rulerRect.left);
      }
    }

    if (overRuler) {
      if (e.shiftKey) {
        panBy(e.deltaY !== 0 ? e.deltaY : e.deltaX, 0);
        return;
      }
      if (e.altKey) {
        const localY = lanes ? Math.max(0, lanes.clientHeight / 2) : 0;
        zoomYAt(localY, zoomFactor);
        return;
      }
      // Plain / ctrl wheel on ruler: X-zoom toward pointer (FL-style).
      zoomXAt(rulerLocalX, zoomFactor);
      return;
    }

    if (!lanes) return;
    const rect = lanes.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      zoomXAt(Math.max(0, localX), zoomFactor);
      return;
    }
    if (e.altKey) {
      zoomYAt(Math.max(0, localY), zoomFactor);
      return;
    }
    if (e.shiftKey) {
      panBy(e.deltaY !== 0 ? e.deltaY : e.deltaX, 0);
      return;
    }
    panBy(e.deltaX, e.deltaY);
  }

  let panning = false;
  let panLastX = 0;
  let panLastY = 0;

  function onLanesPointerDown(e: PointerEvent): void {
    const isMiddle = e.button === 1;
    const isTouch = e.pointerType === 'touch';
    if (!isMiddle && !isTouch) return;
    if (isMiddle) e.preventDefault();
    panning = true;
    panLastX = e.clientX;
    panLastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onLanesPointerMove(e: PointerEvent): void {
    if (!panning) return;
    const dx = e.clientX - panLastX;
    const dy = e.clientY - panLastY;
    panLastX = e.clientX;
    panLastY = e.clientY;
    panBy(-dx, -dy, true);
  }

  function onLanesPointerUp(e: PointerEvent): void {
    panning = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchStartDist = 0;
  let pinchStartPxPerSec = 0;
  let pinchMidLocalX = 0;

  function onGesturePointerDown(e: PointerEvent): void {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 2) {
      panning = false;
      const pts = [...activePointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartPxPerSec = pxPerSec.value;
      const lanes = lanesViewportRef.value;
      if (lanes) {
        const rect = lanes.getBoundingClientRect();
        pinchMidLocalX = (pts[0].x + pts[1].x) / 2 - rect.left;
      }
    }
  }

  function onGesturePointerMove(e: PointerEvent): void {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 2 && pinchStartDist > 0) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (dist < 1) return;
      const factor = dist / pinchStartDist;
      const target = pinchStartPxPerSec * factor;
      const current = pxPerSec.value;
      if (current > 0) {
        zoomXAt(Math.max(0, pinchMidLocalX), target / current);
        pinchStartDist = dist;
        pinchStartPxPerSec = pxPerSec.value;
      }
    }
  }

  function onGesturePointerUp(e: PointerEvent): void {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) {
      pinchStartDist = 0;
    }
  }

  onMounted(() => {
    measureViewport();
    if (lanesViewportRef.value) {
      resizeObserver = new ResizeObserver(() => measureViewport());
      resizeObserver.observe(lanesViewportRef.value);
    }
    rootRef.value?.addEventListener('wheel', onWheel, { passive: false });
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    rootRef.value?.removeEventListener('wheel', onWheel);
  });

  watch(trackHeightPx, () => {
    nextTick(() => measureViewport());
  });

  return {
    onLanesPointerDown,
    onLanesPointerMove,
    onLanesPointerUp,
    onGesturePointerDown,
    onGesturePointerMove,
    onGesturePointerUp,
  };
}
