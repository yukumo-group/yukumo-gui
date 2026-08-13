<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { GripVertical } from '@lucide/vue';
import type { TimelineTrack } from '../../types/timeline';
import {
  TIMELINE_COMPACT_HEIGHT_PX,
  TIMELINE_INLINE_LABEL_HEIGHT_PX,
} from '../../types/timeline';
import TimelineKnob from './TimelineKnob.vue';

const props = defineProps<{
  track: TimelineTrack;
  heightPx: number;
  dimmed: boolean;
  previewOffsetY: number;
  isDragging: boolean;
  reorderLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  soloLabel: string;
  unsoloLabel: string;
  volumeLabel: string;
  panLabel: string;
}>();

const emit = defineEmits<{
  toggleMute: [];
  toggleSolo: [];
  reorderStart: [event: PointerEvent];
  updateVolume: [value: number];
  updatePan: [value: number];
}>();

const showKnobs = computed(() => props.heightPx >= TIMELINE_COMPACT_HEIGHT_PX);
const inlineLabel = computed(
  () => props.heightPx < TIMELINE_INLINE_LABEL_HEIGHT_PX,
);
const showTopLabel = computed(() => !inlineLabel.value);
const compactControls = computed(() => !showKnobs.value);

const controlsRef = ref<HTMLElement | null>(null);
const rowRef = ref<HTMLElement | null>(null);
const iconSizePx = ref(56);

let resizeObserver: ResizeObserver | undefined;

function syncIconSize(): void {
  if (!showKnobs.value) {
    const row = rowRef.value;
    if (row) {
      const h = Math.round(row.getBoundingClientRect().height);
      if (h > 0) {
        iconSizePx.value = Math.max(18, h);
        return;
      }
    }
    iconSizePx.value = Math.max(18, props.heightPx - (showTopLabel.value ? 24 : 8));
    return;
  }

  const el = controlsRef.value;
  if (!el) return;
  const h = Math.round(el.getBoundingClientRect().height);
  if (h > 0) iconSizePx.value = h;
}

function bindObservers(): void {
  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => syncIconSize());
  if (controlsRef.value) resizeObserver.observe(controlsRef.value);
  if (rowRef.value) resizeObserver.observe(rowRef.value);
  syncIconSize();
}

onMounted(() => {
  nextTick(() => bindObservers());
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

watch([showKnobs, showTopLabel, inlineLabel, () => props.heightPx], () => {
  nextTick(() => bindObservers());
});
</script>

<template>
  <div
    class="relative flex shrink-0 flex-col border-b border-outline/20 py-1 pr-1.5 pl-5"
    :class="[
      dimmed ? 'opacity-40' : '',
      isDragging ? 'z-30 bg-surface-container-high shadow-md' : '',
    ]"
    :style="{
      height: `${heightPx}px`,
      transform: previewOffsetY ? `translateY(${previewOffsetY}px)` : undefined,
    }"
  >
    <button
      type="button"
      class="absolute inset-y-0 left-0 z-10 flex w-5 cursor-grab items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:cursor-grabbing"
      :aria-label="reorderLabel"
      @pointerdown.stop="emit('reorderStart', $event)"
    >
      <GripVertical
        :size="14"
        aria-hidden="true"
      />
    </button>

    <span
      v-if="showTopLabel"
      class="min-w-0 truncate pr-1 font-semibold text-text leading-tight"
      :class="showKnobs ? 'text-sm' : 'text-xs'"
      :title="track.name"
    >
      {{ track.name }}
    </span>

    <div
      ref="rowRef"
      class="flex min-h-0 flex-1 items-center gap-2"
    >
      <div
        class="shrink-0 rounded-lg border border-outline/40 bg-surface-container-high"
        :style="{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }"
        aria-hidden="true"
      />

      <span
        v-if="inlineLabel"
        class="min-w-0 flex-1 truncate pl-1 font-semibold text-text text-xs leading-tight"
        :title="track.name"
      >
        {{ track.name }}
      </span>
      <div
        v-else
        class="min-w-2 flex-1"
        aria-hidden="true"
      />

      <div
        ref="controlsRef"
        class="flex shrink-0 items-center gap-1.5"
      >
        <div
          v-if="showKnobs"
          class="flex flex-col items-center justify-center gap-1"
        >
          <TimelineKnob
            :model-value="track.volume"
            :min="0"
            :max="1"
            :size="26"
            :ariaLabel="volumeLabel"
            @update:model-value="emit('updateVolume', $event)"
          />
          <TimelineKnob
            :model-value="track.pan"
            :min="-1"
            :max="1"
            :size="26"
            offset
            :ariaLabel="panLabel"
            @update:model-value="emit('updatePan', $event)"
          />
        </div>

        <div
          class="flex items-center justify-center"
          :class="
            compactControls ? 'flex-row gap-0.5' : 'flex-col gap-0.5'
          "
        >
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-md font-bold hover:bg-surface-container-high"
            :class="[
              compactControls ? 'size-6 text-[11px]' : 'size-7 text-xs',
              track.muted
                ? 'bg-danger/15 text-danger'
                : 'text-on-surface-variant',
            ]"
            :aria-label="track.muted ? unmuteLabel : muteLabel"
            :aria-pressed="track.muted"
            @click.stop="emit('toggleMute')"
          >
            M
          </button>

          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-md font-bold hover:bg-surface-container-high"
            :class="[
              compactControls ? 'size-6 text-[11px]' : 'size-7 text-xs',
              track.solo
                ? 'bg-primary/20 text-primary'
                : 'text-on-surface-variant',
            ]"
            :aria-label="track.solo ? unsoloLabel : soloLabel"
            :aria-pressed="track.solo"
            @click.stop="emit('toggleSolo')"
          >
            S
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
