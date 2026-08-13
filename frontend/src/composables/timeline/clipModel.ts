import { createDefaultAquesTalk10 } from '../aquestalkPresets';
import type {
  AquesTalkVersion,
  CharacterProfile,
} from '../../types/profile';
import {
  CUSTOM_PROFILE_ID,
  createDefaultAquesTalk1,
  createDefaultAquesTalk2,
  supportedVersions,
} from '../../types/profile';
import type {
  TimelineClip,
  TimelineClipInsert,
  TimelineClipSpeaker,
} from '../../types/timeline';

export function createDefaultSpeaker(): TimelineClipSpeaker {
  return {
    profileId: CUSTOM_PROFILE_ID,
    aquestalk1: createDefaultAquesTalk1(),
    aquestalk2: createDefaultAquesTalk2(),
    aquestalk10: createDefaultAquesTalk10(),
  };
}

export function cloneSpeaker(
  speaker: TimelineClipSpeaker,
): TimelineClipSpeaker {
  return {
    profileId: speaker.profileId,
    aquestalk1: { ...speaker.aquestalk1 },
    aquestalk2: { ...speaker.aquestalk2 },
    aquestalk10: { ...speaker.aquestalk10 },
  };
}

export function speakerSupportsEngine(
  speaker: TimelineClipSpeaker,
  engine: AquesTalkVersion,
  profiles: readonly CharacterProfile[],
): boolean {
  if (speaker.profileId === CUSTOM_PROFILE_ID) return true;
  const profile = profiles.find((item) => item.id === speaker.profileId);
  if (!profile) return false;
  return supportedVersions(profile).includes(engine);
}

export function clipPayload(clip: TimelineClip): TimelineClipInsert {
  return {
    trackId: clip.trackId,
    startSec: clip.startSec,
    durationSec: clip.durationSec,
    text: clip.text,
    speaker: cloneSpeaker(clip.speaker),
    volume: clip.volume,
    pan: clip.pan,
    muted: clip.muted,
    color: clip.color,
  };
}

export function createClipDefaults(
  trackId: string,
  startSec: number,
  durationSec: number,
  speaker?: TimelineClipSpeaker,
): TimelineClipInsert {
  return {
    trackId,
    startSec: Math.max(0, startSec),
    durationSec,
    text: '',
    speaker: speaker ? cloneSpeaker(speaker) : createDefaultSpeaker(),
    volume: 0.75,
    pan: 0,
    muted: false,
    color: 'primary',
  };
}

function formatSigned(n: number, digits: number): string {
  const rounded = Number(n.toFixed(digits));
  if (rounded === 0) return `+${(0).toFixed(digits)}`;
  if (rounded > 0) return `+${rounded.toFixed(digits)}`;
  return rounded.toFixed(digits);
}

export function formatVolumeDb(volume: number): string {
  if (volume <= 0) return '-∞ dB';
  return `${formatSigned(20 * Math.log10(volume), 1)} dB`;
}

export function formatPanPercent(pan: number): string {
  return `${Math.round(pan * 100)}%`;
}

export function formatClipLevels(volume: number, pan: number): string {
  return `${formatVolumeDb(volume)}  ${formatPanPercent(pan)}`;
}
