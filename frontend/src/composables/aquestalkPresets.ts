import type { AquesTalk10Config, At10Preset } from '../types/profile';
import { RESAMPLE_PITCH_DEFAULT } from '../types/profile';

type At10Native = Omit<AquesTalk10Config, 'preset' | 'pitch'>;

export const AT10_PRESETS: Record<Exclude<At10Preset, 'custom'>, At10Native> = {
  F1: { bas: 0, spd: 100, vol: 100, pit: 100, acc: 100, lmd: 100, fsc: 100 },
  F2: { bas: 1, spd: 100, vol: 100, pit: 77, acc: 150, lmd: 100, fsc: 100 },
  F3: { bas: 0, spd: 80, vol: 100, pit: 100, acc: 100, lmd: 61, fsc: 148 },
  M1: { bas: 2, spd: 100, vol: 100, pit: 30, acc: 100, lmd: 100, fsc: 100 },
  M2: { bas: 2, spd: 105, vol: 100, pit: 45, acc: 130, lmd: 120, fsc: 100 },
  R1: { bas: 2, spd: 100, vol: 100, pit: 30, acc: 20, lmd: 190, fsc: 100 },
  R2: { bas: 1, spd: 70, vol: 100, pit: 50, acc: 50, lmd: 50, fsc: 180 },
};

export function createDefaultAquesTalk10(): AquesTalk10Config {
  return {
    ...AT10_PRESETS.F1,
    preset: 'F1',
    pitch: RESAMPLE_PITCH_DEFAULT,
  };
}

export function applyAt10Preset(
  preset: Exclude<At10Preset, 'custom'>,
  pitch: number,
): AquesTalk10Config {
  return {
    ...AT10_PRESETS[preset],
    preset,
    pitch,
  };
}
