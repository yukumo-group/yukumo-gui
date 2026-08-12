import { computed, ref, watch } from 'vue';
import type { ComposerTranslation } from 'vue-i18n';
import {
  setTimelineContentBound,
  setTimelineLoopEnd,
  timelineContentBoundSec,
  timelineContentDurationSec,
  timelinePlayback,
} from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import {
  TIMELINE_CLIP_MIN_DURATION_SEC,
  type TimelineClip,
  type TimelineTrack,
} from '../../types/timeline';

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function createTrack(name: string): TimelineTrack {
  return {
    id: uid('track'),
    name,
    muted: false,
    solo: false,
    volume: 0.75,
    pan: 0,
  };
}

export function useTimelineDocument(t: ComposerTranslation) {
  const tracks = ref<TimelineTrack[]>([]);
  const clips = ref<TimelineClip[]>([]);
  let speakerSeq = 0;
  let phraseSeq = 0;

  function nextSpeakerName(): string {
    speakerSeq += 1;
    return t('pages.generate.timeline.speakerName', { n: speakerSeq });
  }

  function nextPhraseLabel(): string {
    phraseSeq += 1;
    return t('pages.generate.timeline.phraseLabel', { n: phraseSeq });
  }

  function seedData(): void {
    speakerSeq = 0;
    phraseSeq = 0;
    tracks.value = [
      createTrack(nextSpeakerName()),
      createTrack(nextSpeakerName()),
    ];
    const [a, b] = tracks.value;
    clips.value = [
      {
        id: uid('clip'),
        trackId: a.id,
        startSec: 0.5,
        durationSec: 3.5,
        label: nextPhraseLabel(),
      },
      {
        id: uid('clip'),
        trackId: a.id,
        startSec: 5,
        durationSec: 2.5,
        label: nextPhraseLabel(),
      },
      {
        id: uid('clip'),
        trackId: b.id,
        startSec: 2,
        durationSec: 4,
        label: nextPhraseLabel(),
      },
      {
        id: uid('clip'),
        trackId: b.id,
        startSec: 8,
        durationSec: 3,
        label: nextPhraseLabel(),
      },
    ];
  }

  seedData();

  const trackCount = computed(() => tracks.value.length);

  const lastClipEndSec = computed(() => {
    let maxEnd = 0;
    for (const clip of clips.value) {
      maxEnd = Math.max(maxEnd, clip.startSec + clip.durationSec);
    }
    return maxEnd;
  });

  function syncContentBound(): void {
    setTimelineContentBound(
      Math.max(lastClipEndSec.value, timelinePlayback.currentTimeSec.value),
    );
  }

  watch(
    [clips, () => timelinePlayback.currentTimeSec.value],
    () => {
      syncContentBound();
    },
    { deep: true, immediate: true },
  );

  watch(
    lastClipEndSec,
    (sec) => {
      setTimelineLoopEnd(sec);
    },
    { immediate: true },
  );

  const anySolo = computed(() => tracks.value.some((tr) => tr.solo));

  function isTrackDimmed(track: TimelineTrack): boolean {
    if (track.muted) return true;
    if (anySolo.value && !track.solo) return true;
    return false;
  }

  function clipsForTrack(trackId: string): TimelineClip[] {
    return clips.value.filter((c) => c.trackId === trackId);
  }

  function clipAriaLabel(clip: TimelineClip): string {
    return t('pages.generate.timeline.clipAriaLabel', {
      label: clip.label,
      start: clip.startSec.toFixed(1),
    });
  }

  function addTrack(): void {
    tracks.value.push(createTrack(nextSpeakerName()));
  }

  function toggleMute(trackId: string): void {
    const track = tracks.value.find((tr) => tr.id === trackId);
    if (track) track.muted = !track.muted;
  }

  function toggleSolo(trackId: string): void {
    const track = tracks.value.find((tr) => tr.id === trackId);
    if (track) track.solo = !track.solo;
  }

  function setVolume(trackId: string, value: number): void {
    const track = tracks.value.find((tr) => tr.id === trackId);
    if (track) track.volume = value;
  }

  function setPan(trackId: string, value: number): void {
    const track = tracks.value.find((tr) => tr.id === trackId);
    if (track) track.pan = value;
  }

  function applyClipPlacements(
    next: Map<string, { startSec: number; trackId: string }>,
    pxPerSec: number,
    snap: boolean,
  ): void {
    for (const clip of clips.value) {
      const placement = next.get(clip.id);
      if (!placement) continue;
      clip.startSec = snap
        ? snapTimeToRuler(placement.startSec, pxPerSec)
        : Math.max(0, placement.startSec);
      clip.trackId = placement.trackId;
    }
  }

  function applyClipRanges(
    next: Map<string, { startSec: number; durationSec: number }>,
    pxPerSec: number,
    snap: boolean,
  ): void {
    for (const clip of clips.value) {
      const range = next.get(clip.id);
      if (!range) continue;
      clip.startSec = snap
        ? snapTimeToRuler(range.startSec, pxPerSec)
        : Math.max(0, range.startSec);
      clip.durationSec = Math.max(0, range.durationSec);
    }
  }

  function addClip(
    trackId: string,
    startSec: number,
    durationSec: number,
  ): TimelineClip | null {
    if (!tracks.value.some((track) => track.id === trackId)) return null;
    if (durationSec < TIMELINE_CLIP_MIN_DURATION_SEC) return null;
    const clip: TimelineClip = {
      id: uid('clip'),
      trackId,
      startSec: Math.max(0, startSec),
      durationSec,
      label: nextPhraseLabel(),
    };
    clips.value.push(clip);
    return clip;
  }

  function removeClips(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    clips.value = clips.value.filter((clip) => !idSet.has(clip.id));
  }

  function splitClip(clipId: string, atSec: number): TimelineClip | null {
    const clip = clips.value.find((c) => c.id === clipId);
    if (!clip) return null;
    const leftDuration = atSec - clip.startSec;
    const rightDuration = clip.durationSec - leftDuration;
    if (
      leftDuration < TIMELINE_CLIP_MIN_DURATION_SEC ||
      rightDuration < TIMELINE_CLIP_MIN_DURATION_SEC
    ) {
      return null;
    }
    clip.durationSec = leftDuration;
    const right: TimelineClip = {
      id: uid('clip'),
      trackId: clip.trackId,
      startSec: atSec,
      durationSec: rightDuration,
      label: nextPhraseLabel(),
    };
    clips.value.push(right);
    return right;
  }

  function insertClips(
    entries: Array<{
      trackId: string;
      startSec: number;
      durationSec: number;
      label: string;
    }>,
  ): TimelineClip[] {
    const created: TimelineClip[] = [];
    for (const entry of entries) {
      if (!tracks.value.some((track) => track.id === entry.trackId)) continue;
      if (entry.durationSec < TIMELINE_CLIP_MIN_DURATION_SEC) continue;
      created.push({
        id: uid('clip'),
        trackId: entry.trackId,
        startSec: Math.max(0, entry.startSec),
        durationSec: entry.durationSec,
        label: entry.label,
      });
    }
    if (created.length > 0) {
      clips.value = [...clips.value, ...created];
    }
    return created;
  }

  return {
    tracks,
    clips,
    trackCount,
    contentDurationSec: timelineContentDurationSec,
    contentBoundSec: timelineContentBoundSec,
    isTrackDimmed,
    clipsForTrack,
    clipAriaLabel,
    addTrack,
    toggleMute,
    toggleSolo,
    setVolume,
    setPan,
    applyClipPlacements,
    applyClipRanges,
    addClip,
    removeClips,
    splitClip,
    insertClips,
  };
}

export type TimelineDocument = ReturnType<typeof useTimelineDocument>;
