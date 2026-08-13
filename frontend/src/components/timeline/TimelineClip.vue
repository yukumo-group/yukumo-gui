<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { User } from '@lucide/vue';
import type { TimelineClip, TimelineEditMode } from '../../types/timeline';
import { TIMELINE_CLIP_RESIZE_HANDLE_PX } from '../../types/timeline';
import { CUSTOM_PROFILE_ID } from '../../types/profile';
import type { ClipResizeEdge } from '../../composables/timeline/useTimelineClipResize';
import { characterProfiles } from '../../composables/useCharacterProfiles';
import {
  CLIP_COLOR_BODY,
  CLIP_COLOR_HANDLE,
  CLIP_COLOR_HANDLE_DIM,
} from '../../composables/timeline/clipAppearance';
import { formatClipLevels } from '../../composables/timeline/clipModel';

const props = defineProps<{
  clip: TimelineClip;
  pxPerSec: number;
  selected: boolean;
  dimmed: boolean;
  blocked: boolean;
  inline: boolean;
  editMode: TimelineEditMode;
  ariaLabel: string;
}>();

const emit = defineEmits<{
  pointerDown: [event: PointerEvent];
  resizePointerDown: [edge: ClipResizeEdge, event: PointerEvent];
  dblclick: [];
  updateText: [text: string];
}>();

const { t } = useI18n();

const hovered = ref(false);
const hoveredEdge = ref<ClipResizeEdge | null>(null);
const resizingEdge = ref<ClipResizeEdge | null>(null);
const editing = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const profile = computed(() => {
  const id = props.clip.speaker.profileId;
  if (!id || id === CUSTOM_PROFILE_ID) return null;
  return characterProfiles.value.find((item) => item.id === id) ?? null;
});

const avatarUrl = computed(() => profile.value?.imageDataUrl ?? null);

const displayText = computed(
  () => props.clip.text.trim() || t('pages.generate.timeline.emptyClip'),
);

const levelsText = computed(() =>
  formatClipLevels(props.clip.volume, props.clip.pan),
);

const showHandles = computed(
  () =>
    props.editMode === 'select' &&
    !editing.value &&
    (props.selected || hovered.value || resizingEdge.value !== null),
);

const bodyCursorClass = computed(() => {
  if (editing.value) return 'cursor-text';
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
  return highlighted
    ? CLIP_COLOR_HANDLE[props.clip.color]
    : CLIP_COLOR_HANDLE_DIM[props.clip.color];
}

function onBodyPointerDown(e: PointerEvent): void {
  if (editing.value) return;
  if (e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  emit('pointerDown', e);
}

function startInlineEdit(): void {
  if (props.editMode !== 'select') return;
  editing.value = true;
  draft.value = props.clip.text;
  void nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function onDblClick(e: MouseEvent): void {
  if (props.editMode !== 'select') return;
  e.preventDefault();
  e.stopPropagation();
  emit('dblclick');
  startInlineEdit();
}

function commitEdit(): void {
  if (!editing.value) return;
  editing.value = false;
  emit('updateText', draft.value);
}

function cancelEdit(): void {
  editing.value = false;
  draft.value = props.clip.text;
}

function onEditKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    commitEdit();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
}

watch(
  () => props.editMode,
  (mode) => {
    if (mode !== 'select' && editing.value) {
      cancelEdit();
    }
  },
);

function clearResizing(): void {
  resizingEdge.value = null;
  window.removeEventListener('pointerup', clearResizing);
  window.removeEventListener('pointercancel', clearResizing);
}

function onResizePointerDown(edge: ClipResizeEdge, e: PointerEvent): void {
  if (props.editMode !== 'select' || editing.value) return;
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
          : ['border', CLIP_COLOR_BODY[clip.color]],
      selected && !blocked
        ? 'ring-2 ring-primary ring-offset-1 ring-offset-body'
        : '',
      (dimmed || clip.muted) && !blocked ? 'opacity-40' : '',
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
    @dblclick="onDblClick"
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
      v-if="editMode === 'select' && !editing"
      class="absolute inset-y-0 left-0 z-10 cursor-ew-resize"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
      @pointerenter="hoveredEdge = 'left'"
      @pointerleave="hoveredEdge = null"
      @pointerdown="onResizePointerDown('left', $event)"
      @dblclick.stop
    />
    <div
      v-if="editMode === 'select' && !editing"
      class="absolute inset-y-0 right-0 z-10 cursor-ew-resize"
      :style="{ width: `${TIMELINE_CLIP_RESIZE_HANDLE_PX}px` }"
      @pointerenter="hoveredEdge = 'right'"
      @pointerleave="hoveredEdge = null"
      @pointerdown="onResizePointerDown('right', $event)"
      @dblclick.stop
    />

    <div
      class="relative z-0 flex h-full min-w-0 flex-col"
      :style="{
        paddingLeft: `${TIMELINE_CLIP_RESIZE_HANDLE_PX + 2}px`,
        paddingRight: `${TIMELINE_CLIP_RESIZE_HANDLE_PX + 2}px`,
      }"
    >
      <div class="flex min-w-0 items-center gap-1.5 pt-0.5">
        <div
          class="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-on-surface-variant"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            class="size-full object-cover"
          />
          <User
            v-else
            :size="16"
            aria-hidden="true"
          />
        </div>
        <input
          v-if="editing"
          ref="inputRef"
          v-model="draft"
          class="min-w-0 flex-1 bg-transparent py-0 text-sm text-text outline-none"
          :aria-label="t('pages.generate.timeline.clipEditText')"
          @pointerdown.stop
          @keydown="onEditKeydown"
          @blur="commitEdit"
        />
        <span
          v-else
          class="min-w-0 flex-1 truncate py-0.5 leading-tight text-md"
          :class="
            blocked
              ? 'text-on-danger'
              : clip.text.trim()
                ? 'text-text'
                : 'text-on-surface-variant'
          "
        >
          {{ displayText }}
        </span>
      </div>
      <div
        v-if="!inline"
        class="mt-auto pb-0.5 text-right font-mono text-[10px] leading-none text-on-surface-variant"
      >
        {{ levelsText }}
      </div>
    </div>
  </div>
</template>
