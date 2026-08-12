import { computed, ref } from 'vue';

export function useTimelineSelection() {
  const selectedClipIds = ref<string[]>([]);
  const selectedClipIdSet = computed(() => new Set(selectedClipIds.value));

  function clearSelection(): void {
    selectedClipIds.value = [];
  }

  function setSelection(ids: string[]): void {
    selectedClipIds.value = [...new Set(ids)];
  }

  function toggleClipInSelection(clipId: string): void {
    if (selectedClipIdSet.value.has(clipId)) {
      selectedClipIds.value = selectedClipIds.value.filter(
        (id) => id !== clipId,
      );
      return;
    }
    selectedClipIds.value = [...selectedClipIds.value, clipId];
  }

  return {
    selectedClipIds,
    selectedClipIdSet,
    clearSelection,
    setSelection,
    toggleClipInSelection,
  };
}

export type TimelineSelection = ReturnType<typeof useTimelineSelection>;
