import { computed, onUnmounted, ref, watch, type Ref } from 'vue';
import {
  TIMELINE_BOTTOM_PAD_PX,
  TIMELINE_DEFAULT_PX_PER_SEC,
  TIMELINE_DEFAULT_TRACK_HEIGHT,
  TIMELINE_FIT_ZOOM_GRACE,
  TIMELINE_MIN_DURATION_SEC,
  TIMELINE_PX_PER_SEC_ABS_MIN,
  TIMELINE_PX_PER_SEC_MAX,
  TIMELINE_TRACK_HEIGHT_MAX,
  TIMELINE_TRACK_HEIGHT_MIN,
} from '../types/timeline';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const SMOOTH_HZ = 18;

export function useTimelineViewport(options?: {
  trackCount?: Ref<number>;
  /** Scrollable length (reconciled with view + content bound). */
  contentDurationSec?: Ref<number>;
  /** Live content end — used to reconcile scrollable length. */
  contentBoundSec?: Ref<number>;
  /**
   * Committed content end for fit/min zoom. Prefer updating this after
   * drag/scrub ends so zoom limits do not jump mid-gesture.
   */
  fitBoundSec?: Ref<number>;
  /** Reconcile scrollable duration with the visible window end. */
  reconcileDuration?: (viewEndSec: number) => void;
}) {
  const pxPerSec = ref(TIMELINE_DEFAULT_PX_PER_SEC);
  const trackHeightPx = ref(TIMELINE_DEFAULT_TRACK_HEIGHT);
  const scrollXPx = ref(0);
  const scrollYPx = ref(0);

  const targetPxPerSec = ref(TIMELINE_DEFAULT_PX_PER_SEC);
  const targetTrackHeightPx = ref(TIMELINE_DEFAULT_TRACK_HEIGHT);
  const targetScrollXPx = ref(0);
  const targetScrollYPx = ref(0);

  const viewportWidthPx = ref(0);
  const viewportHeightPx = ref(0);

  const trackCount = computed(() => options?.trackCount?.value ?? 0);
  const contentDurationSec = computed(() =>
    Math.max(
      TIMELINE_MIN_DURATION_SEC,
      options?.contentDurationSec?.value ?? TIMELINE_MIN_DURATION_SEC,
    ),
  );

  /** Fit zoom uses committed fit bound when provided (else live content bound). */
  const fitDurationSec = computed(() =>
    Math.max(
      TIMELINE_MIN_DURATION_SEC,
      options?.fitBoundSec?.value ?? options?.contentBoundSec?.value ?? 0,
    ),
  );

  /** Most zoomed-out: fit content+grace, or the full scrollable range if longer. */
  const minPxPerSec = computed(() => {
    const w = viewportWidthPx.value;
    const dur = Math.max(
      fitDurationSec.value * TIMELINE_FIT_ZOOM_GRACE,
      contentDurationSec.value,
    );
    if (w <= 0 || dur <= 0) return TIMELINE_PX_PER_SEC_ABS_MIN;
    return Math.max(TIMELINE_PX_PER_SEC_ABS_MIN, w / dur);
  });

  const contentWidthPx = computed(
    () => contentDurationSec.value * pxPerSec.value,
  );
  const contentHeightPx = computed(
    () => trackCount.value * trackHeightPx.value + TIMELINE_BOTTOM_PAD_PX,
  );

  function maxScrollXFor(
    pps: number,
    scrollViewportW = viewportWidthPx.value,
  ): number {
    return Math.max(0, contentDurationSec.value * pps - scrollViewportW);
  }

  function maxScrollYFor(
    th: number,
    scrollViewportH = viewportHeightPx.value,
  ): number {
    return Math.max(
      0,
      trackCount.value * th + TIMELINE_BOTTOM_PAD_PX - scrollViewportH,
    );
  }

  const maxScrollXPx = computed(() => maxScrollXFor(pxPerSec.value));
  const maxScrollYPx = computed(() => maxScrollYFor(trackHeightPx.value));

  function viewEndSec(scrollX: number, pps: number): number {
    if (pps <= 0) return 0;
    return (scrollX + viewportWidthPx.value) / pps;
  }

  /** Full reconcile (may shrink). Safe once scroll animation has settled. */
  function reconcileToView(
    scrollX = targetScrollXPx.value,
    pps = targetPxPerSec.value,
  ): void {
    options?.reconcileDuration?.(viewEndSec(scrollX, pps));
  }

  /** Grow-only room for the view — avoids clamping display mid-animation. */
  function growToView(
    scrollX = targetScrollXPx.value,
    pps = targetPxPerSec.value,
  ): void {
    const end = viewEndSec(scrollX, pps);
    const current = options?.contentDurationSec?.value ?? 0;
    if (end > current) {
      options?.reconcileDuration?.(end);
    }
  }

  function clampZoomToMin(): void {
    const min = minPxPerSec.value;
    if (targetPxPerSec.value < min) {
      targetPxPerSec.value = min;
    }
    if (pxPerSec.value < min) {
      pxPerSec.value = min;
    }
  }

  function clampTargets(): void {
    clampZoomToMin();
    targetScrollXPx.value = clamp(
      targetScrollXPx.value,
      0,
      maxScrollXFor(targetPxPerSec.value),
    );
    targetScrollYPx.value = clamp(
      targetScrollYPx.value,
      0,
      maxScrollYFor(targetTrackHeightPx.value),
    );
  }

  function clampDisplay(): void {
    clampZoomToMin();
    scrollXPx.value = clamp(scrollXPx.value, 0, maxScrollXPx.value);
    scrollYPx.value = clamp(scrollYPx.value, 0, maxScrollYPx.value);
  }

  let animRaf = 0;
  let lastAnimTs = 0;

  function stopAnim(): void {
    if (animRaf) {
      cancelAnimationFrame(animRaf);
      animRaf = 0;
    }
    lastAnimTs = 0;
  }

  function nearlyEqual(a: number, b: number, eps = 0.05): boolean {
    return Math.abs(a - b) < eps;
  }

  function stepAnim(ts: number): void {
    if (lastAnimTs === 0) lastAnimTs = ts;
    const dt = Math.min(0.05, (ts - lastAnimTs) / 1000);
    lastAnimTs = ts;
    const k = 1 - Math.exp(-SMOOTH_HZ * dt);

    pxPerSec.value += (targetPxPerSec.value - pxPerSec.value) * k;
    trackHeightPx.value +=
      (targetTrackHeightPx.value - trackHeightPx.value) * k;
    scrollXPx.value += (targetScrollXPx.value - scrollXPx.value) * k;
    scrollYPx.value += (targetScrollYPx.value - scrollYPx.value) * k;
    clampDisplay();

    const settled =
      nearlyEqual(pxPerSec.value, targetPxPerSec.value, 0.02) &&
      nearlyEqual(trackHeightPx.value, targetTrackHeightPx.value, 0.02) &&
      nearlyEqual(scrollXPx.value, targetScrollXPx.value) &&
      nearlyEqual(scrollYPx.value, targetScrollYPx.value);

    if (settled) {
      pxPerSec.value = targetPxPerSec.value;
      trackHeightPx.value = targetTrackHeightPx.value;
      scrollXPx.value = targetScrollXPx.value;
      scrollYPx.value = targetScrollYPx.value;
      reconcileToView();
      clampTargets();
      clampDisplay();
      stopAnim();
      return;
    }

    animRaf = requestAnimationFrame(stepAnim);
  }

  function scheduleAnim(): void {
    if (animRaf) return;
    lastAnimTs = 0;
    animRaf = requestAnimationFrame(stepAnim);
  }

  function snapDisplayToTargets(): void {
    stopAnim();
    pxPerSec.value = targetPxPerSec.value;
    trackHeightPx.value = targetTrackHeightPx.value;
    scrollXPx.value = targetScrollXPx.value;
    scrollYPx.value = targetScrollYPx.value;
    clampDisplay();
  }

  function setViewportSize(width: number, height: number): void {
    viewportWidthPx.value = Math.max(0, width);
    viewportHeightPx.value = Math.max(0, height);
    reconcileToView();
    clampTargets();
    clampDisplay();
  }

  /** @param immediate skip smoothing (pointer drag / scrollbar). */
  function panBy(dxPx: number, dyPx: number, immediate = false): void {
    targetScrollXPx.value += dxPx;
    targetScrollYPx.value += dyPx;
    if (immediate) {
      reconcileToView();
    } else {
      growToView();
    }
    clampTargets();
    if (immediate) {
      scrollXPx.value = targetScrollXPx.value;
      scrollYPx.value = targetScrollYPx.value;
      clampDisplay();
      return;
    }
    scheduleAnim();
  }

  function setScrollX(px: number, immediate = true): void {
    targetScrollXPx.value = px;
    if (immediate) {
      reconcileToView();
    } else {
      growToView();
    }
    clampTargets();
    if (immediate) {
      scrollXPx.value = targetScrollXPx.value;
      clampDisplay();
      return;
    }
    scheduleAnim();
  }

  function setScrollY(px: number, immediate = true): void {
    targetScrollYPx.value = px;
    clampTargets();
    if (immediate) {
      scrollYPx.value = targetScrollYPx.value;
      clampDisplay();
      return;
    }
    scheduleAnim();
  }

  function zoomXAt(localX: number, factor: number): void {
    const next = clamp(
      targetPxPerSec.value * factor,
      minPxPerSec.value,
      TIMELINE_PX_PER_SEC_MAX,
    );
    if (next === targetPxPerSec.value) return;

    const contentX = scrollXPx.value + localX;
    const timeSec = contentX / pxPerSec.value;
    targetPxPerSec.value = next;
    targetScrollXPx.value = timeSec * next - localX;
    growToView();
    clampTargets();
    scheduleAnim();
  }

  function zoomYAt(localY: number, factor: number): void {
    const next = clamp(
      targetTrackHeightPx.value * factor,
      TIMELINE_TRACK_HEIGHT_MIN,
      TIMELINE_TRACK_HEIGHT_MAX,
    );
    if (next === targetTrackHeightPx.value) {
      clampTargets();
      return;
    }

    if (trackCount.value === 0) {
      targetTrackHeightPx.value = next;
      clampTargets();
      scheduleAnim();
      return;
    }

    const contentY = scrollYPx.value + localY;
    const trackIndex = contentY / trackHeightPx.value;
    targetTrackHeightPx.value = next;
    targetScrollYPx.value = trackIndex * next - localY;
    clampTargets();
    scheduleAnim();
  }

  function timeAtLocalX(localX: number): number {
    return (scrollXPx.value + localX) / pxPerSec.value;
  }

  function localXAtTime(timeSec: number): number {
    return timeSec * pxPerSec.value - scrollXPx.value;
  }

  watch(minPxPerSec, () => {
    clampTargets();
    clampDisplay();
  });

  watch(
    () => options?.contentBoundSec?.value,
    () => {
      reconcileToView();
      clampTargets();
      clampDisplay();
    },
  );

  onUnmounted(() => {
    stopAnim();
  });

  return {
    pxPerSec,
    trackHeightPx,
    scrollXPx,
    scrollYPx,
    viewportWidthPx,
    viewportHeightPx,
    contentDurationSec,
    contentWidthPx,
    contentHeightPx,
    maxScrollXPx,
    maxScrollYPx,
    minPxPerSec,
    setViewportSize,
    panBy,
    setScrollX,
    setScrollY,
    zoomXAt,
    zoomYAt,
    timeAtLocalX,
    localXAtTime,
    clampScroll: clampDisplay,
    snapDisplayToTargets,
  };
}

export type TimelineViewport = ReturnType<typeof useTimelineViewport>;
