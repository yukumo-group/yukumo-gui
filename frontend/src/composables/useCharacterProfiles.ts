import { ref } from 'vue';
import { AT10_PRESETS } from './aquestalkPresets';
import type {
  AquesTalk1Config,
  AquesTalk10Config,
  AquesTalk2Config,
  At10Base,
  At10Preset,
  CharacterProfile,
} from '../types/profile';
import {
  AT10_ACC_MAX,
  AT10_ACC_MIN,
  AT10_FSC_MAX,
  AT10_FSC_MIN,
  AT10_LMD_MAX,
  AT10_LMD_MIN,
  AT10_PIT_MAX,
  AT10_PIT_MIN,
  AT10_PRESET_IDS,
  AT10_VOL_MAX,
  AT10_VOL_MIN,
  RESAMPLE_PITCH_DEFAULT,
  RESAMPLE_PITCH_MAX,
  RESAMPLE_PITCH_MIN,
  SPEED_DEFAULT,
  SPEED_MAX,
  SPEED_MIN,
} from '../types/profile';

const STORAGE_KEY = 'yukumo-profiles';
const STORAGE_VERSION = 1;

interface StoredProfiles {
  version: number;
  profiles: CharacterProfile[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseAt10Base(value: unknown): At10Base {
  const n = clampInt(value, 0, 2, 0);
  return n as At10Base;
}

function parseAt10Preset(value: unknown): At10Preset {
  if (value === 'custom') return 'custom';
  if (
    typeof value === 'string' &&
    (AT10_PRESET_IDS as string[]).includes(value)
  ) {
    return value as Exclude<At10Preset, 'custom'>;
  }
  return 'custom';
}

function parseAquesTalk1(value: unknown): AquesTalk1Config | undefined {
  if (!isRecord(value)) return undefined;
  const voiceId = parseString(value.voiceId).trim();
  if (!voiceId) return undefined;
  return {
    voiceId,
    speed: clampInt(value.speed, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT),
    pitch: clampInt(
      value.pitch,
      RESAMPLE_PITCH_MIN,
      RESAMPLE_PITCH_MAX,
      RESAMPLE_PITCH_DEFAULT,
    ),
  };
}

function parseAquesTalk2(value: unknown): AquesTalk2Config | undefined {
  if (!isRecord(value)) return undefined;
  const phontName = parseString(value.phontName).trim();
  if (!phontName) return undefined;
  return {
    phontName,
    speed: clampInt(value.speed, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT),
    pitch: clampInt(
      value.pitch,
      RESAMPLE_PITCH_MIN,
      RESAMPLE_PITCH_MAX,
      RESAMPLE_PITCH_DEFAULT,
    ),
  };
}

function parseAquesTalk10(value: unknown): AquesTalk10Config | undefined {
  if (!isRecord(value)) return undefined;
  const preset = parseAt10Preset(value.preset);
  const native =
    preset === 'custom'
      ? {
          bas: parseAt10Base(value.bas),
          spd: clampInt(value.spd, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT),
          vol: clampInt(value.vol, AT10_VOL_MIN, AT10_VOL_MAX, 100),
          pit: clampInt(value.pit, AT10_PIT_MIN, AT10_PIT_MAX, 100),
          acc: clampInt(value.acc, AT10_ACC_MIN, AT10_ACC_MAX, 100),
          lmd: clampInt(value.lmd, AT10_LMD_MIN, AT10_LMD_MAX, 100),
          fsc: clampInt(value.fsc, AT10_FSC_MIN, AT10_FSC_MAX, 100),
        }
      : AT10_PRESETS[preset];
  return {
    ...native,
    preset,
    pitch: clampInt(
      value.pitch,
      RESAMPLE_PITCH_MIN,
      RESAMPLE_PITCH_MAX,
      RESAMPLE_PITCH_DEFAULT,
    ),
  };
}

function parseProfile(value: unknown): CharacterProfile | null {
  if (!isRecord(value)) return null;
  const id = parseString(value.id).trim();
  const name = parseString(value.name).trim();
  if (!id || !name) return null;

  const aquestalk1 = parseAquesTalk1(value.aquestalk1);
  const aquestalk2 = parseAquesTalk2(value.aquestalk2);
  const aquestalk10 = parseAquesTalk10(value.aquestalk10);
  if (!aquestalk1 && !aquestalk2 && !aquestalk10) return null;

  const imageDataUrl =
    typeof value.imageDataUrl === 'string' &&
    value.imageDataUrl.startsWith('data:image/')
      ? value.imageDataUrl
      : null;

  const createdAt =
    typeof value.createdAt === 'number' && Number.isFinite(value.createdAt)
      ? value.createdAt
      : Date.now();
  const updatedAt =
    typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : createdAt;

  return {
    id,
    name,
    description: parseString(value.description),
    imageDataUrl,
    aquestalk1,
    aquestalk2,
    aquestalk10,
    createdAt,
    updatedAt,
  };
}

function loadProfiles(): CharacterProfile[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.profiles)) return [];
    const seen = new Set<string>();
    const profiles: CharacterProfile[] = [];
    for (const entry of parsed.profiles) {
      const profile = parseProfile(entry);
      if (!profile || seen.has(profile.id)) continue;
      seen.add(profile.id);
      profiles.push(profile);
    }
    return profiles;
  } catch {
    return [];
  }
}

function persist(next: CharacterProfile[]): void {
  const payload: StoredProfiles = {
    version: STORAGE_VERSION,
    profiles: next,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export type ProfileDraft = Omit<
  CharacterProfile,
  'id' | 'createdAt' | 'updatedAt'
>;

export const characterProfiles = ref<CharacterProfile[]>(loadProfiles());

export function createProfile(draft: ProfileDraft): CharacterProfile {
  const now = Date.now();
  const profile: CharacterProfile = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  characterProfiles.value = [profile, ...characterProfiles.value];
  persist(characterProfiles.value);
  return profile;
}

export function updateProfile(
  id: string,
  draft: ProfileDraft,
): CharacterProfile | null {
  const index = characterProfiles.value.findIndex(
    (profile) => profile.id === id,
  );
  if (index < 0) return null;
  const current = characterProfiles.value[index];
  if (!current) return null;
  const updated: CharacterProfile = {
    ...current,
    ...draft,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: Date.now(),
  };
  const next = characterProfiles.value.slice();
  next[index] = updated;
  characterProfiles.value = next;
  persist(next);
  return updated;
}

export function removeProfile(id: string): boolean {
  const next = characterProfiles.value.filter((profile) => profile.id !== id);
  if (next.length === characterProfiles.value.length) return false;
  characterProfiles.value = next;
  persist(next);
  return true;
}
