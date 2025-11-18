import { type Zen, subscribe } from '@zen/signal';
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';

/**
 * Subscribes to a Zen store and returns a reactive Solid.js signal accessor.
 * The component will re-render when the store changes.
 *
 * @template Value The type of the store's value.
 * @param store The Zen store to subscribe to.
 * @returns A Solid.js signal accessor function that returns the current value.
 *
 * @example
 * ```tsx
 * import { zen } from '@zen/signal';
 * import { useStore } from '@zen/zen-solid';
 *
 * const count = zen(0);
 *
 * function Counter() {
 *   const value = useStore(count);
 *   return <div>{value()}</div>;  // Note: call value() to access
 * }
 * ```
 */
export function useStore<Value>(store: Zen<Value>): () => Value {
  const [value, setValue] = createSignal<Value>(store.value);

  // Subscribe on mount
  onMount(() => {
    // Sync check in case value changed
    setValue(() => store.value);

    // Subscribe to future changes
    const unsubscribe = subscribe(store, (newValue) => {
      setValue(() => newValue);
    });

    // Cleanup on unmount
    onCleanup(unsubscribe);
  });

  return value;
}

/**
 * Alternative: Creates a computed memo from a Zen store.
 * More efficient for derived values.
 *
 * @template Value The type of the store's value.
 * @param store The Zen store to subscribe to.
 * @returns A Solid.js memo accessor function.
 *
 * @example
 * ```tsx
 * import { zen } from '@zen/signal';
 * import { fromStore } from '@zen/zen-solid';
 *
 * const count = zen(0);
 *
 * function Counter() {
 *   const value = fromStore(count);
 *   return <div>{value()}</div>;
 * }
 * ```
 */
export function fromStore<Value>(store: Zen<Value>): () => Value {
  const [value, setValue] = createSignal<Value>(store.value, { equals: false });

  // Subscribe immediately (runs before mount)
  const unsubscribe = subscribe(store, (newValue) => {
    setValue(() => newValue);
  });

  // Cleanup
  onCleanup(unsubscribe);

  return value;
}
