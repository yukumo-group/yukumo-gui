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
import type { AquesTalkVersion } from '../../types/profile';
import {
  TIMELINE_CLIP_MIN_DURATION_SEC,
  type TimelineClip,
  type TimelineClipColor,
  type TimelineClipInsert,
  type TimelineClipSpeaker,
  type TimelineTrack,
} from '../../types/timeline';
import { characterProfiles } from '../useCharacterProfiles';
import {
  clipPayload,
  cloneSpeaker,
  createClipDefaults,
  createDefaultSpeaker,
  speakerSupportsEngine,
} from './clipModel';

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function createTrack(name: string, engine: AquesTalkVersion = 2): TimelineTrack {
  return {
    id: uid('track'),
    name,
    muted: false,
    solo: false,
    volume: 0.75,
    pan: 0,
    engine,
  };
}

export function useTimelineDocument(t: ComposerTranslation) {
  const tracks = ref<TimelineTrack[]>([]);
  const clips = ref<TimelineClip[]>([]);
  const lastAssignedSpeaker = ref(createDefaultSpeaker());
  let scriptSeq = 0;

  function nextScriptName(): string {
    scriptSeq += 1;
    return t('pages.generate.timeline.scriptName', { n: scriptSeq });
  }

  function seedData(): void {
    scriptSeq = 0;
    tracks.value = [
      createTrack(nextScriptName()),
      createTrack(nextScriptName()),
    ];
    const [a, b] = tracks.value;
    clips.value = [
      {
        id: uid('clip'),
        ...createClipDefaults(a.id, 0.5, 6),
      },
      {
        id: uid('clip'),
        ...createClipDefaults(b.id, 2, 7),
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
    const text = clip.text.trim() || t('pages.generate.timeline.emptyClip');
    return t('pages.generate.timeline.clipAriaLabel', {
      text,
      start: clip.startSec.toFixed(1),
    });
  }

  function addTrack(): void {
    tracks.value.push(createTrack(nextScriptName()));
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

  function trackEngine(trackId: string): AquesTalkVersion | null {
    return tracks.value.find((tr) => tr.id === trackId)?.engine ?? null;
  }

  function clearClipSpeakerIfUnsupported(clip: TimelineClip): void {
    const engine = trackEngine(clip.trackId);
    if (engine === null) return;
    if (
      speakerSupportsEngine(clip.speaker, engine, characterProfiles.value)
    ) {
      return;
    }
    clip.speaker = createDefaultSpeaker();
  }

  function reconcileUnsupportedSpeakers(ids?: readonly string[]): void {
    if (ids) {
      forClips(ids, clearClipSpeakerIfUnsupported);
      return;
    }
    for (const clip of clips.value) {
      clearClipSpeakerIfUnsupported(clip);
    }
  }

  function setEngine(trackId: string, engine: AquesTalkVersion): void {
    const track = tracks.value.find((tr) => tr.id === trackId);
    if (!track) return;
    track.engine = engine;
    for (const clip of clips.value) {
      if (clip.trackId === trackId) clearClipSpeakerIfUnsupported(clip);
    }
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
      ...createClipDefaults(
        trackId,
        startSec,
        durationSec,
        lastAssignedSpeaker.value,
      ),
    };
    clips.value.push(clip);
    clearClipSpeakerIfUnsupported(clip);
    return clip;
  }

  function removeClips(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    clips.value = clips.value.filter((clip) => !idSet.has(clip.id));
  }

  function splitClip(
    clipId: string,
    atSec: number,
    textIndex: number,
  ): TimelineClip | null {
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
    if (textIndex < 1 || textIndex >= clip.text.length) return null;
    const leftText = clip.text.slice(0, textIndex);
    const rightText = clip.text.slice(textIndex);
    clip.durationSec = leftDuration;
    clip.text = leftText;
    const right: TimelineClip = {
      id: uid('clip'),
      trackId: clip.trackId,
      startSec: atSec,
      durationSec: rightDuration,
      text: rightText,
      speaker: cloneSpeaker(clip.speaker),
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      color: clip.color,
    };
    clips.value.push(right);
    return right;
  }

  function insertClips(entries: TimelineClipInsert[]): TimelineClip[] {
    const created: TimelineClip[] = [];
    for (const entry of entries) {
      if (!tracks.value.some((track) => track.id === entry.trackId)) continue;
      if (entry.durationSec < TIMELINE_CLIP_MIN_DURATION_SEC) continue;
      created.push({
        id: uid('clip'),
        ...clipPayload({ id: '', ...entry }),
        trackId: entry.trackId,
        startSec: Math.max(0, entry.startSec),
        durationSec: entry.durationSec,
      });
    }
    if (created.length > 0) {
      clips.value = [...clips.value, ...created];
      for (const clip of created) {
        clearClipSpeakerIfUnsupported(clip);
      }
    }
    return created;
  }

  function forClips(ids: readonly string[], fn: (clip: TimelineClip) => void): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    for (const clip of clips.value) {
      if (idSet.has(clip.id)) fn(clip);
    }
  }

  function setClipText(clipId: string, text: string): void {
    const clip = clips.value.find((c) => c.id === clipId);
    if (clip) clip.text = text;
  }

  function applySpeakerToClips(
    ids: readonly string[],
    speaker: TimelineClipSpeaker,
  ): void {
    lastAssignedSpeaker.value = cloneSpeaker(speaker);
    forClips(ids, (clip) => {
      clip.speaker = cloneSpeaker(speaker);
      clearClipSpeakerIfUnsupported(clip);
    });
  }

  function setDefaultSpeaker(speaker: TimelineClipSpeaker): void {
    lastAssignedSpeaker.value = cloneSpeaker(speaker);
  }

  function setClipsVolume(ids: readonly string[], volume: number): void {
    forClips(ids, (clip) => {
      clip.volume = volume;
    });
  }

  function setClipsPan(ids: readonly string[], pan: number): void {
    forClips(ids, (clip) => {
      clip.pan = pan;
    });
  }

  function setClipsMuted(ids: readonly string[], muted: boolean): void {
    forClips(ids, (clip) => {
      clip.muted = muted;
    });
  }

  function setClipsColor(
    ids: readonly string[],
    color: TimelineClipColor,
  ): void {
    forClips(ids, (clip) => {
      clip.color = color;
    });
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
    setEngine,
    applyClipPlacements,
    applyClipRanges,
    addClip,
    removeClips,
    splitClip,
    insertClips,
    setClipText,
    applySpeakerToClips,
    setDefaultSpeaker,
    lastAssignedSpeaker,
    reconcileUnsupportedSpeakers,
    setClipsVolume,
    setClipsPan,
    setClipsMuted,
    setClipsColor,
  };
}

export type TimelineDocument = ReturnType<typeof useTimelineDocument>;
