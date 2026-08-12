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
import type { TimelineClip, TimelineTrack } from '../../types/timeline';

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

  function nextSpeakerName(): string {
    speakerSeq += 1;
    return t('pages.generate.timeline.speakerName', { n: speakerSeq });
  }

  function seedData(): void {
    speakerSeq = 0;
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
        label: t('pages.generate.timeline.phraseLabel', { n: 1 }),
      },
      {
        id: uid('clip'),
        trackId: a.id,
        startSec: 5,
        durationSec: 2.5,
        label: t('pages.generate.timeline.phraseLabel', { n: 2 }),
      },
      {
        id: uid('clip'),
        trackId: b.id,
        startSec: 2,
        durationSec: 4,
        label: t('pages.generate.timeline.phraseLabel', { n: 3 }),
      },
      {
        id: uid('clip'),
        trackId: b.id,
        startSec: 8,
        durationSec: 3,
        label: t('pages.generate.timeline.phraseLabel', { n: 4 }),
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
  };
}

export type TimelineDocument = ReturnType<typeof useTimelineDocument>;
