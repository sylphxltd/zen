/**
 * Focus Management for Interactive TUI Components
 *
 * Ink-compatible API with SolidJS-style fine-grained reactivity.
 *
 * ## Design Philosophy
 *
 * Focus management in TUI apps differs from web browsers:
 * - No native focus system (terminals don't have focusable elements)
 * - We must track focus state manually and style focused components
 * - Tab/Shift+Tab navigation must be implemented in userland
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     FocusProvider                           │
 * │  - Manages list of focusable items                         │
 * │  - Tracks which item is currently focused (activeId)       │
 * │  - Handles Tab/Shift+Tab navigation automatically          │
 * │  - Escape resets focus to undefined                        │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌───────────────────┼───────────────────┐
 *          ▼                   ▼                   ▼
 *    ┌──────────┐        ┌──────────┐        ┌──────────┐
 *    │  useFocus │        │  useFocus │        │  useFocus │
 *    │  id: 'a'  │        │  id: 'b'  │        │  id: 'c'  │
 *    └──────────┘        └──────────┘        └──────────┘
 *          │                   │                   │
 *          ▼                   ▼                   ▼
 *    ┌──────────┐        ┌──────────┐        ┌──────────┐
 *    │  useInput │        │  useInput │        │  useInput │
 *    │isActive:  │        │isActive:  │        │isActive:  │
 *    │isFocused  │        │isFocused  │        │isFocused  │
 *    └──────────┘        └──────────┘        └──────────┘
 * ```
 *
 * ## Ink Compatibility
 *
 * API matches React Ink for easy migration:
 * - useFocus({ id, autoFocus, isActive })
 * - useFocusManager() for programmatic control
 * - Tab/Shift+Tab navigation built-in
 *
 * ## Signals-based Differences
 *
 * Unlike Ink (React-based), we use fine-grained reactivity:
 *
 * | Ink (React)                    | @rapid/tui (Signals)                    |
 * |--------------------------------|---------------------------------------|
 * | isFocused: boolean             | isFocused: Computed<boolean>          |
 * | Re-renders entire component    | Only updates dependent expressions    |
 * | useEffect for isActive changes | effect() with automatic tracking      |
 *
 * This means focus changes don't trigger full re-renders, only the
 * specific parts of the UI that depend on isFocused.value update.
 *
 * @module
 */

import {
  computed,
  createContext,
  createUniqueId,
  effect,
  onCleanup,
  onMount,
  signal,
  useContext,
} from '@rapid/runtime';
import { useInput } from '../hooks/useInput.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Represents a focusable item in the focus registry.
 *
 * Each item has:
 * - id: Unique identifier for programmatic focus control
 * - isActive: Whether the item can currently receive focus
 *   (inactive items are skipped during Tab navigation)
 */
export interface FocusableItem {
  id: string;
  isActive: boolean;
}

/**
 * Focus context value - internal API for focus management.
 *
 * This matches Ink's FocusContext structure for compatibility:
 * - add/remove: Register/unregister focusable elements
 * - activate/deactivate: Enable/disable focus for an element
 * - focusNext/focusPrevious: Tab navigation
 * - focus: Direct focus by ID
 */
export interface FocusContextValue {
  /** Currently focused element ID (signal for reactivity) */
  activeId: ReturnType<typeof signal<string | undefined>>;
  /** List of registered focusable items (signal for reactivity) */
  focusables: ReturnType<typeof signal<FocusableItem[]>>;
  /** Register a focusable element */
  add: (id: string, options: { autoFocus: boolean }) => void;
  /** Unregister a focusable element */
  remove: (id: string) => void;
  /** Mark element as active (can receive focus) */
  activate: (id: string) => void;
  /** Mark element as inactive (cannot receive focus, but keeps position) */
  deactivate: (id: string) => void;
  /** Enable focus management globally */
  enableFocus: () => void;
  /** Disable focus management globally */
  disableFocus: () => void;
  /** Focus next element (Tab behavior) */
  focusNext: () => void;
  /** Focus previous element (Shift+Tab behavior) */
  focusPrevious: () => void;
  /** Focus specific element by ID */
  focus: (id: string) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

// =============================================================================
// FocusProvider
// =============================================================================

/**
 * Focus Provider - manages focus state for child components.
 *
 * ## Usage
 *
 * Wrap your app or a section of it with FocusProvider:
 *
 * ```tsx
 * <FocusProvider>
 *   <TextInput focusId="name" autoFocus />
 *   <TextInput focusId="email" />
 *   <Button focusId="submit" />
 * </FocusProvider>
 * ```
 *
 * ## Keyboard Navigation (Ink-compatible)
 *
 * - **Tab**: Focus next active element
 * - **Shift+Tab**: Focus previous active element
 * - **Escape**: Reset focus to undefined (blur all)
 *
 * ## Focus Order
 *
 * Elements are focused in the order they call useFocus() (render order).
 * This matches Ink's behavior - first rendered = first in tab order.
 *
 * ## Signals-based Implementation
 *
 * Unlike Ink's React setState, we use signals:
 * - activeId is a signal, so focus changes are fine-grained
 * - Components only re-render the parts that depend on isFocused
 * - No need for React's batching - signals batch automatically
 */
export function FocusProvider(props: { children: unknown }): unknown {
  // Current focused element ID (undefined = nothing focused)
  const activeId = signal<string | undefined>(undefined);

  // Registry of all focusable elements in render order
  const focusables = signal<FocusableItem[]>([]);

  // Global enable/disable for focus management
  const isFocusEnabled = signal(true);

  // Add a focusable element (Ink-compatible)
  const add = (id: string, options: { autoFocus: boolean }) => {
    // Add to list
    focusables.value = [...focusables.value, { id, isActive: true }];

    // Auto-focus if requested and no current focus
    if (options.autoFocus && activeId.value === undefined) {
      activeId.value = id;
    }
  };

  // Remove a focusable element (Ink-compatible)
  const remove = (id: string) => {
    focusables.value = focusables.value.filter((f) => f.id !== id);
    // Clear focus if removed element was focused
    if (activeId.value === id) {
      activeId.value = undefined;
    }
  };

  // Activate a focusable element (can receive focus)
  const activate = (id: string) => {
    focusables.value = focusables.value.map((f) => (f.id === id ? { ...f, isActive: true } : f));
  };

  // Deactivate a focusable element (cannot receive focus)
  const deactivate = (id: string) => {
    focusables.value = focusables.value.map((f) => (f.id === id ? { ...f, isActive: false } : f));
    // Clear focus if deactivated element was focused
    if (activeId.value === id) {
      activeId.value = undefined;
    }
  };

  const enableFocus = () => {
    isFocusEnabled.value = true;
  };

  const disableFocus = () => {
    isFocusEnabled.value = false;
  };

  // Focus specific element by ID (Ink-compatible)
  const focus = (id: string) => {
    if (!isFocusEnabled.value) return;

    // Only focus if element exists and is active
    const item = focusables.value.find((f) => f.id === id && f.isActive);
    if (item) {
      activeId.value = id;
    }
  };

  // Find next focusable element (Ink-compatible behavior)
  const findNextFocusable = (): string | undefined => {
    const active = focusables.value.filter((f) => f.isActive);
    if (active.length === 0) return undefined;

    const currentIndex = active.findIndex((f) => f.id === activeId.value);

    // Search forward from current position
    for (let i = currentIndex + 1; i < active.length; i++) {
      if (active[i].isActive) {
        return active[i].id;
      }
    }

    return undefined; // No next found, will wrap to first
  };

  // Find previous focusable element (Ink-compatible behavior)
  const findPreviousFocusable = (): string | undefined => {
    const active = focusables.value.filter((f) => f.isActive);
    if (active.length === 0) return undefined;

    const currentIndex = active.findIndex((f) => f.id === activeId.value);

    // Search backward from current position
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (active[i].isActive) {
        return active[i].id;
      }
    }

    return undefined; // No previous found, will wrap to last
  };

  // Focus next element (Ink-compatible: wraps to first if at end)
  const focusNext = () => {
    if (!isFocusEnabled.value) return;

    const active = focusables.value.filter((f) => f.isActive);
    if (active.length === 0) return;

    const firstId = active[0]?.id;
    const nextId = findNextFocusable();

    activeId.value = nextId ?? firstId;
  };

  // Focus previous element (Ink-compatible: wraps to last if at start)
  const focusPrevious = () => {
    if (!isFocusEnabled.value) return;

    const active = focusables.value.filter((f) => f.isActive);
    if (active.length === 0) return;

    const lastId = active[active.length - 1]?.id;
    const prevId = findPreviousFocusable();

    activeId.value = prevId ?? lastId;
  };

  const contextValue: FocusContextValue = {
    activeId,
    focusables,
    add,
    remove,
    activate,
    deactivate,
    enableFocus,
    disableFocus,
    focusNext,
    focusPrevious,
    focus,
  };

  // Automatic Tab navigation (Ink-compatible)
  useInput((_input, key) => {
    if (!isFocusEnabled.value) return;
    if (focusables.value.length === 0) return;

    if (key.tab && !key.shift) {
      focusNext();
    } else if (key.tab && key.shift) {
      focusPrevious();
    } else if (key.escape && activeId.value !== undefined) {
      // Escape resets focus (Ink behavior)
      activeId.value = undefined;
    }
  });

  // Use manual getter pattern for framework-level providers
  return FocusContext.Provider({
    value: contextValue,
    get children() {
      return props.children;
    },
  });
}

// =============================================================================
// useFocusManager Hook
// =============================================================================

/**
 * Hook to access focus manager (Ink-compatible API).
 *
 * Use this for programmatic focus control from anywhere in the tree.
 * Unlike useFocus(), this doesn't register the component as focusable.
 *
 * ## When to use
 *
 * - Moving focus based on user actions (e.g., focus search after pressing '/')
 * - Building custom navigation (e.g., arrow key navigation between sections)
 * - Disabling focus during modals or overlays
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { focus } = useFocusManager();
 *
 *   return (
 *     <Button onPress={() => focus('search-input')}>
 *       Search
 *     </Button>
 *   );
 * }
 * ```
 */
export function useFocusManager() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocusManager must be used within FocusProvider');
  }

  return {
    /** Enable focus management for all components */
    enableFocus: ctx.enableFocus,
    /** Disable focus management for all components */
    disableFocus: ctx.disableFocus,
    /** Switch focus to the next focusable component */
    focusNext: ctx.focusNext,
    /** Switch focus to the previous focusable component */
    focusPrevious: ctx.focusPrevious,
    /** Switch focus to the element with provided id */
    focus: ctx.focus,
  };
}

// =============================================================================
// useFocus Hook
// =============================================================================

/**
 * Options for useFocus hook (Ink-compatible).
 */
export interface UseFocusOptions {
  /**
   * Enable or disable this component's focus, while still maintaining
   * its position in the list of focusable components.
   * @default true
   */
  isActive?: boolean;

  /**
   * Auto-focus this component if there's no active (focused) component right now.
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Assign an ID to this component, so it can be programmatically
   * focused with `focus(id)`.
   */
  id?: string;

  /**
   * Callback when this component receives focus.
   */
  onFocus?: () => void;

  /**
   * Callback when this component loses focus.
   */
  onBlur?: () => void;
}

/**
 * Hook to make a component focusable (Ink-compatible API).
 *
 * A component that uses this hook becomes "focusable" to the system,
 * so when the user presses Tab, focus will switch to this component.
 *
 * ## Ink Compatibility
 *
 * This matches Ink's useFocus API:
 * - Same options: id, autoFocus, isActive
 * - Same return: isFocused, focus
 *
 * ## Signals Difference
 *
 * The key difference from Ink is that `isFocused` is a `Computed<boolean>`
 * instead of a plain `boolean`. This enables fine-grained reactivity:
 *
 * ```tsx
 * // Ink (React) - component re-renders on focus change
 * const { isFocused } = useFocus();
 * return <Box borderColor={isFocused ? 'blue' : 'gray'} />;
 *
 * // @rapid/tui (Signals) - only borderColor updates, no re-render
 * const { isFocused } = useFocus();
 * return <Box borderColor={() => isFocused.value ? 'blue' : 'gray'} />;
 * ```
 *
 * ## Usage with useInput
 *
 * The `isFocused` computed can be passed directly to useInput's isActive:
 *
 * ```tsx
 * const { isFocused } = useFocus({ id: 'my-input' });
 *
 * // Handler only active when focused (Ink pattern)
 * useInput((input, key) => {
 *   if (key.return) submit();
 * }, { isActive: isFocused });
 * ```
 *
 * @returns Object with:
 * - isFocused: Computed<boolean> - reactive focus state
 * - focus: (id: string) => void - focus specific element by ID
 */
export function useFocus(options: UseFocusOptions = {}) {
  const { isActive = true, autoFocus = false, id: customId } = options;

  const ctx = useContext(FocusContext);

  // Generate stable ID if not provided (matches Ink's behavior)
  const id = customId ?? `focus-${createUniqueId()}`;

  // ==========================================================================
  // Standalone mode (no FocusProvider)
  // ==========================================================================
  // When used outside FocusProvider, return dummy values.
  // This allows components to work without focus management.
  if (!ctx) {
    return {
      isFocused: computed(() => false),
      focus: (_id: string) => {},
    };
  }

  // ==========================================================================
  // Registration lifecycle
  // ==========================================================================
  // Register this component as focusable when it mounts.
  // This determines the tab order (first registered = first in tab order).
  onMount(() => {
    ctx.add(id, { autoFocus });

    // Cleanup: remove from focusables when unmounting
    onCleanup(() => {
      ctx.remove(id);
    });
  });

  // ==========================================================================
  // Dynamic isActive handling
  // ==========================================================================
  // Unlike Ink's useEffect, we use effect() for automatic dependency tracking.
  // When isActive changes (e.g., input becomes disabled), we update the
  // focusable's active state without removing it from the list.
  // This preserves tab order position while preventing focus.
  effect(() => {
    if (isActive) {
      ctx.activate(id);
    } else {
      ctx.deactivate(id);
    }
  });

  // ==========================================================================
  // Return value
  // ==========================================================================
  // isFocused is a Computed, not a boolean (signals difference from Ink).
  // This enables fine-grained reactivity - only expressions that read
  // isFocused.value will update when focus changes.
  const isFocused = computed(() => ctx.activeId.value === id);

  return {
    /** Whether this component is currently focused (Computed for reactivity) */
    isFocused,
    /** Focus a specific element by ID (convenience - same as useFocusManager().focus) */
    focus: ctx.focus,
  };
}
