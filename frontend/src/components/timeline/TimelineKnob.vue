<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    size?: number;
    ariaLabel: string;
    /**
     * Bipolar mapping: 0 sits at center (0deg),
     * negative → left (−180), positive → right (+180).
     */
    offset?: boolean;
  }>(),
  {
    min: 0,
    max: 1,
    size: 28,
    offset: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const CX = 50;
const CY = 50;
const OUTER_R = 46;
const BODY_R = 36;
const LINE_R = 32;

const pressed = ref(false);

/** CSS-like angles: 0 = up, positive clockwise. */
function polar(deg: number, radius: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + Math.sin(rad) * radius,
    y: CY - Math.cos(rad) * radius,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

const angleDeg = computed(() => {
  if (props.offset) {
    const span = Math.max(Math.abs(props.min), Math.abs(props.max)) || 1;
    return clamp((props.modelValue / span) * 180, -180, 180);
  }
  const t = (props.modelValue - props.min) / (props.max - props.min || 1);
  return -180 + clamp(t, 0, 1) * 360;
});

function describeArc(fromDeg: number, toDeg: number, radius: number): string {
  let delta = toDeg - fromDeg;
  while (delta > 360) delta -= 360;
  while (delta <= -360) delta += 360;

  if (Math.abs(delta) < 0.001) {
    return '';
  }

  if (Math.abs(delta) >= 359.9) {
    const a = polar(fromDeg, radius);
    const mid = polar(fromDeg + Math.sign(delta) * 180, radius);
    const b = polar(fromDeg + Math.sign(delta) * 359.9, radius);
    return [
      `M ${a.x} ${a.y}`,
      `A ${radius} ${radius} 0 1 1 ${mid.x} ${mid.y}`,
      `A ${radius} ${radius} 0 1 1 ${b.x} ${b.y}`,
    ].join(' ');
  }

  const start = polar(fromDeg, radius);
  const end = polar(toDeg, radius);
  const absDelta = Math.abs(delta);
  const largeArc = absDelta > 180 ? 1 : 0;
  const sweep = delta >= 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

const trackArcPath = computed(() => describeArc(-180, 180, OUTER_R));

const valueArcPath = computed(() => {
  if (props.offset) {
    const a = angleDeg.value;
    if (Math.abs(a) < 0.001) return '';
    return describeArc(0, a, OUTER_R);
  }
  return describeArc(-180, angleDeg.value, OUTER_R);
});

const lineEnd = computed(() => polar(angleDeg.value, LINE_R));

let dragging = false;
let lastY = 0;

function clampValue(v: number): number {
  return clamp(v, props.min, props.max);
}

function onPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  dragging = true;
  pressed.value = true;
  lastY = e.clientY;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent): void {
  if (!dragging) return;
  const dy = lastY - e.clientY;
  lastY = e.clientY;
  const range = props.max - props.min;
  emit('update:modelValue', clampValue(props.modelValue + (dy / 120) * range));
}

function onPointerUp(e: PointerEvent): void {
  dragging = false;
  pressed.value = false;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
}

function onDblClick(e: MouseEvent): void {
  e.stopPropagation();
  if (props.offset || props.min < 0) {
    emit('update:modelValue', 0);
    return;
  }
  emit('update:modelValue', 0.75);
}
</script>

<template>
  <button
    type="button"
    class="group relative inline-flex shrink-0 cursor-ns-resize items-center justify-center touch-none text-primary"
    :class="{ 'is-pressed': pressed }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-label="ariaLabel"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    role="slider"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dblclick="onDblClick"
  >
    <svg
      class="pointer-events-none size-full overflow-visible"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        v-if="trackArcPath"
        :d="trackArcPath"
        fill="none"
        class="stroke-outline/35"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path
        v-if="valueArcPath"
        :d="valueArcPath"
        fill="none"
        class="stroke-primary"
        stroke-width="5"
        stroke-linecap="round"
      />

      <g class="knob-inner origin-center transition-transform duration-150 ease-out">
        <circle
          :cx="CX"
          :cy="CY"
          :r="BODY_R"
          class="fill-surface-container-high"
        />
        <line
          :x1="CX"
          :y1="CY"
          :x2="lineEnd.x"
          :y2="lineEnd.y"
          class="stroke-primary"
          stroke-width="5"
          stroke-linecap="round"
        />
        <circle :cx="CX" :cy="CY" r="5" class="fill-outline" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.knob-inner {
  transform-box: view-box;
  transform-origin: 50px 50px;
  transform: scale(1);
}

.group:hover .knob-inner {
  transform: scale(0.9);
}

.group.is-pressed .knob-inner,
.group:active .knob-inner {
  transform: scale(0.8);
}
</style>
