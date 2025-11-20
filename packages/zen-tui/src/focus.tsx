/**
 * Focus Management for Interactive TUI Components
 *
 * Provides context and utilities for managing focus state
 * across interactive components (inputs, buttons, etc.)
 */

import { createContext, signal, useContext } from '@zen/runtime';

export interface FocusableItem {
  id: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface FocusContextValue {
  focusedId: ReturnType<typeof signal<string | null>>;
  items: ReturnType<typeof signal<FocusableItem[]>>;
  register: (item: FocusableItem) => () => void;
  focus: (id: string) => void;
  focusNext: () => void;
  focusPrev: () => void;
}

const FocusContext = createContext(null as FocusContextValue | null);

/**
 * Focus Provider - manages focus state for child components
 */
export function FocusProvider(props: { children: any }): any {
  const focusedId = signal<string | null>(null);
  const items = signal<FocusableItem[]>([]);

  const register = (item: FocusableItem) => {
    items.value = [...items.value, item];

    // Auto-focus first item if nothing is focused
    if (focusedId.value === null) {
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
    const currentId = focusedId.value;
    if (currentId === id) return;

    // Blur current
    if (currentId) {
      const current = items.value.find((i: FocusableItem) => i.id === currentId);
      current?.onBlur?.();
    }

    // Focus new
    focusedId.value = id;
    const newItem = items.value.find((i: FocusableItem) => i.id === id);
    newItem?.onFocus?.();
  };

  const focusNext = () => {
    const itemList = items.value;
    if (itemList.length === 0) return;

    const currentIndex = itemList.findIndex((i: FocusableItem) => i.id === focusedId.value);
    const nextIndex = (currentIndex + 1) % itemList.length;
    focus(itemList[nextIndex].id);
  };

  const focusPrev = () => {
    const itemList = items.value;
    if (itemList.length === 0) return;

    const currentIndex = itemList.findIndex((i: FocusableItem) => i.id === focusedId.value);
    const prevIndex = currentIndex <= 0 ? itemList.length - 1 : currentIndex - 1;
    focus(itemList[prevIndex].id);
  };

  const contextValue: FocusContextValue = {
    focusedId,
    items,
    register,
    focus,
    focusNext,
    focusPrev,
  };

  // Call Provider directly (not via JSX) because Bun uses React's JSX runtime
  // which doesn't call component functions. Provider uses children() helper
  // internally for runtime lazy evaluation.
  return FocusContext.Provider({ value: contextValue, children: props.children });
}

/**
 * Hook to access focus context
 */
export function useFocusContext(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocusContext must be used within FocusProvider');
  }
  return ctx;
}

/**
 * Hook to make a component focusable
 * Works in standalone mode if no FocusProvider is present
 */
export function useFocusable(
  id: string,
  callbacks?: { onFocus?: () => void; onBlur?: () => void },
) {
  const ctx = useContext(FocusContext);

  // Standalone mode (no FocusProvider)
  if (!ctx) {
    return {
      isFocused: () => false,
      focus: () => {},
      unregister: () => {},
    };
  }

  // Register on mount, unregister on cleanup
  const unregister = ctx.register({
    id,
    onFocus: callbacks?.onFocus,
    onBlur: callbacks?.onBlur,
  });

  // Clean up on unmount
  // Note: In a real implementation with Zen runtime, this would use onCleanup()
  // For now, we return the unregister function for manual cleanup if needed

  const isFocused = () => ctx.focusedId.value === id;

  return {
    isFocused,
    focus: () => ctx.focus(id),
    unregister,
  };
}
