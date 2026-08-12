import { onMounted, onUnmounted, ref } from 'vue';
import type { TimelineEditMode } from '../../types/timeline';

export function useTimelineEditMode(
  initial: TimelineEditMode = 'select',
) {
  const editMode = ref<TimelineEditMode>(initial);

  function setEditMode(mode: TimelineEditMode): void {
    editMode.value = mode;
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    if (editMode.value === 'select') return;
    editMode.value = 'select';
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
  });

  return {
    editMode,
    setEditMode,
  };
}

export type TimelineEditModeState = ReturnType<typeof useTimelineEditMode>;
