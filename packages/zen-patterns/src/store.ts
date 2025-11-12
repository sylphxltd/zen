/**
 * Store pattern - Zustand-style factory function wrapper
 *
 * Provides a clean API for creating stores with encapsulated state and methods.
 *
 * @example
 * ```typescript
 * const counter = store(() => {
 *   const count = zen(0);
 *   return {
 *     count,
 *     increase: () => count.value++,
 *     decrease: () => count.value--
 *   };
 * });
 *
 * counter.increase();
 * console.log(counter.count.value); // 1
 * ```
 */
export function store<T>(factory: () => T): T {
  return factory();
}
