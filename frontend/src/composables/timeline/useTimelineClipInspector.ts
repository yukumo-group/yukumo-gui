import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import { Dialog } from '@varlet/ui';
import type { ComposerTranslation } from 'vue-i18n';
import { snapClipsEnabled } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import { clientToContentPoint, timeAtContentX } from './timelinePointer';
import {
  cloneSpeaker,
  isValidClipTimeSplit,
  splitIndexFromTime,
} from './clipModel';
import type { AquesTalkVersion } from '../../types/profile';
import type {
  TimelineClip,
  TimelineClipSpeaker,
  TimelineEditMode,
  TimelineTrack,
} from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';

export function useTimelineClipInspector(options: {
  t: ComposerTranslation;
  tracks: Ref<TimelineTrack[]>;
  clips: Ref<TimelineClip[]>;
  selection: TimelineSelection;
  lastAssignedSpeaker: Ref<TimelineClipSpeaker>;
  applySpeakerToClips: (
    ids: readonly string[],
    speaker: TimelineClipSpeaker,
  ) => void;
  setDefaultSpeaker: (speaker: TimelineClipSpeaker) => void;
  setClipText: (clipId: string, text: string) => void;
  splitClip: (
    clipId: string,
    atSec: number,
    textIndex: number,
  ) => TimelineClip | null;
  removeClips: (ids: readonly string[]) => void;
  setClipsMuted: (ids: readonly string[], muted: boolean) => void;
  setEditMode: (mode: TimelineEditMode) => void;
  lanesViewportRef: Ref<HTMLElement | null>;
  pxPerSec: Ref<number>;
  scrollXPx: Ref<number>;
  scrollYPx: Ref<number>;
  editMode: Ref<TimelineEditMode> | ComputedRef<TimelineEditMode>;
  isDragging: Ref<boolean> | ComputedRef<boolean>;
  isResizing: Ref<boolean> | ComputedRef<boolean>;
  isMarqueeActive: Ref<boolean> | ComputedRef<boolean>;
}) {
  const { t, selection } = options;

  const splitDraft = ref<{ clipId: string; atSec: number } | null>(null);
  const lastPointerTimeSec = ref<number | null>(null);
  const voiceDialogTarget = ref<'clips' | 'default'>('clips');
  const voiceDialogShow = ref(false);
  const contentDialogShow = ref(false);

  const selectedClips = computed(() => {
    const ids = selection.selectedClipIdSet.value;
    return options.clips.value.filter((clip) => ids.has(clip.id));
  });

  const firstSelectedClip = computed(() => selectedClips.value[0] ?? null);

  const voiceEngine = computed<AquesTalkVersion>(() => {
    if (voiceDialogTarget.value === 'default') {
      return options.tracks.value[0]?.engine ?? 2;
    }
    const clip = firstSelectedClip.value;
    if (!clip) return options.tracks.value[0]?.engine ?? 2;
    return (
      options.tracks.value.find((track) => track.id === clip.trackId)?.engine ??
      2
    );
  });

  const voiceSpeaker = computed<TimelineClipSpeaker>(() => {
    if (voiceDialogTarget.value === 'default') {
      return cloneSpeaker(options.lastAssignedSpeaker.value);
    }
    return firstSelectedClip.value
      ? cloneSpeaker(firstSelectedClip.value.speaker)
      : cloneSpeaker(options.lastAssignedSpeaker.value);
  });

  const voiceDialogTitle = computed(() =>
    voiceDialogTarget.value === 'default'
      ? t('pages.generate.timeline.defaultSpeakerDialogTitle')
      : t('pages.generate.timeline.voiceDialogTitle'),
  );

  function pointerTimeAtClient(clientX: number): number | null {
    const el = options.lanesViewportRef.value;
    if (!el) return null;
    const point = clientToContentPoint(
      el,
      clientX,
      0,
      options.scrollXPx.value,
      options.scrollYPx.value,
    );
    const raw = timeAtContentX(point.contentX, options.pxPerSec.value);
    return snapClipsEnabled.value
      ? snapTimeToRuler(raw, options.pxPerSec.value)
      : raw;
  }

  function rememberPointerSplitTime(clientX: number): void {
    const timeSec = pointerTimeAtClient(clientX);
    if (timeSec === null) return;
    const ids = selection.selectedClipIdSet.value;
    if (ids.size !== 1) return;
    const clip = options.clips.value.find((item) => ids.has(item.id));
    if (!clip) return;
    if (timeSec <= clip.startSec || timeSec >= clip.startSec + clip.durationSec) {
      return;
    }
    lastPointerTimeSec.value = timeSec;
  }

  function onSplitRequest(clipId: string, timeSec: number): void {
    const clip = options.clips.value.find((item) => item.id === clipId);
    if (!clip || clip.text.length <= 1) return;
    splitDraft.value = { clipId, atSec: timeSec };
  }

  watch(selection.selectedClipIds, () => {
    lastPointerTimeSec.value = null;
  });

  const canToolbarSplit = computed(() => {
    if (selectedClips.value.length !== 1) return false;
    const clip = firstSelectedClip.value;
    const at = lastPointerTimeSec.value;
    if (!clip || at === null || clip.text.length <= 1) return false;
    return isValidClipTimeSplit(clip.startSec, clip.durationSec, at);
  });

  const showClipToolbar = computed(
    () =>
      options.editMode.value === 'select' &&
      selectedClips.value.length > 0 &&
      !options.isDragging.value &&
      !options.isResizing.value &&
      !options.isMarqueeActive.value,
  );

  const splitDialogShow = computed({
    get: () => splitDraft.value !== null,
    set: (value: boolean) => {
      if (!value) splitDraft.value = null;
    },
  });

  const splitDialogClip = computed(() => {
    const draft = splitDraft.value;
    if (!draft) return null;
    return options.clips.value.find((clip) => clip.id === draft.clipId) ?? null;
  });

  const splitDialogText = computed(() => splitDialogClip.value?.text ?? '');

  const splitDialogInitialIndex = computed(() => {
    const draft = splitDraft.value;
    const clip = splitDialogClip.value;
    if (!draft || !clip) return 1;
    return splitIndexFromTime(
      clip.startSec,
      clip.durationSec,
      clip.text.length,
      draft.atSec,
    );
  });

  let deleteConfirmPending = false;

  async function requestRemoveClips(ids: readonly string[]): Promise<void> {
    if (ids.length === 0 || deleteConfirmPending) return;
    deleteConfirmPending = true;
    try {
      const result = await Dialog({
        title: t('pages.generate.timeline.deleteConfirmTitle'),
        message: t('pages.generate.timeline.deleteConfirmMessage', {
          n: ids.length,
        }),
        confirmButtonText: t('pages.generate.timeline.deleteConfirm'),
        cancelButtonText: t('pages.generate.timeline.deleteCancel'),
        confirmButtonProps: { type: 'danger' },
      });
      if (result !== 'confirm') return;
      const idSet = new Set(ids);
      options.removeClips(ids);
      selection.setSelection(
        selection.selectedClipIds.value.filter((id) => !idSet.has(id)),
      );
    } finally {
      deleteConfirmPending = false;
    }
  }

  function deleteSelection(): boolean {
    const ids = selection.selectedClipIds.value;
    if (ids.length === 0) return false;
    void requestRemoveClips(ids);
    return true;
  }

  function openDefaultSpeakerDialog(): void {
    voiceDialogTarget.value = 'default';
    voiceDialogShow.value = true;
  }

  function openClipVoiceDialog(): void {
    voiceDialogTarget.value = 'clips';
    voiceDialogShow.value = true;
  }

  function onToolbarSplit(): void {
    const clip = firstSelectedClip.value;
    const at = lastPointerTimeSec.value;
    if (!clip || at === null || !canToolbarSplit.value) return;
    onSplitRequest(clip.id, at);
  }

  function onToolbarMute(): void {
    const ids = selection.selectedClipIds.value;
    const allMuted =
      selectedClips.value.length > 0 &&
      selectedClips.value.every((clip) => clip.muted);
    options.setClipsMuted(ids, !allMuted);
  }

  function onVoiceConfirm(speaker: TimelineClipSpeaker): void {
    if (voiceDialogTarget.value === 'default') {
      options.setDefaultSpeaker(speaker);
      return;
    }
    options.applySpeakerToClips(selection.selectedClipIds.value, speaker);
  }

  function onContentConfirm(text: string): void {
    const clip = firstSelectedClip.value;
    if (!clip) return;
    options.setClipText(clip.id, text);
  }

  function onSplitConfirm(index: number): void {
    const draft = splitDraft.value;
    if (!draft) return;
    const right = options.splitClip(draft.clipId, draft.atSec, index);
    if (right) {
      selection.setSelection([draft.clipId, right.id]);
      options.setEditMode('select');
    }
  }

  function onClipUpdateText(clipId: string, text: string): void {
    options.setClipText(clipId, text);
  }

  return {
    selectedClips,
    firstSelectedClip,
    rememberPointerSplitTime,
    onSplitRequest,
    canToolbarSplit,
    showClipToolbar,
    voiceDialogShow,
    contentDialogShow,
    voiceEngine,
    voiceSpeaker,
    voiceDialogTitle,
    splitDialogShow,
    splitDialogText,
    splitDialogInitialIndex,
    requestRemoveClips,
    deleteSelection,
    openDefaultSpeakerDialog,
    openClipVoiceDialog,
    onToolbarSplit,
    onToolbarMute,
    onVoiceConfirm,
    onContentConfirm,
    onSplitConfirm,
    onClipUpdateText,
  };
}
