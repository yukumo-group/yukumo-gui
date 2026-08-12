import type { Ref } from 'vue';
import {
  snapPlayheadEnabled,
  timelinePlayback,
} from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineEdgeScroll } from './useTimelineEdgeScroll';

export function useTimelineRulerScrub(options: {
  rulerRef: Ref<HTMLElement | null>;
  rulerComponentRef: Ref<{
    seekFromClientX: (clientX: number, el: HTMLElement) => void;
  } | null>;
  pxPerSec: Ref<number>;
  edgeScroll: TimelineEdgeScroll;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}) {
  let scrubClientX = 0;
  let scrubbing = false;

  function onSeek(timeSec: number): void {
    const next = snapPlayheadEnabled.value
      ? snapTimeToRuler(timeSec, options.pxPerSec.value)
      : Math.max(0, timeSec);
    timelinePlayback.seek(next);
  }

  function onRulerScrubStart(e: PointerEvent): void {
    scrubbing = true;
    scrubClientX = e.clientX;
    options.onScrubStart?.();
    options.edgeScroll.start(
      options.edgeScroll.rulerEdgeScroll,
      e.clientX,
      e.clientY,
      () => {
        const el = options.rulerRef.value;
        if (!el) return;
        options.rulerComponentRef.value?.seekFromClientX(scrubClientX, el);
      },
    );
  }

  function onRulerScrubMove(e: PointerEvent): void {
    scrubClientX = e.clientX;
    options.edgeScroll.updatePointer(e.clientX, e.clientY);
  }

  function onRulerScrubEnd(): void {
    const wasScrubbing = scrubbing;
    scrubbing = false;
    options.edgeScroll.stop();
    if (wasScrubbing) {
      options.onScrubEnd?.();
    }
  }

  return {
    onSeek,
    onRulerScrubStart,
    onRulerScrubMove,
    onRulerScrubEnd,
  };
}
