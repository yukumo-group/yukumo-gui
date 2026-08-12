<script setup lang="ts">
import { computed } from 'vue';
import { pickRulerStep } from '../../composables/timelineGrid';

const props = defineProps<{
  pxPerSec: number;
  contentDurationSec: number;
  heightPx: number;
}>();

interface Marker {
  sec: number;
  x: number;
  major: boolean;
}

const markers = computed((): Marker[] => {
  const { major, minor } = pickRulerStep(props.pxPerSec);
  const result: Marker[] = [];
  const eps = minor * 1e-6;
  const end = props.contentDurationSec;
  for (let sec = 0; sec <= end + minor; sec += minor) {
    const rounded = Math.round(sec / minor) * minor;
    if (rounded < -eps || rounded > end + eps) continue;
    const clamped = Math.max(0, Math.min(end, rounded));
    const rem = Math.abs(((clamped + eps) % major + major) % major);
    const isMajor = rem < eps * 10 || Math.abs(rem - major) < eps * 10;
    result.push({
      sec: clamped,
      x: clamped * props.pxPerSec,
      major: isMajor,
    });
  }
  return result;
});
</script>

<template>
  <div
    class="pointer-events-none absolute top-0 left-0 z-0"
    :style="{ width: `${contentDurationSec * pxPerSec}px`, height: `${heightPx}px` }"
    aria-hidden="true"
  >
    <div
      v-for="(m, i) in markers"
      :key="`${m.sec}-${i}`"
      class="absolute top-0 bottom-0 w-px"
      :class="m.major ? 'bg-outline/35' : 'bg-outline/15'"
      :style="{ left: `${m.x}px` }"
    />
  </div>
</template>
