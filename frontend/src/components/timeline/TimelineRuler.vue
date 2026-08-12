<script setup lang="ts">
import { computed } from 'vue';
import { pickRulerStep } from '../../composables/timelineGrid';

const props = defineProps<{
  pxPerSec: number;
  scrollXPx: number;
  viewportWidthPx: number;
  contentDurationSec: number;
}>();

const emit = defineEmits<{
  seek: [timeSec: number];
  scrubStart: [event: PointerEvent];
  scrubMove: [event: PointerEvent];
  scrubEnd: [event: PointerEvent];
}>();

interface Tick {
  sec: number;
  x: number;
  major: boolean;
  label: string;
}

function formatLabel(sec: number): string {
  const totalMs = Math.round(Math.max(0, sec) * 1000);
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${m}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
}

const ticks = computed((): Tick[] => {
  const { major, minor } = pickRulerStep(props.pxPerSec);
  const startSec = Math.max(0, props.scrollXPx / props.pxPerSec);
  const endSec = Math.min(
    props.contentDurationSec,
    (props.scrollXPx + props.viewportWidthPx) / props.pxPerSec,
  );
  const first = Math.floor(startSec / minor) * minor;
  const result: Tick[] = [];
  const eps = minor * 1e-6;
  for (let sec = first; sec <= endSec + minor; sec += minor) {
    const rounded = Math.round(sec / minor) * minor;
    if (rounded < -eps || rounded > props.contentDurationSec + eps) continue;
    const clamped = Math.max(0, Math.min(props.contentDurationSec, rounded));
    const x = clamped * props.pxPerSec - props.scrollXPx;
    const rem = Math.abs(((clamped + eps) % major + major) % major);
    const isMajor = rem < eps * 10 || Math.abs(rem - major) < eps * 10;
    result.push({
      sec: clamped,
      x,
      major: isMajor,
      label: isMajor ? formatLabel(clamped) : '',
    });
  }
  return result;
});

let seeking = false;

function timeFromClientX(clientX: number, target: HTMLElement): number {
  const rect = target.getBoundingClientRect();
  const localX = clientX - rect.left;
  return (props.scrollXPx + localX) / props.pxPerSec;
}

function onPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return;
  e.preventDefault();
  seeking = true;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  emit('scrubStart', e);
  emit('seek', timeFromClientX(e.clientX, e.currentTarget as HTMLElement));
}

function onPointerMove(e: PointerEvent): void {
  if (!seeking) return;
  emit('scrubMove', e);
  emit('seek', timeFromClientX(e.clientX, e.currentTarget as HTMLElement));
}

function onPointerUp(e: PointerEvent): void {
  if (!seeking) return;
  seeking = false;
  emit('scrubEnd', e);
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
}

/** Re-seek from a known clientX after auto-scroll (parent-driven). */
function seekFromClientX(clientX: number, el: HTMLElement): void {
  emit('seek', timeFromClientX(clientX, el));
}

defineExpose({ seekFromClientX });
</script>

<template>
  <div
    class="relative h-7 shrink-0 cursor-default select-none overflow-hidden border-b border-outline/30 bg-surface-container-high"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      v-for="(tick, i) in ticks"
      :key="`${tick.sec}-${i}`"
      class="absolute top-0"
      :style="{ left: `${tick.x}px` }"
    >
      <div
        class="w-px bg-outline"
        :class="tick.major ? 'h-3' : 'h-1.5 opacity-50'"
      />
      <span
        v-if="tick.major"
        class="absolute top-3 left-1 whitespace-nowrap font-mono text-[10px] text-on-surface-variant leading-none"
      >
        {{ tick.label }}
      </span>
    </div>
  </div>
</template>
