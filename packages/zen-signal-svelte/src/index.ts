import { type Zen, subscribe } from '@zen/signal';

/**
 * Svelte-compatible store interface
 */
export interface Readable<T> {
  subscribe(subscriber: (value: T) => void): () => void;
}

/**
 * Converts a Zen store to a Svelte-compatible readable store.
 * The returned store can be used with Svelte's `$` syntax.
 *
 * @template Value The type of the store's value.
 * @param store The Zen store to convert.
 * @returns A Svelte-compatible readable store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { zen } from '@zen/signal';
 *   import { fromZen } from '@zen/zen-svelte';
 *
 *   const count = zen(0);
 *   const svelteCount = fromZen(count);
 * </script>
 *
 * <div>{$svelteCount}</div>
 * ```
 */
export function fromZen<Value>(store: Zen<Value>): Readable<Value> {
  return {
    subscribe(subscriber: (value: Value) => void): () => void {
      // Immediately call with current value (Svelte store contract)
      subscriber(store.value);

      // Subscribe to future changes
      return subscribe(store, subscriber);
    },
  };
}

/**
 * Hook-like function to use a Zen store in Svelte.
 * Returns a Svelte-compatible store that can be used with `$` syntax.
 *
 * This is just an alias for `fromZen` with a more hook-like name.
 *
 * @template Value The type of the store's value.
 * @param store The Zen store to use.
 * @returns A Svelte-compatible readable store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { zen } from '@zen/signal';
 *   import { useStore } from '@zen/zen-svelte';
 *
 *   const count = zen(0);
 *   const store = useStore(count);
 * </script>
 *
 * <div>{$store}</div>
 * ```
 */
export function useStore<Value>(store: Zen<Value>): Readable<Value> {
  return fromZen(store);
}
