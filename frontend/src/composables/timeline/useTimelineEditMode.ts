import { ref } from 'vue';
import type { TimelineEditMode } from '../../types/timeline';

export function useTimelineEditMode(
  initial: TimelineEditMode = 'select',
) {
  const editMode = ref<TimelineEditMode>(initial);

  function setEditMode(mode: TimelineEditMode): void {
    editMode.value = mode;
  }

  return {
    editMode,
    setEditMode,
  };
}

export type TimelineEditModeState = ReturnType<typeof useTimelineEditMode>;
