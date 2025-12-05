/**
 * useTerminalSize Hook
 *
 * Returns the current terminal dimensions and updates when resized.
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const { width, height } = useTerminalSize();
 *   return <Text>Terminal: {width}x{height}</Text>;
 * }
 * ```
 */

import { effect, onCleanup, signal } from '@rapid/signal';

export interface TerminalSize {
  /** Terminal width in columns */
  width: number;
  /** Terminal height in rows */
  height: number;
  /** Alias for width (terminal columns) */
  columns: number;
  /** Alias for height (terminal rows) */
  rows: number;
}

/** Default terminal width (VT100 standard) */
export const DEFAULT_TERMINAL_WIDTH = 80;
/** Default terminal height (VT100 standard) */
export const DEFAULT_TERMINAL_HEIGHT = 24;

// Global terminal size signals (shared across all hooks and render system)
// These are the single source of truth for terminal dimensions
export const terminalWidthSignal = signal(process.stdout.columns || DEFAULT_TERMINAL_WIDTH);
export const terminalHeightSignal = signal(process.stdout.rows || DEFAULT_TERMINAL_HEIGHT);

// Legacy aliases for internal use
const terminalWidth = terminalWidthSignal;
const terminalHeight = terminalHeightSignal;

// Track if resize listener is set up
let resizeListenerActive = false;
let listenerCount = 0;

function handleResize() {
  terminalWidth.value = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
  terminalHeight.value = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;
}

function setupResizeListener() {
  if (!resizeListenerActive && process.stdout.isTTY) {
    // Refresh values in case terminal was resized since module load
    handleResize();
    process.stdout.on('resize', handleResize);
    resizeListenerActive = true;
  }
  listenerCount++;
}

function teardownResizeListener() {
  // Guard against going negative (defensive programming)
  listenerCount = Math.max(0, listenerCount - 1);

  if (listenerCount === 0 && resizeListenerActive) {
    process.stdout.off('resize', handleResize);
    resizeListenerActive = false;
  }
}

/**
 * Hook to get terminal dimensions
 *
 * Returns reactive signals that update when terminal is resized.
 *
 * @returns Object with width and height properties
 */
export function useTerminalSize(): TerminalSize {
  // Set up resize listener
  setupResizeListener();

  // Clean up when component unmounts
  onCleanup(() => {
    teardownResizeListener();
  });

  return {
    get width() {
      return terminalWidth.value;
    },
    get height() {
      return terminalHeight.value;
    },
    get columns() {
      return terminalWidth.value;
    },
    get rows() {
      return terminalHeight.value;
    },
  };
}

/**
 * Get terminal size without reactivity
 *
 * Use this for one-time reads without setting up a listener.
 */
export function getTerminalSize(): TerminalSize {
  const w = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
  const h = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;
  return {
    width: w,
    height: h,
    columns: w,
    rows: h,
  };
}

/**
 * Hook to react to terminal resize
 *
 * @param callback Called when terminal is resized with new dimensions
 *
 * @example
 * ```tsx
 * useTerminalResize((width, height) => {
 *   console.log(`Resized to ${width}x${height}`);
 * });
 * ```
 */
export function useTerminalResize(callback: (width: number, height: number) => void): void {
  const { width, height } = useTerminalSize();

  // Use effect to track changes and call callback
  let prevWidth = width;
  let prevHeight = height;

  effect(() => {
    const newWidth = terminalWidth.value;
    const newHeight = terminalHeight.value;

    if (newWidth !== prevWidth || newHeight !== prevHeight) {
      prevWidth = newWidth;
      prevHeight = newHeight;
      callback(newWidth, newHeight);
    }

    return undefined;
  });
}
