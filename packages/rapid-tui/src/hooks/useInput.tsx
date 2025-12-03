/**
 * useInput hook - React Ink compatible keyboard input handling
 *
 * Allows components to handle keyboard input in a declarative way.
 * Supports reactive isActive for focus management (Ink-compatible).
 *
 * ## Design Philosophy
 *
 * This hook follows Ink's API while leveraging our signals-based reactivity:
 *
 * 1. **Ink Compatibility**: API matches React Ink for easy migration
 *    - Same handler signature: (input, key) => void
 *    - Same Key object properties
 *    - Same isActive option for conditional handling
 *
 * 2. **Signals-based Reactivity**: Unlike Ink's useEffect-based approach,
 *    we use effect() for automatic dependency tracking:
 *    - isActive can be a signal, computed, or getter
 *    - Handler registration/removal happens automatically when isActive changes
 *    - No manual dependency arrays needed
 *
 * 3. **Input Cleaning**: Following Ink's behavior:
 *    - Non-alphanumeric keys (arrows, F-keys, etc.) result in empty input string
 *    - Users check key.upArrow, key.escape, etc. instead of raw escape sequences
 *    - Uppercase letters automatically set key.shift = true
 *
 * ## Architecture
 *
 * ```
 * Terminal stdin
 *       │
 *       ▼
 * dispatchInput(rawInput)
 *       │
 *       ├─► parseKey(rawInput) → { key, input }
 *       │
 *       ▼
 * inputHandlers (Set)
 *       │
 *       ├─► handler1(input, key) → false (continue)
 *       ├─► handler2(input, key) → true  (stop propagation)
 *       └─► handler3 (not called)
 * ```
 *
 * ## Differences from Ink
 *
 * 1. **Stop Propagation**: Handler can return `true` to stop propagation
 *    (Ink doesn't have this - all handlers always receive input)
 *
 * 2. **Additional Keys**: home, end, f1-f12 (Ink doesn't have these)
 *
 * 3. **Reactive isActive**: Can be signal/computed, not just boolean
 *
 * @module
 */

import {
  type MaybeReactive,
  type Owner,
  effect,
  getOwner,
  onCleanup,
  resolve,
} from '@rapid/runtime';

/**
 * Input handler function.
 *
 * Ink-compatible: receives cleaned input string and key metadata.
 * Extension: Return `true` to stop propagation (event consumed).
 * Return `false` or `undefined` to allow other handlers to process.
 */
export type InputHandler = (input: string, key: Key) => boolean | undefined;

/**
 * Key metadata - Ink-compatible with additional keys
 */
export interface Key {
  /** Up arrow key was pressed */
  upArrow: boolean;
  /** Down arrow key was pressed */
  downArrow: boolean;
  /** Left arrow key was pressed */
  leftArrow: boolean;
  /** Right arrow key was pressed */
  rightArrow: boolean;
  /** Page Down key was pressed */
  pageDown: boolean;
  /** Page Up key was pressed */
  pageUp: boolean;
  /** Return (Enter) key was pressed */
  return: boolean;
  /** Escape key was pressed */
  escape: boolean;
  /** Ctrl key was pressed */
  ctrl: boolean;
  /** Shift key was pressed */
  shift: boolean;
  /** Tab key was pressed */
  tab: boolean;
  /** Backspace key was pressed */
  backspace: boolean;
  /** Delete key was pressed */
  delete: boolean;
  /** Meta key was pressed */
  meta: boolean;
  /** Space key was pressed */
  space: boolean;
  // Extensions (not in Ink)
  /** Home key was pressed */
  home: boolean;
  /** End key was pressed */
  end: boolean;
  /** F1-F12 keys */
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
  /**
   * Whether this handler is active (default: true)
   *
   * Ink-compatible: Can be a reactive value (signal, computed, getter).
   * When false, handler is completely removed from registry.
   * When true, handler is added to registry.
   *
   * @example
   * // Static
   * useInput(handler, { isActive: true });
   *
   * // With useFocus (Ink pattern)
   * const { isFocused } = useFocus();
   * useInput(handler, { isActive: isFocused });
   *
   * // With getter
   * useInput(handler, { isActive: () => someCondition });
   */
  isActive?: MaybeReactive<boolean>;
}

interface RegisteredHandler {
  handler: InputHandler;
  owner: Owner | null;
}

// Global registry of active input handlers
const inputHandlers: Set<RegisteredHandler> = new Set();

// Track registered handlers by owner to prevent duplicates
const ownerToHandler: WeakMap<Owner, RegisteredHandler> = new WeakMap();

/**
 * Register a keyboard input handler
 * React Ink compatible API
 *
 * @param handler - The input handler function. Return `true` to stop propagation.
 * @param options - Options including reactive isActive
 *
 * @example
 * // Basic usage - always active
 * useInput((input, key) => {
 *   if (key.escape) quit();
 * });
 *
 * @example
 * // With focus (Ink pattern)
 * const { isFocused } = useFocus();
 * useInput((input, key) => {
 *   if (key.return) submit();
 * }, { isActive: isFocused });
 */
export function useInput(handler: InputHandler, options?: UseInputOptions): void {
  const isActiveOption = options?.isActive ?? true;
  const owner = getOwner();

  // Create handler object (reused across active/inactive transitions)
  let registered: RegisteredHandler | null = null;

  const addHandler = () => {
    if (registered) return; // Already added

    registered = { handler, owner };
    inputHandlers.add(registered);

    if (owner) {
      ownerToHandler.set(owner, registered);
    }
  };

  const removeHandler = () => {
    if (!registered) return; // Already removed

    inputHandlers.delete(registered);
    if (owner) {
      ownerToHandler.delete(owner);
    }
    registered = null;
  };

  // Use effect to track reactive isActive changes
  // This is the key difference from our previous implementation:
  // - React Ink uses useEffect with isActive as dependency
  // - We use effect() which automatically tracks signal/computed dependencies
  effect(() => {
    const isActive = resolve(isActiveOption);

    if (isActive) {
      addHandler();
    } else {
      removeHandler();
    }
  });

  // Cleanup when component unmounts
  onCleanup(() => {
    removeHandler();
  });
}

// =============================================================================
// Key Parsing - Ink-compatible input processing
// =============================================================================

/**
 * Non-alphanumeric key names that should result in empty input string.
 *
 * ## Why clear input for these keys?
 *
 * Ink's design philosophy: the `input` parameter should only contain
 * printable characters that the user typed. Special keys like arrows,
 * function keys, etc. are represented in the `key` object instead.
 *
 * This allows patterns like:
 * ```ts
 * useInput((input, key) => {
 *   if (input === 'q') quit();           // 'q' key
 *   if (key.upArrow) moveUp();           // Up arrow (input is '')
 *   if (input && !key.ctrl) type(input); // Any printable char
 * });
 * ```
 *
 * Without this clearing, arrow keys would have input like '\x1B[A'
 * which is confusing and error-prone.
 *
 * NOTE: 'space' is NOT in this set because space is a printable character.
 * Users expect `input === ' '` when they press spacebar.
 */
const nonAlphanumericKeys = new Set([
  'up',
  'down',
  'left',
  'right',
  'pageup',
  'pagedown',
  'home',
  'end',
  'insert',
  'delete',
  'escape',
  'tab',
  'return',
  'enter',
  'backspace',
  'clear',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'f10',
  'f11',
  'f12',
  // NOTE: 'space' intentionally NOT included - space is printable
]);

/**
 * Key name mapping from terminal escape sequences to readable names.
 *
 * Terminals send escape sequences for special keys. For example:
 * - Up arrow: \x1B[A (ESC [ A)
 * - F1: \x1BOP (ESC O P) or \x1B[11~ (ESC [ 1 1 ~)
 *
 * Different terminals use different sequences, so we map multiple
 * sequences to the same key name. Based on Ink's parse-keypress.ts
 * which handles xterm, gnome-terminal, rxvt, and Cygwin.
 */
const keyNameMap: Record<string, string> = {
  // xterm/gnome ESC O letter
  OP: 'f1',
  OQ: 'f2',
  OR: 'f3',
  OS: 'f4',
  // xterm/rxvt ESC [ number ~
  '[11~': 'f1',
  '[12~': 'f2',
  '[13~': 'f3',
  '[14~': 'f4',
  '[15~': 'f5',
  '[17~': 'f6',
  '[18~': 'f7',
  '[19~': 'f8',
  '[20~': 'f9',
  '[21~': 'f10',
  '[23~': 'f11',
  '[24~': 'f12',
  // Cygwin/libuv
  '[[A': 'f1',
  '[[B': 'f2',
  '[[C': 'f3',
  '[[D': 'f4',
  '[[E': 'f5',
  // xterm ESC [ letter
  '[A': 'up',
  '[B': 'down',
  '[C': 'right',
  '[D': 'left',
  '[E': 'clear',
  '[F': 'end',
  '[H': 'home',
  // xterm/gnome ESC O letter
  OA: 'up',
  OB: 'down',
  OC: 'right',
  OD: 'left',
  OE: 'clear',
  OF: 'end',
  OH: 'home',
  // xterm/rxvt ESC [ number ~
  '[1~': 'home',
  '[2~': 'insert',
  '[3~': 'delete',
  '[4~': 'end',
  '[5~': 'pageup',
  '[6~': 'pagedown',
  '[7~': 'home',
  '[8~': 'end',
  // Shift+Tab
  '[Z': 'tab',
};

interface ParsedKey {
  name: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  sequence: string;
}

/**
 * Parse raw input into key name and modifiers
 * Based on Ink's parse-keypress.ts
 */
function parseKeypress(s: string): ParsedKey {
  const result: ParsedKey = {
    name: '',
    ctrl: false,
    shift: false,
    meta: false,
    sequence: s,
  };

  if (s === '\r') {
    result.name = 'return';
  } else if (s === '\n') {
    result.name = 'enter';
  } else if (s === '\t') {
    result.name = 'tab';
  } else if (s === '\b' || s === '\x1b\b') {
    result.name = 'backspace';
    result.meta = s.charAt(0) === '\x1b';
  } else if (s === '\x7f' || s === '\x1b\x7f') {
    result.name = 'backspace'; // Ink treats delete key input as backspace for name
    result.meta = s.charAt(0) === '\x1b';
  } else if (s === '\x1b' || s === '\x1b\x1b') {
    result.name = 'escape';
    result.meta = s.length === 2;
  } else if (s === ' ' || s === '\x1b ') {
    result.name = 'space';
    result.meta = s.length === 2;
  } else if (s.length === 1 && s <= '\x1a') {
    // ctrl+letter (charCode 1-26)
    result.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
    result.ctrl = true;
  } else if (s.length === 1 && s >= 'a' && s <= 'z') {
    // lowercase letter
    result.name = s;
  } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
    // uppercase letter (shift)
    result.name = s.toLowerCase();
    result.shift = true;
  } else if (s.startsWith('\x1b')) {
    // Escape sequence
    const code = s.slice(1); // Remove leading ESC
    const mappedName = keyNameMap[code];
    if (mappedName) {
      result.name = mappedName;
      // Check for shift (Shift+Tab)
      if (code === '[Z') {
        result.shift = true;
      }
    } else {
      result.meta = true;
    }
  } else if (s.length === 1) {
    // Other single character (numbers, symbols)
    result.name = s;
  }

  return result;
}

/**
 * Parse key press and return Key object + cleaned input
 * Ink-compatible behavior
 */
export function parseKey(str: string): { key: Key; input: string } {
  const parsed = parseKeypress(str);

  // Build Key object
  const key: Key = {
    upArrow: parsed.name === 'up',
    downArrow: parsed.name === 'down',
    leftArrow: parsed.name === 'left',
    rightArrow: parsed.name === 'right',
    pageDown: parsed.name === 'pagedown',
    pageUp: parsed.name === 'pageup',
    return: parsed.name === 'return' || parsed.name === 'enter',
    escape: parsed.name === 'escape',
    ctrl: parsed.ctrl,
    shift: parsed.shift,
    tab: parsed.name === 'tab',
    backspace: parsed.name === 'backspace',
    delete: str === '\x1B[3~', // Actual delete key sequence
    meta: parsed.meta || parsed.name === 'escape',
    space: parsed.name === 'space',
    // Extensions
    home: parsed.name === 'home',
    end: parsed.name === 'end',
    f1: parsed.name === 'f1',
    f2: parsed.name === 'f2',
    f3: parsed.name === 'f3',
    f4: parsed.name === 'f4',
    f5: parsed.name === 'f5',
    f6: parsed.name === 'f6',
    f7: parsed.name === 'f7',
    f8: parsed.name === 'f8',
    f9: parsed.name === 'f9',
    f10: parsed.name === 'f10',
    f11: parsed.name === 'f11',
    f12: parsed.name === 'f12',
  };

  // Determine input string (Ink-compatible)
  // For ctrl+key, use the key name; otherwise use the sequence
  let input = parsed.ctrl ? parsed.name : parsed.sequence;

  // Clear input for non-alphanumeric keys (Ink behavior)
  if (nonAlphanumericKeys.has(parsed.name)) {
    input = '';
  }

  // Strip remaining escape sequences from input
  if (input.startsWith('\x1b')) {
    input = input.slice(1);
  }

  // Detect shift for uppercase letters (already handled in parseKeypress, but ensure key.shift is set)
  if (input.length === 1 && /[A-Z]/.test(input)) {
    key.shift = true;
  }

  return { key, input };
}

/**
 * Dispatch keyboard input to all registered handlers
 * Called by renderToTerminalReactive's onKeyPress
 *
 * Ink-compatible: All active handlers receive the input.
 * Extension: If a handler returns `true`, propagation stops.
 */
export function dispatchInput(rawInput: string): void {
  const { key, input } = parseKey(rawInput);

  // CRITICAL: Copy handlers to array before iterating
  // Handlers may modify the Set (via signal updates triggering re-renders)
  // which would cause infinite iteration if we iterate the Set directly
  const handlers = [...inputHandlers];

  for (let i = 0; i < handlers.length; i++) {
    const consumed = handlers[i].handler(input, key);
    if (consumed === true) {
      // Event was consumed, stop propagation (extension over Ink)
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
