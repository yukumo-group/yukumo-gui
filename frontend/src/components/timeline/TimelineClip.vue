<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type { TimelineClip, TimelineEditMode } from '../../types/timeline';
import { TIMELINE_CLIP_RESIZE_HANDLE_PX } from '../../types/timeline';
import type { ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';

const props = defineProps<{
  clip: TimelineClip;
  pxPerSec: number;
  selected: boolean;
  dimmed: boolean;
  blocked: boolean;
  editMode: TimelineEditMode;
  ariaLabel: string;
}>();

const emit = defineEmits<{
  pointerDown: [event: PointerEvent];
  resizePointerDown: [edge: ClipResizeEdge, event: PointerEvent];
}>();

const hovered = ref(false);
const hoveredEdge = ref<ClipResizeEdge | null>(null);
const resizingEdge = ref<ClipResizeEdge | null>(null);

const showHandles = computed(
  () =>
    props.editMode === 'select' &&
    (props.selected || hovered.value || resizingEdge.value !== null),
);

const bodyCursorClass = computed(() => {
  switch (props.editMode) {
    case 'add':
      return 'cursor-not-allowed';
    case 'delete':
      return 'cursor-pointer';
    case 'split':
      return 'cursor-col-resize';
    default:
      return 'cursor-grab active:cursor-grabbing';
  }
});

function handleClass(edge: ClipResizeEdge): string {
  const highlighted =
    hoveredEdge.value === edge || resizingEdge.value === edge;
  if (props.blocked) {
    return highlighted ? 'bg-on-danger' : 'bg-on-danger/50';
  }
  return highlighted ? 'bg-primary' : 'bg-primary/45';
}

function onBodyPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  emit('pointerDown', e);
}

function clearResizing(): void {
  resizingEdge.value = null;
  window.removeEventListener('pointerup', clearResizing);
  window.removeEventListener('pointercancel', clearResizing);
}

function onResizePointerDown(edge: ClipResizeEdge, e: PointerEvent): void {
  if (props.editMode !== 'select') return;
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  resizingEdge.value = edge;
  window.addEventListener('pointerup', clearResizing);
  window.addEventListener('pointercancel', clearResizing);
  emit('resizePointerDown', edge, e);
}

onUnmounted(clearResizing);
</script>

<template>
  <div
    class="absolute top-1 bottom-1 overflow-hidden rounded-md"
    :class="[
      bodyCursorClass,
      blocked
        ? 'border border-danger bg-danger/80'
        : editMode === 'delete' && hovered
          ? 'border border-danger bg-danger/40'
          : 'border border-primary/40 bg-primary/25',
      selected && !blocked
        ? 'ring-2 ring-primary ring-offset-1 ring-offset-body'
        : '',
      dimmed && !blocked ? 'opacity-40' : '',
    ]"
    :style="{
      left: `${clip.startSec * pxPerSec}px`,
      width: `${Math.max(TIMELINE_CLIP_RESIZE_HANDLE_PX * 2, clip.durationSec * pxPerSec)}px`,
    }"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    :aria-pressed="selected"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @pointerdown="onBodyPointerDown"
  >
    <div
      class="pointer-events-none absolute inset-y-0 left-0 transition-opacity"
      :class="[handleClass('left'), showHandles ? 'opacity-100' : 'opacity-0']"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
    />
    <div
      class="pointer-events-none absolute inset-y-0 right-0 transition-opacity"
      :class="[handleClass('right'), showHandles ? 'opacity-100' : 'opacity-0']"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
    />

    <div
      v-if="editMode === 'select'"
      class="absolute inset-y-0 left-0 z-10 cursor-ew-resize"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
      @pointerenter="hoveredEdge = 'left'"
      @pointerleave="hoveredEdge = null"
      @pointerdown="onResizePointerDown('left', $event)"
    />
    <div
      v-if="editMode === 'select'"
      class="absolute inset-y-0 right-0 z-10 cursor-ew-resize"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
      @pointerenter="hoveredEdge = 'right'"
      @pointerleave="hoveredEdge = null"
      @pointerdown="onResizePointerDown('right', $event)"
    />

    <span
      class="pointer-events-none block truncate py-1 leading-tight text-xs"
      :class="blocked ? 'text-on-danger' : 'text-text'"
      :style="{
        paddingLeft: `${TIMELINE_CLIP_RESIZE_HANDLE_PX + 2}px`,
        paddingRight: `${TIMELINE_CLIP_RESIZE_HANDLE_PX + 2}px`,
      }"
    >
      {{ clip.label }}
    </span>
  </div>
</template>
