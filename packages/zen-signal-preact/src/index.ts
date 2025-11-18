import { type Zen, subscribe } from '@zen/signal';
import { useEffect, useState } from 'preact/hooks';

/**
 * Subscribes to a Zen store and returns its value.
 * The component will re-render when the store changes.
 *
 * @template Value The type of the store's value.
 * @param store The Zen store to subscribe to.
 * @returns The current value of the store.
 *
 * @example
 * ```tsx
 * import { zen } from '@zen/signal';
 * import { useStore } from '@zen/zen-preact';
 *
 * const count = zen(0);
 *
 * function Counter() {
 *   const value = useStore(count);
 *   return <div>{value}</div>;
 * }
 * ```
 */
export function useStore<Value>(store: Zen<Value>): Value {
  const [value, setValue] = useState(() => store.value);

  useEffect(() => {
    // Sync check in case value changed between initial get() and subscribe()
    setValue(store.value);

    // Subscribe to future changes
    return subscribe(store, setValue);
  }, [store]);

  return value;
}
