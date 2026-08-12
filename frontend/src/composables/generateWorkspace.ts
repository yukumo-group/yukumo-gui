import { ref, watch } from 'vue';
import { clampSplitSize } from '../components/split/splitTypes';

export type RightPanel = 'code' | 'timeline';

export const TERMINAL_HEIGHT_MIN = 96;
export const TERMINAL_HEIGHT_MAX = 480;
export const TERMINAL_HEIGHT_DEFAULT = 220;

export const FILE_TREE_WIDTH_MIN = 140;
export const FILE_TREE_WIDTH_MAX = 400;
export const FILE_TREE_WIDTH_DEFAULT = 224;

/** Leaves room for the editor when clamping against the workspace. */
const MAIN_PANE_MIN = 160;

interface GenerateUiState {
  rightPanel: RightPanel;
  showFileTree: boolean;
  showTerminal: boolean;
  terminalHeight: number;
  fileTreeWidth: number;
}

const STORAGE_KEY = 'yukumo-generate-ui';

const DEFAULT_STATE: GenerateUiState = {
  rightPanel: 'code',
  showFileTree: true,
  showTerminal: false,
  terminalHeight: TERMINAL_HEIGHT_DEFAULT,
  fileTreeWidth: FILE_TREE_WIDTH_DEFAULT,
};

function isRightPanel(value: unknown): value is RightPanel {
  return value === 'code' || value === 'timeline';
}

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

export function clampFileTreeWidth(
  px: number,
  workspaceWidthPx?: number,
): number {
  return clampSplitSize(
    px,
    FILE_TREE_WIDTH_MIN,
    FILE_TREE_WIDTH_MAX,
    workspaceWidthPx,
    MAIN_PANE_MIN,
  );
}

function readStoredState(): GenerateUiState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE };

    const record = parsed as Record<string, unknown>;
    const rightPanel = isRightPanel(record.rightPanel)
      ? record.rightPanel
      : DEFAULT_STATE.rightPanel;

    return {
      rightPanel,
      showFileTree:
        typeof record.showFileTree === 'boolean'
          ? record.showFileTree
          : rightPanel === 'code',
      showTerminal:
        typeof record.showTerminal === 'boolean'
          ? record.showTerminal
          : DEFAULT_STATE.showTerminal,
      terminalHeight:
        typeof record.terminalHeight === 'number'
          ? clampTerminalHeight(record.terminalHeight)
          : DEFAULT_STATE.terminalHeight,
      fileTreeWidth:
        typeof record.fileTreeWidth === 'number'
          ? clampFileTreeWidth(record.fileTreeWidth)
          : DEFAULT_STATE.fileTreeWidth,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeStoredState(state: GenerateUiState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initial = readStoredState();

export const rightPanel = ref<RightPanel>(initial.rightPanel);
export const showFileTree = ref(initial.showFileTree);
export const showTerminal = ref(initial.showTerminal);
export const terminalHeight = ref(initial.terminalHeight);
export const fileTreeWidth = ref(initial.fileTreeWidth);

/** Placeholder until run/build logs feed this bar. */
export const latestStatusMessage = ref<string | null>(null);

watch(
  [rightPanel, showFileTree, showTerminal, terminalHeight, fileTreeWidth],
  ([panel, fileTree, terminal, height, width]) => {
    writeStoredState({
      rightPanel: panel,
      showFileTree: fileTree,
      showTerminal: terminal,
      terminalHeight: height,
      fileTreeWidth: width,
    });
  },
);

export function toggleFileTree(): void {
  showFileTree.value = !showFileTree.value;
}

export function toggleTerminal(): void {
  showTerminal.value = !showTerminal.value;
}

export function setTerminalHeight(
  px: number,
  workspaceHeightPx?: number,
): void {
  terminalHeight.value = clampTerminalHeight(px, workspaceHeightPx);
}

export function setFileTreeWidth(
  px: number,
  workspaceWidthPx?: number,
): void {
  fileTreeWidth.value = clampFileTreeWidth(px, workspaceWidthPx);
}

export function cycleRightPanel(): void {
  const next: RightPanel = rightPanel.value === 'code' ? 'timeline' : 'code';
  rightPanel.value = next;
  showFileTree.value = next === 'code';
}
