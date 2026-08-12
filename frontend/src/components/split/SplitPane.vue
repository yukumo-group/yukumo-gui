<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { motion } from 'motion-v';
import SplitHandle from './SplitHandle.vue';
import {
  SPLIT_AUTO_HIDE_ANIM_MS,
  SPLIT_AUTO_HIDE_THRESHOLD_PX,
  SPLIT_GAP_PX,
  SPLIT_SPRING,
  clampSplitSize,
  type SplitOrientation,
  type SplitSide,
} from './splitTypes';

const props = withDefaults(
  defineProps<{
    size: number;
    open: boolean;
    orientation: SplitOrientation;
    /** Panel before handle (`start`) or after handle (`end`). */
    side?: SplitSide;
    min: number;
    max: number;
    defaultSize: number;
    resizeLabel: string;
    panelLabel?: string;
    gap?: number;
    collapseGap?: boolean;
    autoHide?: boolean;
    autoHideThreshold?: number;
    /** Leave this much of the container for the main pane when clamping max. */
    reservePx?: number;
    /**
     * Element whose clientWidth/Height bounds the panel max.
     * Falls back to the SplitPane root when omitted.
     */
    containerEl?: HTMLElement | null;
    /** Classes for the panel + persistent chrome wrapper (`side="end"`). */
    chromeClass?: string;
  }>(),
  {
    side: 'start',
    gap: SPLIT_GAP_PX,
    collapseGap: true,
    autoHide: true,
    autoHideThreshold: SPLIT_AUTO_HIDE_THRESHOLD_PX,
    reservePx: 160,
    containerEl: null,
    chromeClass: '',
  },
);

const emit = defineEmits<{
  'update:size': [value: number];
  'update:open': [value: boolean];
}>();

const rootRef = ref<HTMLElement | null>(null);
const splitting = ref(false);
const autoHiding = ref(false);

const isVertical = computed(() => props.orientation === 'vertical');

const panelSize = computed(() => (props.open ? props.size : 0));

const transition = computed(() =>
  splitting.value ? { duration: 0 } : SPLIT_SPRING,
);

const panelAnimate = computed(() =>
  isVertical.value
    ? {
        width: panelSize.value,
        minWidth: 0,
        opacity: props.open ? 1 : 0,
      }
    : {
        height: panelSize.value,
        minHeight: 0,
        opacity: props.open ? 1 : 0,
      },
);

const panelFixedStyle = computed(() =>
  isVertical.value
    ? { width: `${props.size}px` }
    : { height: `${props.size}px` },
);

function containerSize(): number | undefined {
  const el = props.containerEl ?? rootRef.value?.parentElement;
  if (!el) return undefined;
  return isVertical.value ? el.clientWidth : el.clientHeight;
}

function clamp(px: number): number {
  return clampSplitSize(
    px,
    props.min,
    props.max,
    containerSize(),
    props.reservePx,
  );
}

function setSize(px: number): void {
  emit('update:size', clamp(px));
}

function releasePointer(el: EventTarget | null, pointerId: number): void {
  if (!(el instanceof HTMLElement)) return;
  try {
    el.releasePointerCapture(pointerId);
  } catch {
    /* already released */
  }
}

let pointerId: number | null = null;
let startPos = 0;
let startSize = 0;
let autoHideTimer: ReturnType<typeof setTimeout> | undefined;

function endDrag(el: EventTarget | null): void {
  if (pointerId != null) {
    releasePointer(el, pointerId);
  }
  splitting.value = false;
  pointerId = null;
}

function triggerAutoHide(el: EventTarget | null): void {
  endDrag(el);
  emit('update:size', clamp(startSize));
  autoHiding.value = true;
  emit('update:open', false);
  clearTimeout(autoHideTimer);
  autoHideTimer = setTimeout(() => {
    autoHiding.value = false;
  }, SPLIT_AUTO_HIDE_ANIM_MS);
}

function deltaFromEvent(e: PointerEvent): number {
  if (isVertical.value) {
    // Dragging the handle right grows a start-side panel; left grows end-side.
    const dx = e.clientX - startPos;
    return props.side === 'start' ? dx : -dx;
  }
  // Dragging up grows an end-side (bottom) panel.
  const dy = startPos - e.clientY;
  return props.side === 'end' ? dy : -dy;
}

function onPointerDown(e: PointerEvent): void {
  if (autoHiding.value || !props.open || e.button !== 0) return;
  e.preventDefault();
  splitting.value = true;
  pointerId = e.pointerId;
  startPos = isVertical.value ? e.clientX : e.clientY;
  startSize = props.size;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent): void {
  if (autoHiding.value || !splitting.value || e.pointerId !== pointerId) {
    return;
  }
  const raw = startSize + deltaFromEvent(e);
  if (props.autoHide && raw < props.min - props.autoHideThreshold) {
    triggerAutoHide(e.currentTarget);
    return;
  }
  setSize(raw);
}

function onPointerUp(e: PointerEvent): void {
  if (autoHiding.value || e.pointerId !== pointerId) return;
  endDrag(e.currentTarget);
}

function onDblClick(): void {
  if (autoHiding.value || !props.open) return;
  setSize(props.defaultSize);
}

function shrinkKey(): string {
  if (isVertical.value) {
    return props.side === 'start' ? 'ArrowLeft' : 'ArrowRight';
  }
  return props.side === 'end' ? 'ArrowDown' : 'ArrowUp';
}

function growKey(): string {
  if (isVertical.value) {
    return props.side === 'start' ? 'ArrowRight' : 'ArrowLeft';
  }
  return props.side === 'end' ? 'ArrowUp' : 'ArrowDown';
}

function onKeydown(e: KeyboardEvent): void {
  if (autoHiding.value || !props.open) return;
  const step = e.shiftKey ? 32 : 12;
  if (e.key === growKey()) {
    e.preventDefault();
    setSize(props.size + step);
  } else if (e.key === shrinkKey()) {
    e.preventDefault();
    const next = props.size - step;
    if (props.autoHide && next < props.min - props.autoHideThreshold) {
      emit('update:size', clamp(props.size));
      emit('update:open', false);
      return;
    }
    setSize(next);
  } else if (e.key === 'Home') {
    e.preventDefault();
    setSize(props.max);
  } else if (e.key === 'End') {
    e.preventDefault();
    setSize(props.min);
  }
}

function reclamp(): void {
  emit('update:size', clamp(props.size));
}

watch(
  () => props.containerEl,
  () => reclamp(),
);

onMounted(() => {
  reclamp();
  window.addEventListener('resize', reclamp);
});

onUnmounted(() => {
  window.removeEventListener('resize', reclamp);
  clearTimeout(autoHideTimer);
});
</script>

<template>
  <div
    ref="rootRef"
    class="split-pane flex min-h-0 shrink-0"
    :class="isVertical ? 'flex-row' : 'flex-col'"
  >
    <template v-if="side === 'start'">
      <motion.div
        class="min-h-0 min-w-0 shrink-0 overflow-hidden"
        :class="isVertical ? 'h-full' : 'w-full'"
        :initial="false"
        :animate="panelAnimate"
        :transition="transition"
      >
        <div
          class="min-h-0 min-w-0 overflow-hidden"
          :class="isVertical ? 'h-full' : 'w-full'"
          role="region"
          :aria-label="panelLabel"
          :aria-hidden="!open"
          :style="panelFixedStyle"
        >
          <slot />
        </div>
      </motion.div>

      <SplitHandle
        :orientation="orientation"
        :open="open"
        :collapse-gap="collapseGap"
        :active="splitting"
        :value="size"
        :min="min"
        :max="max"
        :gap="gap"
        :label="resizeLabel"
        :transition="transition"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="onDblClick"
        @keydown="onKeydown"
      />
    </template>

    <template v-else>
      <SplitHandle
        :orientation="orientation"
        :open="open"
        :collapse-gap="collapseGap"
        :active="splitting"
        :value="size"
        :min="min"
        :max="max"
        :gap="gap"
        :label="resizeLabel"
        :transition="transition"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="onDblClick"
        @keydown="onKeydown"
      />

      <div
        class="flex min-h-0 min-w-0 shrink-0 overflow-hidden"
        :class="[isVertical ? 'flex-row' : 'flex-col', chromeClass]"
      >
        <motion.div
          class="min-h-0 min-w-0 overflow-hidden"
          :initial="false"
          :animate="panelAnimate"
          :transition="transition"
        >
          <div
            class="min-h-0 min-w-0 overflow-hidden"
            role="region"
            :aria-label="panelLabel"
            :aria-hidden="!open"
            :style="panelFixedStyle"
          >
            <slot />
          </div>
        </motion.div>

        <slot name="persistent" />
      </div>
    </template>
  </div>
</template>
