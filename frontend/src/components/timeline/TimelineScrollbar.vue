<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  orientation: 'horizontal' | 'vertical';
  contentSize: number;
  viewportSize: number;
  scroll: number;
  ariaLabel: string;
}>();

const emit = defineEmits<{
  scroll: [value: number];
}>();

const trackRef = ref<HTMLElement | null>(null);
const trackLengthPx = ref(0);

const isHorizontal = computed(() => props.orientation === 'horizontal');

const maxScroll = computed(() =>
  Math.max(0, props.contentSize - props.viewportSize),
);

const thumbRatio = computed(() => {
  if (props.contentSize <= 0 || props.viewportSize <= 0) return 1;
  return Math.min(1, props.viewportSize / props.contentSize);
});

const thumbSizePx = computed(() =>
  Math.max(24, thumbRatio.value * trackLengthPx.value),
);

const thumbOffsetPx = computed(() => {
  if (maxScroll.value <= 0 || trackLengthPx.value <= 0) return 0;
  const travel = Math.max(1, trackLengthPx.value - thumbSizePx.value);
  return (props.scroll / maxScroll.value) * travel;
});

let dragging = false;
let dragStartPointer = 0;
let dragStartScroll = 0;
let resizeObserver: ResizeObserver | undefined;

function measureTrack(): void {
  const el = trackRef.value;
  if (!el) return;
  trackLengthPx.value = isHorizontal.value ? el.clientWidth : el.clientHeight;
}

function onThumbPointerDown(e: PointerEvent): void {
  e.preventDefault();
  e.stopPropagation();
  dragging = true;
  dragStartPointer = isHorizontal.value ? e.clientX : e.clientY;
  dragStartScroll = props.scroll;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onThumbPointerMove(e: PointerEvent): void {
  if (!dragging) return;
  const delta = (isHorizontal.value ? e.clientX : e.clientY) - dragStartPointer;
  const travel = Math.max(1, trackLengthPx.value - thumbSizePx.value);
  const next = dragStartScroll + (delta / travel) * maxScroll.value;
  emit('scroll', Math.min(maxScroll.value, Math.max(0, next)));
}

function onThumbPointerUp(e: PointerEvent): void {
  dragging = false;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
}

function onTrackPointerDown(e: PointerEvent): void {
  if ((e.target as HTMLElement).dataset.thumb === 'true') return;
  const thumb = thumbSizePx.value;
  const pointer = isHorizontal.value ? e.offsetX : e.offsetY;
  const travel = Math.max(1, trackLengthPx.value - thumb);
  const ratio = (pointer - thumb / 2) / travel;
  emit(
    'scroll',
    Math.min(maxScroll.value, Math.max(0, ratio * maxScroll.value)),
  );
}

watch(
  () => [props.contentSize, props.viewportSize, props.orientation] as const,
  () => {
    measureTrack();
    if (props.scroll > maxScroll.value) {
      emit('scroll', maxScroll.value);
    }
  },
);

onMounted(() => {
  measureTrack();
  if (trackRef.value) {
    resizeObserver = new ResizeObserver(() => measureTrack());
    resizeObserver.observe(trackRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    ref="trackRef"
    class="timeline-scrollbar relative shrink-0 bg-surface-container-high"
    :class="
      isHorizontal
        ? 'h-[14px] w-full cursor-default'
        : 'h-full w-[14px] cursor-default'
    "
    role="scrollbar"
    :aria-label="ariaLabel"
    :aria-orientation="orientation"
    :aria-valuemin="0"
    :aria-valuemax="maxScroll"
    :aria-valuenow="scroll"
    @pointerdown="onTrackPointerDown"
  >
    <div
      data-thumb="true"
      class="absolute rounded-sm bg-outline/50 hover:bg-outline/70"
      :class="isHorizontal ? 'top-0.5 bottom-0.5' : 'left-0.5 right-0.5'"
      :style="
        isHorizontal
          ? {
              width: `${thumbSizePx}px`,
              left: `${thumbOffsetPx}px`,
            }
          : {
              height: `${thumbSizePx}px`,
              top: `${thumbOffsetPx}px`,
            }
      "
      @pointerdown="onThumbPointerDown"
      @pointermove="onThumbPointerMove"
      @pointerup="onThumbPointerUp"
      @pointercancel="onThumbPointerUp"
    />
  </div>
</template>
