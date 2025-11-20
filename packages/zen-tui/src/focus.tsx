/**
 * Focus Management for Interactive TUI Components
 *
 * Ink-compatible API with SolidJS-style fine-grained reactivity.
 * API matches React Ink, implementation uses signals.
 */

import { createContext, signal, useContext } from '@zen/runtime';

export interface FocusableItem {
  id: string;
  autoFocus?: boolean;
  isActive?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface FocusManagerValue {
  focusedId: ReturnType<typeof signal<string | null>>;
  items: ReturnType<typeof signal<FocusableItem[]>>;
  register: (item: FocusableItem) => () => void;
  focus: (id: string) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  enableFocus: () => void;
  disableFocus: () => void;
}

const FocusContext = createContext(null as FocusManagerValue | null);

/**
 * Focus Provider - manages focus state for child components
 */
export function FocusProvider(props: { children: unknown }): unknown {
  const focusedId = signal<string | null>(null);
  const items = signal<FocusableItem[]>([]);
  const focusEnabled = signal(true);

  const register = (item: FocusableItem) => {
    items.value = [...items.value, item];

    // Auto-focus if requested or first active item
    if (item.autoFocus || (focusedId.value === null && item.isActive !== false)) {
      focusedId.value = item.id;
      item.onFocus?.();
    }

    // Cleanup function
    return () => {
      items.value = items.value.filter((i: FocusableItem) => i.id !== item.id);
      if (focusedId.value === item.id) {
        focusedId.value = null;
      }
    };
  };

  const focus = (id: string) => {
    if (!focusEnabled.value) {
      return;
    }

    const currentId = focusedId.value;
    if (currentId === id) {
      return;
    }

    // Blur current
    if (currentId) {
      const current = items.value.find((i: FocusableItem) => i.id === currentId);
      current?.onBlur?.();
    }
    focusedId.value = id;
    const newItem = items.value.find((i: FocusableItem) => i.id === id);
    newItem?.onFocus?.();
  };

  const focusNext = () => {
    if (!focusEnabled.value) {
      return;
    }

    const activeItems = items.value.filter((i) => i.isActive !== false);
    if (activeItems.length === 0) {
      return;
    }

    const currentIndex = activeItems.findIndex((i: FocusableItem) => i.id === focusedId.value);
    const nextIndex = (currentIndex + 1) % activeItems.length;
    focus(activeItems[nextIndex].id);
  };

  const focusPrevious = () => {
    if (!focusEnabled.value) return;

    const activeItems = items.value.filter((i) => i.isActive !== false);
    if (activeItems.length === 0) return;

    const currentIndex = activeItems.findIndex((i: FocusableItem) => i.id === focusedId.value);
    const prevIndex = currentIndex <= 0 ? activeItems.length - 1 : currentIndex - 1;
    focus(activeItems[prevIndex].id);
  };

  const enableFocus = () => {
    focusEnabled.value = true;
  };

  const disableFocus = () => {
    focusEnabled.value = false;
  };

  const contextValue: FocusManagerValue = {
    focusedId,
    items,
    register,
    focus,
    focusNext,
    focusPrevious,
    enableFocus,
    disableFocus,
  };

  // Provider uses children() helper internally for runtime lazy evaluation
  return FocusContext.Provider({ value: contextValue, children: props.children });
}

/**
 * Hook to access focus manager (Ink-compatible API)
 *
 * Returns methods to control focus programmatically.
 */
export function useFocusManager() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocusManager must be used within FocusProvider');
  }

  return {
    focus: ctx.focus,
    focusNext: ctx.focusNext,
    focusPrevious: ctx.focusPrevious,
    enableFocus: ctx.enableFocus,
    disableFocus: ctx.disableFocus,
  };
}

/**
 * Hook to make a component focusable (Ink-compatible API)
 *
 * Options:
 * - id: Optional unique identifier (auto-generated if not provided)
 * - autoFocus: Auto-focus this component on mount
 * - isActive: Whether this component can receive focus
 * - onFocus: Callback when component receives focus
 * - onBlur: Callback when component loses focus
 *
 * Returns:
 * - isFocused: Reactive boolean indicating focus state
 */
export function useFocus(options?: {
  id?: string;
  autoFocus?: boolean;
  isActive?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const ctx = useContext(FocusContext);

  // Generate ID if not provided
  const id = options?.id || `focus-${Math.random().toString(36).slice(2, 11)}`;

  // Standalone mode (no FocusProvider)
  if (!ctx) {
    return {
      get isFocused() {
        return false;
      },
    };
  }

  // Register on mount, unregister on cleanup
  ctx.register({
    id,
    autoFocus: options?.autoFocus,
    isActive: options?.isActive,
    onFocus: options?.onFocus,
    onBlur: options?.onBlur,
  });

  // Return reactive getter for isFocused (Ink-compatible API)
  // This works because JSX will call the getter during render
  return {
    get isFocused() {
      return ctx.focusedId.value === id;
    },
  };
}
