import { computed, ref } from 'vue';
import type { TimelineEditMode } from '../../types/timeline';

export function useTimelineEditMode(
  initial: TimelineEditMode = 'select',
) {
  const stickyEditMode = ref<TimelineEditMode>(initial);
  const overlayStack = ref<TimelineEditMode[]>([]);

  const editMode = computed({
    get: (): TimelineEditMode =>
      overlayStack.value.at(-1) ?? stickyEditMode.value,
    set: (mode: TimelineEditMode) => {
      stickyEditMode.value = mode;
    },
  });

  function setEditMode(mode: TimelineEditMode): void {
    stickyEditMode.value = mode;
  }

  function pushOverlay(mode: TimelineEditMode): void {
    overlayStack.value = [
      ...overlayStack.value.filter((item) => item !== mode),
      mode,
    ];
  }

  function popOverlay(mode: TimelineEditMode): void {
    overlayStack.value = overlayStack.value.filter((item) => item !== mode);
  }

  function clearOverlays(): void {
    overlayStack.value = [];
  }

  return {
    editMode,
    stickyEditMode,
    setEditMode,
    pushOverlay,
    popOverlay,
    clearOverlays,
  };
}

export type TimelineEditModeState = ReturnType<typeof useTimelineEditMode>;
