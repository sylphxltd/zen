/**
 * Reactive utilities for type-safe reactive value handling
 *
 * Provides a unified way to handle values that can be:
 * - Plain values (static)
 * - Functions that return values (reactive)
 * - Signals containing values (reactive)
 */

import type { AnySignal } from '@zen/signal';

/**
 * A reactive value - must be a function or signal
 *
 * @example
 * const isVisible: Reactive<boolean> = () => count.value > 0;
 * const isVisible: Reactive<boolean> = computed(() => count.value > 0);
 */
export type Reactive<T> = (() => T) | AnySignal;

/**
 * A value that can be reactive or static
 *
 * @example
 * const items: MaybeReactive<string[]> = ['a', 'b', 'c'];  // Static
 * const items: MaybeReactive<string[]> = () => todos.value;  // Reactive
 * const items: MaybeReactive<string[]> = todos;  // Reactive signal
 */
export type MaybeReactive<T> = T | Reactive<T>;

/**
 * Check if a value is a signal
 */
// biome-ignore lint/suspicious/noExplicitAny: Need any for type guard parameter
export function isSignal(value: any): value is AnySignal {
  return value !== null && typeof value === 'object' && '_kind' in value;
}

/**
 * Resolve a reactive or static value to its actual value
 *
 * When called inside an effect, automatically tracks reactive dependencies.
 *
 * @example
 * effect(() => {
 *   const value = resolve(maybeReactive);  // Automatically tracks if reactive
 * });
 */
export function resolve<T>(value: Reactive<T> | T): T {
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  if (isSignal(value)) {
    return value.value;
  }
  return value as T;
}

/**
 * Execute a component function with proper owner scope
 *
 * Used by JSX runtimes to wrap component execution with signal ownership tracking.
 * This ensures that effects and computed values created inside the component
 * are properly disposed when the component is unmounted.
 *
 * @example
 * // In jsx-runtime
 * if (typeof type === 'function') {
 *   return executeComponent(
 *     () => type(props),
 *     (node, owner) => attachNodeToOwner(node, owner)
 *   );
 * }
 */
export function executeComponent<T>(
  fn: () => T,
  attachToOwner?: (node: T, owner: import('@zen/signal').Owner) => void
): T {
  // Import at runtime to avoid circular dependency
  const { createOwner, setOwner, getOwner } = require('@zen/signal');

  const owner = createOwner();
  const prev = getOwner();
  setOwner(owner);

  try {
    const result = fn();
    if (attachToOwner) {
      attachToOwner(result, owner);
    }
    return result;
  } finally {
    setOwner(prev);
  }
}
