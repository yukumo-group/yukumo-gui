/** Auto-pan a scrollable region while the pointer is outside (or near) its edges. */

export interface EdgeAutoScrollAxes {
  x?: boolean;
  y?: boolean;
}

export interface EdgeAutoScrollOptions {
  getRect: () => DOMRect | null;
  /** Positive dx pans content right (increases scrollX). */
  panBy: (dx: number, dy: number, immediate?: boolean) => void;
  axes?: EdgeAutoScrollAxes;
  /** Distance past the edge that reaches max speed (px). */
  edgePx?: number;
  /** Max pan speed in px/sec. */
  maxSpeedPxPerSec?: number;
}

export interface EdgeAutoScrollSession {
  updatePointer: (clientX: number, clientY: number) => void;
  stop: () => void;
}

export function createEdgeAutoScroll(options: EdgeAutoScrollOptions) {
  const edgePx = options.edgePx ?? 40;
  const maxSpeed = options.maxSpeedPxPerSec ?? 1400;
  const axes = {
    x: options.axes?.x !== false,
    y: options.axes?.y !== false,
  };

  let active = false;
  let clientX = 0;
  let clientY = 0;
  let raf = 0;
  let lastTs = 0;
  let onFrame: ((scrollDx: number, scrollDy: number) => void) | null = null;

  function stop(): void {
    active = false;
    onFrame = null;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastTs = 0;
  }

  function edgeSpeed(overflow: number, dt: number): number {
    if (overflow <= 0) return 0;
    const t = Math.min(1, overflow / edgePx);
    return t * t * maxSpeed * dt;
  }

  function tick(ts: number): void {
    if (!active) return;
    if (lastTs === 0) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    const rect = options.getRect();
    let scrollDx = 0;
    let scrollDy = 0;

    if (rect) {
      if (axes.x) {
        if (clientX < rect.left) {
          scrollDx = -edgeSpeed(rect.left - clientX, dt);
        } else if (clientX > rect.right) {
          scrollDx = edgeSpeed(clientX - rect.right, dt);
        }
      }
      if (axes.y) {
        if (clientY < rect.top) {
          scrollDy = -edgeSpeed(rect.top - clientY, dt);
        } else if (clientY > rect.bottom) {
          scrollDy = edgeSpeed(clientY - rect.bottom, dt);
        }
      }
    }

    if (scrollDx !== 0 || scrollDy !== 0) {
      options.panBy(scrollDx, scrollDy, true);
      onFrame?.(scrollDx, scrollDy);
    }

    raf = requestAnimationFrame(tick);
  }

  function start(
    clientX0: number,
    clientY0: number,
    frame?: (scrollDx: number, scrollDy: number) => void,
  ): EdgeAutoScrollSession {
    stop();
    active = true;
    clientX = clientX0;
    clientY = clientY0;
    onFrame = frame ?? null;
    lastTs = 0;
    raf = requestAnimationFrame(tick);

    return {
      updatePointer(nextX: number, nextY: number) {
        clientX = nextX;
        clientY = nextY;
      },
      stop,
    };
  }

  return { start, stop };
}

export type EdgeAutoScroll = ReturnType<typeof createEdgeAutoScroll>;
