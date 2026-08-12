import { ref, type Ref } from 'vue';
import { snapClipsEnabled, timelinePlayback } from '../timelineSession';
import { snapTimeToRuler } from '../timelineGrid';
import type { TimelineClip, TimelineEditMode, TimelineTrack } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';

interface ClipboardClip {
  durationSec: number;
  label: string;
  relativeStartSec: number;
  relativeTrackIndex: number;
}

interface ClipboardPayload {
  clips: ClipboardClip[];
  baseTrackIndex: number;
}

function rangesOverlap(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number,
): boolean {
  return aStart < bStart + bDuration && bStart < aStart + bDuration;
}

function placementsConflict(
  placements: Array<{ trackId: string; startSec: number; durationSec: number }>,
  existing: readonly TimelineClip[],
): boolean {
  for (let i = 0; i < placements.length; i += 1) {
    const a = placements[i]!;
    for (let j = i + 1; j < placements.length; j += 1) {
      const b = placements[j]!;
      if (a.trackId !== b.trackId) continue;
      if (rangesOverlap(a.startSec, a.durationSec, b.startSec, b.durationSec)) {
        return true;
      }
    }
    for (const other of existing) {
      if (other.trackId !== a.trackId) continue;
      if (
        rangesOverlap(a.startSec, a.durationSec, other.startSec, other.durationSec)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function useTimelineClipboard(options: {
  tracks: Ref<TimelineTrack[]>;
  clips: Ref<TimelineClip[]>;
  selection: TimelineSelection;
  pxPerSec: Ref<number>;
  insertClips: (
    entries: Array<{
      trackId: string;
      startSec: number;
      durationSec: number;
      label: string;
    }>,
  ) => TimelineClip[];
  setEditMode: (mode: TimelineEditMode) => void;
}) {
  const clipboard = ref<ClipboardPayload | null>(null);

  function copySelection(): boolean {
    const ids = options.selection.selectedClipIdSet.value;
    if (ids.size === 0) return false;

    const trackIndexById = new Map(
      options.tracks.value.map((track, index) => [track.id, index]),
    );

    const selected: Array<{ clip: TimelineClip; trackIndex: number }> = [];
    for (const clip of options.clips.value) {
      if (!ids.has(clip.id)) continue;
      const trackIndex = trackIndexById.get(clip.trackId);
      if (trackIndex === undefined) continue;
      selected.push({ clip, trackIndex });
    }
    if (selected.length === 0) return false;

    let minStart = Infinity;
    let minTrack = Infinity;
    for (const item of selected) {
      minStart = Math.min(minStart, item.clip.startSec);
      minTrack = Math.min(minTrack, item.trackIndex);
    }

    clipboard.value = {
      baseTrackIndex: minTrack,
      clips: selected.map((item) => ({
        durationSec: item.clip.durationSec,
        label: item.clip.label,
        relativeStartSec: item.clip.startSec - minStart,
        relativeTrackIndex: item.trackIndex - minTrack,
      })),
    };
    return true;
  }

  function pasteAtPlayhead(): boolean {
    const payload = clipboard.value;
    if (!payload || payload.clips.length === 0) return false;

    const tracks = options.tracks.value;
    if (tracks.length === 0) return false;

    let originSec = Math.max(0, timelinePlayback.currentTimeSec.value);
    if (snapClipsEnabled.value) {
      originSec = snapTimeToRuler(originSec, options.pxPerSec.value);
    }

    let maxRelTrack = 0;
    for (const item of payload.clips) {
      maxRelTrack = Math.max(maxRelTrack, item.relativeTrackIndex);
    }

    let base = payload.baseTrackIndex;
    if (base + maxRelTrack > tracks.length - 1) {
      base = Math.max(0, tracks.length - 1 - maxRelTrack);
    }

    const placements: Array<{
      trackId: string;
      startSec: number;
      durationSec: number;
      label: string;
    }> = [];

    for (const item of payload.clips) {
      const trackIndex = Math.min(
        tracks.length - 1,
        Math.max(0, base + item.relativeTrackIndex),
      );
      const track = tracks[trackIndex];
      if (!track) return false;
      placements.push({
        trackId: track.id,
        startSec: originSec + item.relativeStartSec,
        durationSec: item.durationSec,
        label: item.label,
      });
    }

    if (placementsConflict(placements, options.clips.value)) return false;

    options.setEditMode('select');
    const created = options.insertClips(placements);
    if (created.length === 0) return false;
    options.selection.setSelection(created.map((clip) => clip.id));
    return true;
  }

  return {
    clipboard,
    copySelection,
    pasteAtPlayhead,
  };
}
