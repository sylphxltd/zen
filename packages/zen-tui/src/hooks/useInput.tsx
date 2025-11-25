/**
 * useInput hook - React Ink compatible keyboard input handling
 *
 * Allows components to handle keyboard input in a declarative way.
 * Supports priority-based focus management where handlers can "consume" events.
 */

import { getOwner, onCleanup, type Owner } from '@zen/runtime';

/**
 * Input handler function.
 * Return `true` to stop propagation (event consumed).
 * Return `false` or `undefined` to allow other handlers to process.
 */
export type InputHandler = (input: string, key: Key) => boolean | undefined;

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
  home: boolean;
  end: boolean;
  // F-keys
  f1: boolean;
  f2: boolean;
  f3: boolean;
  f4: boolean;
  f5: boolean;
  f6: boolean;
  f7: boolean;
  f8: boolean;
  f9: boolean;
  f10: boolean;
  f11: boolean;
  f12: boolean;
}

export interface UseInputOptions {
  /** Whether this handler is active (default: true) */
  isActive?: boolean;
  /** Handler priority. Higher = runs first (default: 0). Use for focus management. */
  priority?: number;
}

interface RegisteredHandler {
  handler: InputHandler;
  priority: number;
  owner: Owner | null;
}

// Global registry of input handlers - keyed by owner for re-render safety
// Using owner as key ensures handlers are updated rather than duplicated on re-render
const inputHandlers: Set<RegisteredHandler> = new Set();

// Track registered handlers by owner to update them on re-render
const ownerToHandler: WeakMap<Owner, RegisteredHandler> = new WeakMap();

/**
 * Register a keyboard input handler
 * Similar to React Ink's useInput hook
 *
 * Handles re-renders properly by updating existing handlers instead of
 * accumulating duplicates. Uses owner-based tracking for cleanup.
 *
 * @param handler - The input handler function. Return `true` to stop propagation.
 * @param options - Options including isActive and priority
 *
 * @example
 * // Basic usage (low priority, doesn't consume events)
 * useInput((input, key) => {
 *   if (key.escape) quit();
 * });
 *
 * @example
 * // Focused component (high priority, consumes events)
 * useInput((input, key) => {
 *   if (key.return) { submit(); return true; }  // consumed
 *   if (input) { type(input); return true; }    // consumed
 * }, { priority: 10 });
 */
export function useInput(handler: InputHandler, options?: UseInputOptions): void {
  const isActive = options?.isActive ?? true;
  const priority = options?.priority ?? 0;
  const owner = getOwner();

  // If this owner already has a handler registered, update it (handles re-renders)
  if (owner) {
    const existing = ownerToHandler.get(owner);
    if (existing) {
      if (isActive) {
        // Update existing handler - this is a re-render
        existing.handler = handler;
        existing.priority = priority;
      } else {
        // Handler became inactive, remove it
        inputHandlers.delete(existing);
        ownerToHandler.delete(owner);
      }
      return;
    }
  }

  // New handler registration
  if (isActive) {
    const registered: RegisteredHandler = { handler, priority, owner };
    inputHandlers.add(registered);

    // Track by owner for re-render detection
    if (owner) {
      ownerToHandler.set(owner, registered);
    }

    // Cleanup when component unmounts
    onCleanup(() => {
      inputHandlers.delete(registered);
      if (owner) {
        ownerToHandler.delete(owner);
      }
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
    home: str === '\x1B[H' || str === '\x1B[1~',
    end: str === '\x1B[F' || str === '\x1B[4~',
    // F-keys (various terminal escape sequences)
    f1: str === '\x1BOP' || str === '\x1B[11~' || str === '\x1B[[A',
    f2: str === '\x1BOQ' || str === '\x1B[12~' || str === '\x1B[[B',
    f3: str === '\x1BOR' || str === '\x1B[13~' || str === '\x1B[[C',
    f4: str === '\x1BOS' || str === '\x1B[14~' || str === '\x1B[[D',
    f5: str === '\x1B[15~' || str === '\x1B[[E',
    f6: str === '\x1B[17~',
    f7: str === '\x1B[18~',
    f8: str === '\x1B[19~',
    f9: str === '\x1B[20~',
    f10: str === '\x1B[21~',
    f11: str === '\x1B[23~',
    f12: str === '\x1B[24~',
  };
}

/**
 * Dispatch keyboard input to all registered handlers
 * Called by renderToTerminalReactive's onKeyPress
 *
 * Handlers are called in priority order (highest first).
 * If a handler returns `true`, propagation stops.
 */
export function dispatchInput(input: string): void {
  const key = parseKey(input);

  // CRITICAL: Copy handlers to array before iterating
  // Handlers may modify the Set (via signal updates triggering re-renders)
  // which would cause infinite iteration if we iterate the Set directly
  const handlers = [...inputHandlers];

  // Sort by priority (highest first)
  handlers.sort((a, b) => b.priority - a.priority);

  for (const { handler } of handlers) {
    const consumed = handler(input, key);
    if (consumed === true) {
      // Event was consumed, stop propagation
      return;
    }
  }
}

/**
 * Clear all input handlers
 * Useful for cleanup
 */
export function clearInputHandlers(): void {
  inputHandlers.clear();
}
