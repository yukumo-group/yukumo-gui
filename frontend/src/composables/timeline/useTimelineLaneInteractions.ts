import { onUnmounted, watch, type ComputedRef, type Ref } from 'vue';
import type { ClipResizeEdge } from './useTimelineClipResize';
import type { TimelineEditMode } from '../../types/timeline';
import type { TimelineSelection } from './useTimelineSelection';

export function useTimelineLaneInteractions(options: {
  editMode: Ref<TimelineEditMode> | ComputedRef<TimelineEditMode>;
  stickyEditMode: Ref<TimelineEditMode>;
  pushOverlay: (mode: TimelineEditMode) => void;
  popOverlay: (mode: TimelineEditMode) => void;
  selection: TimelineSelection;
  startMarquee: (e: PointerEvent) => void;
  startAdd: (e: PointerEvent) => void;
  startDelete: (e: PointerEvent, clipId?: string | null) => void;
  onClipPointerDown: (clipId: string, e: PointerEvent) => void;
  onClipResizePointerDown: (
    clipId: string,
    edge: ClipResizeEdge,
    e: PointerEvent,
  ) => void;
  splitAtPointer: (clipId: string, e: PointerEvent) => void;
  rememberPointerSplitTime: (clientX: number) => void;
  onSplitPointerMove: (e: PointerEvent) => void;
  onLanesPointerDown: (e: PointerEvent) => void;
  onLanesPointerMove: (e: PointerEvent) => void;
  onLanesPointerUp: (e: PointerEvent) => void;
  onGesturePointerDown: (e: PointerEvent) => void;
  onGesturePointerMove: (e: PointerEvent) => void;
  onGesturePointerUp: (e: PointerEvent) => void;
  endClipDrag: () => void;
  endClipResize: () => void;
  endMarquee: () => void;
  cancelAdd: () => void;
  cancelDelete: () => void;
  clearSplitPreview: () => void;
}) {
  let rmbDeleteOverlay = false;

  function endRmbDeleteOverlay(e: PointerEvent): void {
    if (!rmbDeleteOverlay) return;
    if (e.type !== 'pointercancel' && e.button !== 2) return;
    rmbDeleteOverlay = false;
    options.popOverlay('delete');
    window.removeEventListener('pointerup', endRmbDeleteOverlay);
    window.removeEventListener('pointercancel', endRmbDeleteOverlay);
  }

  function armRmbDeleteOverlay(): void {
    if (rmbDeleteOverlay) return;
    rmbDeleteOverlay = true;
    window.addEventListener('pointerup', endRmbDeleteOverlay);
    window.addEventListener('pointercancel', endRmbDeleteOverlay);
  }

  function syncHeldModifierOverlays(e: PointerEvent): void {
    if (e.ctrlKey) options.pushOverlay('add');
    if (e.altKey) options.pushOverlay('split');
  }

  function cancelToolGestures(): void {
    options.endClipDrag();
    options.endClipResize();
    options.endMarquee();
    options.cancelAdd();
    options.cancelDelete();
    options.clearSplitPreview();
  }

  function onLanesBackgroundDown(e: PointerEvent): void {
    syncHeldModifierOverlays(e);
    if (e.button === 2 && e.pointerType !== 'touch') {
      e.preventDefault();
      options.pushOverlay('delete');
      options.startDelete(e);
      armRmbDeleteOverlay();
      return;
    }
    if (e.button === 0 && e.pointerType !== 'touch') {
      switch (options.editMode.value) {
        case 'select':
          options.startMarquee(e);
          break;
        case 'add':
          options.startAdd(e);
          break;
        case 'delete':
          options.startDelete(e);
          break;
        default:
          break;
      }
    }
    options.onLanesPointerDown(e);
    options.onGesturePointerDown(e);
  }

  function onClipDown(clipId: string, e: PointerEvent): void {
    syncHeldModifierOverlays(e);
    if (e.button === 2) {
      e.preventDefault();
      options.pushOverlay('delete');
      options.startDelete(e, clipId);
      armRmbDeleteOverlay();
      return;
    }
    switch (options.editMode.value) {
      case 'select':
        options.onClipPointerDown(clipId, e);
        options.rememberPointerSplitTime(e.clientX);
        break;
      case 'delete':
        options.startDelete(e, clipId);
        break;
      case 'split':
        options.splitAtPointer(clipId, e);
        break;
      default:
        break;
    }
  }

  function onClipResizeDown(
    clipId: string,
    edge: ClipResizeEdge,
    e: PointerEvent,
  ): void {
    if (options.editMode.value !== 'select') return;
    options.onClipResizePointerDown(clipId, edge, e);
  }

  function onClipDblclick(clipId: string): void {
    options.endClipDrag();
    options.selection.setSelection([clipId]);
  }

  function onLanesMove(e: PointerEvent): void {
    options.onLanesPointerMove(e);
    options.onGesturePointerMove(e);
    options.rememberPointerSplitTime(e.clientX);
    if (options.editMode.value === 'split') {
      options.onSplitPointerMove(e);
    }
  }

  function onLanesUp(e: PointerEvent): void {
    options.onLanesPointerUp(e);
    options.onGesturePointerUp(e);
  }

  watch(
    options.editMode,
    () => {
      cancelToolGestures();
    },
    { flush: 'sync' },
  );

  watch(
    options.stickyEditMode,
    (mode) => {
      if (mode !== 'select') {
        options.selection.clearSelection();
      }
    },
    { flush: 'sync' },
  );

  onUnmounted(() => {
    cancelToolGestures();
    if (rmbDeleteOverlay) {
      rmbDeleteOverlay = false;
      window.removeEventListener('pointerup', endRmbDeleteOverlay);
      window.removeEventListener('pointercancel', endRmbDeleteOverlay);
    }
  });

  return {
    onLanesBackgroundDown,
    onClipDown,
    onClipResizeDown,
    onClipDblclick,
    onLanesMove,
    onLanesUp,
    cancelToolGestures,
  };
}
