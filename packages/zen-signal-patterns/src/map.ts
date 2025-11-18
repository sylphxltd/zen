import { computed, subscribe, zen } from '@zen/signal';
import type { ComputedZen, Unsubscribe, Zen } from '@zen/signal';

export interface MapStore<T extends object> {
  readonly value: T;
  setKey<K extends keyof T>(key: K, value: T[K]): void;
  selectKey<K extends keyof T>(key: K): ComputedZen<T[K]>;
  _state: Zen<T>;
  // biome-ignore lint/suspicious/noExplicitAny: Cache stores computed values of unknown types
  _cache: Map<keyof T, ComputedZen<any>>;
}

/**
 * Creates a map store with key-level reactivity
 *
 * Uses computed() under the hood for selective notifications.
 * Only components listening to changed keys will re-render.
 *
 * @example
 * ```typescript
 * const form = map({
 *   name: '',
 *   email: '',
 *   age: 0
 * });
 *
 * // Listen to specific key
 * const nameZ = form.selectKey('name');
 * subscribe(nameZ, (value) => console.log('Name:', value));
 *
 * // Update
 * form.setKey('email', 'test@example.com'); // nameZ won't trigger!
 * ```
 */
export function map<T extends object>(initial: T): MapStore<T> {
  const state = zen(initial);
  // biome-ignore lint/suspicious/noExplicitAny: Cache stores computed values of unknown types
  const cache = new Map<keyof T, ComputedZen<any>>();

  return {
    get value() {
      return state.value;
    },

    setKey<K extends keyof T>(key: K, value: T[K]) {
      state.value = { ...state.value, [key]: value };
    },

    selectKey<K extends keyof T>(key: K): ComputedZen<T[K]> {
      if (!cache.has(key)) {
        cache.set(
          key,
          computed(() => state.value[key]),
        );
      }
      const cached = cache.get(key);
      if (!cached) throw new Error(`Key ${String(key)} not found in cache`);
      return cached;
    },

    _state: state,
    _cache: cache,
  };
}

/**
 * Helper to listen to specific keys
 *
 * @example
 * ```typescript
 * const form = map({ name: '', email: '' });
 *
 * listenKeys(form, ['name'], (value, key) => {
 *   console.log('Name changed:', value);
 * });
 *
 * form.setKey('email', 'test'); // Won't trigger
 * form.setKey('name', 'John');  // Will trigger!
 * ```
 */
export function listenKeys<T extends object, K extends keyof T>(
  mapStore: MapStore<T>,
  keys: K[],
  listener: (value: T[K], key: K, obj: T) => void,
): Unsubscribe {
  const unsubscribers = keys.map((key) => {
    const keyZ = mapStore.selectKey(key);
    return subscribe(keyZ, (value) => listener(value, key, mapStore.value));
  });

  return () => {
    for (const u of unsubscribers) {
      u();
    }
  };
}

/**
 * Helper to set a key value (alternative syntax)
 */
export function setKey<T extends object, K extends keyof T>(
  mapStore: MapStore<T>,
  key: K,
  value: T[K],
): void {
  mapStore.setKey(key, value);
}
