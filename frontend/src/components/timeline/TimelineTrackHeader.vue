<script setup lang="ts">
import { computed } from 'vue';
import { GripVertical } from '@lucide/vue';
import type { TimelineTrack } from '../../types/timeline';
import { TIMELINE_INLINE_LABEL_HEIGHT_PX } from '../../types/timeline';
import TimelineEngineSelect from './TimelineEngineSelect.vue';
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
  updateEngine: [value: TimelineTrack['engine']];
}>();

const inline = computed(() => props.heightPx < TIMELINE_INLINE_LABEL_HEIGHT_PX);
const knobSize = computed(() => (inline.value ? 22 : 24));
</script>

<template>
  <div
    class="relative flex shrink-0 border-b border-outline/20 py-1 pr-1.5 pl-5"
    :class="[
      inline ? 'flex-row items-center gap-1' : 'flex-col gap-0.5',
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

    <div
      class="flex min-w-0 items-center gap-1"
      :class="inline ? 'flex-1' : ''"
    >
      <TimelineEngineSelect
        v-show="!inline"
        class="mt-0.5 mr-1"
        :model-value="track.engine"
        @update:model-value="emit('updateEngine', $event)"
      />
      <span
        class="min-w-0 truncate font-semibold text-text leading-tight"
        :class="inline ? 'flex-1 text-xs' : 'text-md'"
        :title="track.name"
      >
        {{ track.name }}
      </span>
    </div>

    <div
      class="flex shrink-0 items-center"
      :class="inline ? '' : 'mt-auto justify-end'"
    >
      <TimelineKnob
        :model-value="track.volume"
        :min="0"
        :max="1"
        :size="knobSize"
        unit="db"
        :ariaLabel="volumeLabel"
        @update:model-value="emit('updateVolume', $event)"
      />
      <TimelineKnob
        :model-value="track.pan"
        :min="-1"
        :max="1"
        :size="knobSize"
        offset
        unit="percent"
        :ariaLabel="panLabel"
        class="ml-1.5 mr-0.5"
        @update:model-value="emit('updatePan', $event)"
      />
      <button
        type="button"
        class="inline-flex size-6 shrink-0 items-center justify-center rounded-md font-bold text-[11px] hover:bg-surface-container-high"
        :class="
          track.muted
            ? 'bg-danger/15 text-danger'
            : 'text-on-surface-variant'
        "
        :aria-label="track.muted ? unmuteLabel : muteLabel"
        :aria-pressed="track.muted"
        @click.stop="emit('toggleMute')"
      >
        M
      </button>
      <button
        type="button"
        class="inline-flex size-6 shrink-0 items-center justify-center rounded-md font-bold text-[11px] hover:bg-surface-container-high"
        :class="
          track.solo
            ? 'bg-primary/20 text-primary'
            : 'text-on-surface-variant'
        "
        :aria-label="track.solo ? unsoloLabel : soloLabel"
        :aria-pressed="track.solo"
        @click.stop="emit('toggleSolo')"
      >
        S
      </button>
    </div>
  </div>
</template>
