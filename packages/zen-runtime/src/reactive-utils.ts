/**
 * Reactive utilities for type-safe reactive value handling
 *
 * Provides a unified way to handle values that can be:
 * - Plain values (static)
 * - Functions that return values (reactive)
 * - Signals containing values (reactive)
 */

import type { AnySignal } from '@zen/signal';
import { createOwner, getOwner, setOwner } from '@zen/signal';

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
  attachToOwner?: (node: T, owner: import('@zen/signal').Owner) => void,
): T {
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

/**
 * Make props.children lazy for proper Context propagation
 *
 * Runtime-First Architecture: Without compiler, JSX eagerly evaluates children,
 * causing them to execute BEFORE parent component setup. This breaks Context
 * providers because children try to access context before it's been set.
 *
 * This helper transforms eager children into a lazy getter, ensuring children
 * evaluate AFTER the parent component has set up context.
 *
 * Owner Tree (Broken - Eager):
 *   Root
 *   ├─ Child (executed first, can't find context)
 *   └─ Provider (executed second, sets context too late)
 *
 * Owner Tree (Fixed - Lazy):
 *   Root
 *   └─ Provider (executed first, sets context)
 *      └─ Child (executed second, finds context ✓)
 *
 * @example
 * // In jsx-runtime.ts
 * if (typeof type === 'function') {
 *   const lazyProps = makeLazyProps(props);
 *   return executeComponent(() => type(lazyProps), ...);
 * }
 *
 * @param props - Component props with possibly eager children
 * @returns Props with lazy children getter
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic props type
export function makeLazyProps(props: Record<string, any> | null): Record<string, any> | null {
  if (!props || !('children' in props)) {
    return props; // No children to make lazy
  }

  // Already a function (lazy) - don't double-wrap
  if (typeof props.children === 'function') {
    return props;
  }

  // Make children lazy via getter
  const children = props.children;
  return {
    ...props,
    get children() {
      return children;
    },
  };
}
