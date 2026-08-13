import { onMounted, onUnmounted, type Ref } from 'vue';
import {
  timelinePlayback,
  toggleSnapClips,
  toggleSnapPlayhead,
} from '../timelineSession';
import type { TimelineEditMode } from '../../types/timeline';

const TOOL_BY_CODE: Record<string, TimelineEditMode> = {
  KeyQ: 'select',
  KeyW: 'add',
  KeyE: 'delete',
  KeyR: 'split',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.monaco-editor, [contenteditable="true"]')) return true;
  return false;
}

export function useTimelineHotkeys(options: {
  editMode: Ref<TimelineEditMode>;
  setEditMode: (mode: TimelineEditMode) => void;
  copySelection: () => boolean;
  pasteAtPlayhead: () => boolean;
  deleteSelection: () => boolean;
}) {
  function onKeyDown(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;

    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && !e.shiftKey) {
      const key = e.key.toLowerCase();
      if (key === 'c') {
        if (options.copySelection()) e.preventDefault();
        return;
      }
      if (key === 'v') {
        if (options.pasteAtPlayhead()) e.preventDefault();
        return;
      }
    }

    if (mod || e.altKey) return;

    if (e.code === 'Space' || e.key === ' ') {
      if (e.repeat) return;
      e.preventDefault();
      if (timelinePlayback.isPlaying.value) {
        timelinePlayback.stop();
      } else {
        timelinePlayback.play();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      timelinePlayback.stopToStart();
      if (options.editMode.value !== 'select') {
        options.setEditMode('select');
      }
      return;
    }

    if (e.key === 'Delete' || e.code === 'Delete' || e.key === 'Backspace') {
      if (e.repeat) return;
      if (options.deleteSelection()) e.preventDefault();
      return;
    }

    if (e.code === 'KeyP') {
      if (e.repeat || e.shiftKey) return;
      e.preventDefault();
      timelinePlayback.togglePlay();
      return;
    }

    if (e.code === 'KeyS') {
      if (e.repeat) return;
      e.preventDefault();
      if (e.shiftKey) toggleSnapPlayhead();
      else toggleSnapClips();
      return;
    }

    const tool = TOOL_BY_CODE[e.code];
    if (!tool || e.repeat) return;
    e.preventDefault();
    options.setEditMode(tool);
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    if (e.code !== 'Space' && e.key !== ' ') return;
    e.preventDefault();
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
}
