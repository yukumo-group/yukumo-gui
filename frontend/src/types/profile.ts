export type AquesTalkVersion = 1 | 2 | 10;

/** Sentinel id for an unsaved / ad-hoc voice config (not a character profile). */
export const CUSTOM_PROFILE_ID = '__custom__';

export type At10Preset = 'F1' | 'F2' | 'F3' | 'M1' | 'M2' | 'R1' | 'R2' | 'custom';

export type At10Base = 0 | 1 | 2;

export interface AquesTalk1Config {
  voiceId: string;
  speed: number;
  pitch: number;
}

export interface AquesTalk2Config {
  phontName: string;
  speed: number;
  pitch: number;
}

export interface AquesTalk10Config {
  preset: At10Preset;
  bas: At10Base;
  spd: number;
  vol: number;
  pit: number;
  acc: number;
  lmd: number;
  fsc: number;
  pitch: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  imageDataUrl: string | null;
  aquestalk1?: AquesTalk1Config;
  aquestalk2?: AquesTalk2Config;
  aquestalk10?: AquesTalk10Config;
  createdAt: number;
  updatedAt: number;
}

export const SPEED_MIN = 50;
export const SPEED_MAX = 300;
export const SPEED_DEFAULT = 100;

export const RESAMPLE_PITCH_MIN = 50;
export const RESAMPLE_PITCH_MAX = 200;
export const RESAMPLE_PITCH_DEFAULT = 100;

export const AT10_VOL_MIN = 0;
export const AT10_VOL_MAX = 300;
export const AT10_PIT_MIN = 20;
export const AT10_PIT_MAX = 200;
export const AT10_ACC_MIN = 0;
export const AT10_ACC_MAX = 200;
export const AT10_LMD_MIN = 0;
export const AT10_LMD_MAX = 200;
export const AT10_FSC_MIN = 50;
export const AT10_FSC_MAX = 200;

export const AT10_PRESET_IDS: Exclude<At10Preset, 'custom'>[] = [
  'F1',
  'F2',
  'F3',
  'M1',
  'M2',
  'R1',
  'R2',
];

export const AT1_MODULES = [
  'dvd',
  'f1',
  'f2',
  'f3',
  'imd1',
  'jgr',
  'm1',
  'm2',
  'r1',
] as const;

export const AT2_PHONTS = [
  'aq_f1c',
  'aq_f3a',
  'aq_huskey',
  'aq_m4b',
  'aq_mf1',
  'aq_rb2',
  'aq_rb3',
  'aq_rm',
  'aq_robo',
  'aq_yukkuri',
  'ar_f4',
  'ar_m5',
  'ar_mf2',
  'ar_rm3',
] as const;

export function supportedVersions(
  profile: Pick<
    CharacterProfile,
    'aquestalk1' | 'aquestalk2' | 'aquestalk10'
  >,
): AquesTalkVersion[] {
  const versions: AquesTalkVersion[] = [];
  if (profile.aquestalk1) versions.push(1);
  if (profile.aquestalk2) versions.push(2);
  if (profile.aquestalk10) versions.push(10);
  return versions;
}

export function createDefaultAquesTalk1(): AquesTalk1Config {
  return {
    voiceId: AT1_MODULES[0],
    speed: SPEED_DEFAULT,
    pitch: RESAMPLE_PITCH_DEFAULT,
  };
}

export function createDefaultAquesTalk2(): AquesTalk2Config {
  return {
    phontName: AT2_PHONTS[0],
    speed: SPEED_DEFAULT,
    pitch: RESAMPLE_PITCH_DEFAULT,
  };
}
