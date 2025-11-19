/**
 * Reactive utilities for type-safe reactive value handling
 *
 * Provides a unified way to handle values that can be:
 * - Plain values (static)
 * - Functions that return values (reactive)
 * - Signals containing values (reactive)
 */

import type { AnyZen } from '@zen/signal';

/**
 * A reactive value - must be a function or signal
 *
 * @example
 * const isVisible: Reactive<boolean> = () => count.value > 0;
 * const isVisible: Reactive<boolean> = computed(() => count.value > 0);
 */
export type Reactive<T> = (() => T) | AnyZen;

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
export function isSignal(value: any): value is AnyZen {
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
