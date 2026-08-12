/** Shared ruler/snap grid helpers (seconds). */

export function pickRulerStep(pxPerSec: number): { major: number; minor: number } {
  const targetMajorPx = 80;
  const candidates = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  let major = 1;
  for (const c of candidates) {
    if (c * pxPerSec >= targetMajorPx) {
      major = c;
      break;
    }
    major = c;
  }
  const minor = major >= 1 ? major / 5 : major / 2;
  return { major, minor: Math.max(minor, major / 10) };
}

export function snapTimeToRuler(
  timeSec: number,
  pxPerSec: number,
): number {
  const { minor } = pickRulerStep(pxPerSec);
  if (minor <= 0) return Math.max(0, timeSec);
  return Math.max(0, Math.round(timeSec / minor) * minor);
}
