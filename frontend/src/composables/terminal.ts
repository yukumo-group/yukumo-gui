import { ref, watch } from 'vue';
import { clampSplitSize } from '../components/split/splitTypes';

export const TERMINAL_HEIGHT_MIN = 96;
export const TERMINAL_HEIGHT_MAX = 480;
export const TERMINAL_HEIGHT_DEFAULT = 220;

/** Leaves room for the page when clamping against the layout. */
const MAIN_PANE_MIN = 160;

interface TerminalUiState {
  showTerminal: boolean;
  terminalHeight: number;
}

const STORAGE_KEY = 'yukumo-terminal-ui';
const LEGACY_GENERATE_STORAGE_KEY = 'yukumo-generate-ui';

const DEFAULT_STATE: TerminalUiState = {
  showTerminal: false,
  terminalHeight: TERMINAL_HEIGHT_DEFAULT,
};

export function clampTerminalHeight(
  px: number,
  workspaceHeightPx?: number,
): number {
  return clampSplitSize(
    px,
    TERMINAL_HEIGHT_MIN,
    TERMINAL_HEIGHT_MAX,
    workspaceHeightPx,
    MAIN_PANE_MIN,
  );
}

function readLegacyGenerateState(): Partial<TerminalUiState> {
  try {
    const raw = window.localStorage.getItem(LEGACY_GENERATE_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const record = parsed as Record<string, unknown>;
    const next: Partial<TerminalUiState> = {};

    if (typeof record.showTerminal === 'boolean') {
      next.showTerminal = record.showTerminal;
    }
    if (typeof record.terminalHeight === 'number') {
      next.terminalHeight = clampTerminalHeight(record.terminalHeight);
    }

    return next;
  } catch {
    return {};
  }
}

function readStoredState(): TerminalUiState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE, ...readLegacyGenerateState() };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_STATE, ...readLegacyGenerateState() };
    }

    const record = parsed as Record<string, unknown>;
    return {
      showTerminal:
        typeof record.showTerminal === 'boolean'
          ? record.showTerminal
          : DEFAULT_STATE.showTerminal,
      terminalHeight:
        typeof record.terminalHeight === 'number'
          ? clampTerminalHeight(record.terminalHeight)
          : DEFAULT_STATE.terminalHeight,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeStoredState(state: TerminalUiState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initial = readStoredState();

export const showTerminal = ref(initial.showTerminal);
export const terminalHeight = ref(initial.terminalHeight);

/** Placeholder until run/build logs feed this bar. */
export const latestStatusMessage = ref<string | null>(null);

writeStoredState({
  showTerminal: initial.showTerminal,
  terminalHeight: initial.terminalHeight,
});

watch([showTerminal, terminalHeight], ([open, height]) => {
  writeStoredState({
    showTerminal: open,
    terminalHeight: height,
  });
});

export function toggleTerminal(): void {
  showTerminal.value = !showTerminal.value;
}

export function setTerminalHeight(
  px: number,
  workspaceHeightPx?: number,
): void {
  terminalHeight.value = clampTerminalHeight(px, workspaceHeightPx);
}
