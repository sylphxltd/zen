/**
 * useInput hook - React Ink compatible keyboard input handling
 *
 * Allows components to handle keyboard input in a declarative way.
 */

import { onCleanup } from '@zen/runtime';

export type InputHandler = (input: string, key: Key) => void;

export interface Key {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  pageDown: boolean;
  pageUp: boolean;
  meta: boolean;
}

// Global registry of input handlers
const inputHandlers: Set<InputHandler> = new Set();

/**
 * Register a keyboard input handler
 * Similar to React Ink's useInput hook
 */
export function useInput(handler: InputHandler, options?: { isActive?: boolean }): void {
  const isActive = options?.isActive ?? true;

  if (isActive) {
    inputHandlers.add(handler);

    // Cleanup when component unmounts
    onCleanup(() => {
      inputHandlers.delete(handler);
    });
  }
}

/**
 * Parse key press into Key object
 */
export function parseKey(str: string): Key {
  return {
    upArrow: str === '\x1B[A',
    downArrow: str === '\x1B[B',
    rightArrow: str === '\x1B[C',
    leftArrow: str === '\x1B[D',
    return: str === '\r' || str === '\n',
    escape: str === '\x1B' || str === '\x1B\x1B',
    ctrl: str.charCodeAt(0) < 32 && str !== '\r' && str !== '\n' && str !== '\t',
    shift: str === '\x1B[Z', // Shift+Tab sends ESC[Z
    tab: str === '\t' || str === '\x1B[Z', // Tab or Shift+Tab
    backspace: str === '\x7F' || str === '\b',
    delete: str === '\x1B[3~',
    pageDown: str === '\x1B[6~',
    pageUp: str === '\x1B[5~',
    meta: str.startsWith('\x1B'),
  };
}

/**
 * Dispatch keyboard input to all registered handlers
 * Called by renderToTerminalReactive's onKeyPress
 */
export function dispatchInput(input: string): void {
  const key = parseKey(input);

  // Call all registered handlers
  for (const handler of inputHandlers) {
    handler(input, key);
  }
}

/**
 * Clear all input handlers
 * Useful for cleanup
 */
export function clearInputHandlers(): void {
  inputHandlers.clear();
}
