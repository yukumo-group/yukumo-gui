import { computed, ref } from 'vue';

export function formatTimelineTime(totalSec: number): string {
  const totalMs = Math.round(Math.max(0, totalSec) * 1000);
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${m}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
}

export function useTimelinePlayback(options?: {
  getDurationSec?: () => number;
  /** When > 0, playback loops at this time instead of stopping. */
  getLoopEndSec?: () => number;
}) {
  const currentTimeSec = ref(0);
  const isPlaying = ref(false);
  /** Position captured when Play was last pressed (FL stop return). */
  const playStartSec = ref(0);

  let rafId = 0;
  let lastTs = 0;

  const elapsedLabel = computed(() => formatTimelineTime(currentTimeSec.value));

  function stopRaf(): void {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    lastTs = 0;
  }

  function tick(ts: number): void {
    if (!isPlaying.value) return;
    if (lastTs === 0) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    const loopEnd = options?.getLoopEndSec?.() ?? 0;
    const duration = options?.getDurationSec?.() ?? Number.POSITIVE_INFINITY;

    currentTimeSec.value += dt;

    if (loopEnd > 0.001) {
      if (currentTimeSec.value >= loopEnd) {
        currentTimeSec.value = currentTimeSec.value % loopEnd;
      }
    } else if (currentTimeSec.value >= duration) {
      isPlaying.value = false;
      currentTimeSec.value = duration;
      stopRaf();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function play(): void {
    if (isPlaying.value) return;
    const loopEnd = options?.getLoopEndSec?.() ?? 0;
    const duration = options?.getDurationSec?.() ?? Number.POSITIVE_INFINITY;
    const end = loopEnd > 0.001 ? loopEnd : duration;
    if (currentTimeSec.value >= end) {
      currentTimeSec.value = 0;
    }
    playStartSec.value = currentTimeSec.value;
    isPlaying.value = true;
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }

  function pause(): void {
    isPlaying.value = false;
    stopRaf();
  }

  function togglePlay(): void {
    if (isPlaying.value) pause();
    else play();
  }

  /**
   * FL-style Stop: if playing, stop and return to last play start;
   * if already stopped, jump to timeline start (0).
   */
  function stop(): void {
    if (isPlaying.value) {
      pause();
      currentTimeSec.value = playStartSec.value;
      return;
    }
    currentTimeSec.value = 0;
  }

  function seek(timeSec: number): void {
    // Do not clamp to content duration — length grows to cover the playhead.
    currentTimeSec.value = Math.max(0, timeSec);
  }

  function dispose(): void {
    pause();
  }

  return {
    currentTimeSec,
    isPlaying,
    playStartSec,
    elapsedLabel,
    play,
    pause,
    stop,
    togglePlay,
    seek,
    dispose,
  };
}

export type TimelinePlayback = ReturnType<typeof useTimelinePlayback>;
