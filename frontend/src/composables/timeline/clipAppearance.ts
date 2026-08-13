import type { TimelineClipColor } from '../../types/timeline';

export const CLIP_COLOR_BODY: Record<TimelineClipColor, string> = {
  primary: 'border-primary/40 bg-primary/25',
  info: 'border-info/40 bg-info/25',
  warning: 'border-warning/40 bg-warning/25',
  success: 'border-success/40 bg-success/25',
  danger: 'border-danger/40 bg-danger/25',
};

export const CLIP_COLOR_HANDLE: Record<TimelineClipColor, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
};

export const CLIP_COLOR_HANDLE_DIM: Record<TimelineClipColor, string> = {
  primary: 'bg-primary/45',
  info: 'bg-info/45',
  warning: 'bg-warning/45',
  success: 'bg-success/45',
  danger: 'bg-danger/45',
};

export const CLIP_COLOR_SWATCH: Record<TimelineClipColor, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
};
