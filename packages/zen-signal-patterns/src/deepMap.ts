import { computed, subscribe, zen } from '@zen/signal';
import type { ComputedZen, Unsubscribe, Zen } from '@zen/signal';

export type Path = string | (string | number)[];

export interface DeepMapStore<T extends object> {
  readonly value: T;
  // biome-ignore lint/suspicious/noExplicitAny: Paths can point to values of any type
  setPath(path: Path, value: any): void;
  // biome-ignore lint/suspicious/noExplicitAny: Path values can be any type
  selectPath(path: Path): ComputedZen<any>;
  _state: Zen<T>;
  // biome-ignore lint/suspicious/noExplicitAny: Cache stores computed values of unknown types
  _cache: Map<string, ComputedZen<any>>;
}

// Helper: path to cache key
const pathToKey = (path: Path): string => {
  return Array.isArray(path) ? path.join('.') : path;
};

// Helper: parse path string (supports 'a.b[0].c')
const parsePath = (path: Path): (string | number)[] => {
  if (Array.isArray(path)) return path;

  const str = String(path);
  // Handle brackets: 'a[0].b' -> ['a', 0, 'b']
  return str
    .replace(/\[(\d+)\]/g, '.$1') // a[0] -> a.0
    .split('.')
    .map((s) => (/^\d+$/.test(s) ? Number.parseInt(s, 10) : s));
};

// Helper: get deep value
// biome-ignore lint/suspicious/noExplicitAny: Generic deep access requires any type
const getDeep = (obj: any, path: Path): any => {
  const keys = parsePath(path);
  let value = obj;
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
};

// Helper: set deep value (immutable)
// biome-ignore lint/suspicious/noExplicitAny: Generic deep modification requires any type
const setDeep = (obj: any, path: Path, value: any): any => {
  const keys = parsePath(path);

  if (keys.length === 0) return value;

  const [first, ...rest] = keys;

  if (keys.length === 1) {
    // Leaf node
    if (Array.isArray(obj)) {
      const arr = [...obj];
      arr[first as number] = value;
      return arr;
    }
    return { ...obj, [first]: value };
  }

  // Recursive
  const nested = obj?.[first];
  const isArrayIndex = typeof rest[0] === 'number';
  const defaultNested = isArrayIndex ? [] : {};

  const updated = setDeep(nested ?? defaultNested, rest, value);

  if (Array.isArray(obj)) {
    const arr = [...obj];
    arr[first as number] = updated;
    return arr;
  }

  return { ...obj, [first]: updated };
};

/**
 * Creates a deep map store with path-level reactivity
 *
 * Uses computed() for selective notifications at any nesting level.
 *
 * @example
 * ```typescript
 * const config = deepMap({
 *   ui: {
 *     theme: 'dark',
 *     layout: { sidebar: 'left' }
 *   }
 * });
 *
 * // Listen to nested path
 * const themeZ = config.selectPath('ui.theme');
 * subscribe(themeZ, (value) => console.log('Theme:', value));
 *
 * // Update nested path
 * config.setPath('ui.layout.sidebar', 'right'); // themeZ won't trigger!
 * config.setPath('ui.theme', 'light');          // themeZ will trigger!
 * ```
 */
export function deepMap<T extends object>(initial: T): DeepMapStore<T> {
  const state = zen(initial);
  // biome-ignore lint/suspicious/noExplicitAny: Cache stores computed values of unknown types
  const cache = new Map<string, ComputedZen<any>>();

  return {
    get value() {
      return state.value;
    },

    // biome-ignore lint/suspicious/noExplicitAny: Paths can point to values of any type
    setPath(path: Path, value: any) {
      state.value = setDeep(state.value, path, value);
    },

    // biome-ignore lint/suspicious/noExplicitAny: Path values can be any type
    selectPath(path: Path): ComputedZen<any> {
      const key = pathToKey(path);

      if (!cache.has(key)) {
        cache.set(
          key,
          computed(() => getDeep(state.value, path)),
        );
      }

      const cached = cache.get(key);
      if (!cached) throw new Error(`Path ${String(path)} not found in cache`);
      return cached;
    },

    _state: state,
    _cache: cache,
  };
}

/**
 * Helper to listen to specific paths
 *
 * @example
 * ```typescript
 * const config = deepMap({ ui: { theme: 'dark' } });
 *
 * listenPaths(config, ['ui.theme'], (value, path) => {
 *   console.log('Theme changed:', value);
 * });
 *
 * config.setPath('ui.theme', 'light'); // Will trigger!
 * ```
 */
export function listenPaths<T extends object>(
  deepMapStore: DeepMapStore<T>,
  paths: Path[],
  // biome-ignore lint/suspicious/noExplicitAny: Path values can be any type
  listener: (value: any, path: Path, obj: T) => void,
): Unsubscribe {
  const unsubscribers = paths.map((path) => {
    const pathZ = deepMapStore.selectPath(path);
    return subscribe(pathZ, (value) => listener(value, path, deepMapStore.value));
  });

  return () => {
    for (const u of unsubscribers) {
      u();
    }
  };
}

/**
 * Helper to set a path value (alternative syntax)
 */
export function setPath<T extends object>(
  deepMapStore: DeepMapStore<T>,
  path: Path,
  // biome-ignore lint/suspicious/noExplicitAny: Path values can be any type
  value: any,
): void {
  deepMapStore.setPath(path, value);
}
