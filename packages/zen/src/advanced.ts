/**
 * Advanced APIs for opt-in usage
 *
 * These features are performance-optimized but add bundle size.
 * Import only when needed.
 *
 * @example
 * ```typescript
 * import { untracked, dispose, onMount } from '@sylphx/zen/advanced';
 *
 * const count = zen(0);
 * const doubled = computed([count], c => {
 *   // Debug without creating dependency
 *   untracked(() => console.log('Computing...'));
 *   return c * 2;
 * });
 *
 * // Cleanup when done
 * dispose(doubled);
 *
 * // Lifecycle with cleanup
 * onMount(count, () => {
 *   const timer = setInterval(() => set(count, get(count) + 1), 1000);
 *   return () => clearInterval(timer);
 * });
 * ```
 *
 * @module advanced
 * @see {@link https://github.com/sylphxltd/zen/blob/main/packages/zen/README.md}
 */

// ✅ PHASE 1 OPTIMIZATION: Enhanced lifecycle functions with cleanup support
export { onStart, onStop, onMount, cleanup } from './lifecycle';
export type { CleanupFn, LifecycleCallback } from './lifecycle';

// ✅ PHASE 1 OPTIMIZATION: Untracked execution utilities
export { untracked, tracked, isTracking } from './untracked';

// ✅ PHASE 1 OPTIMIZATION: Computed disposal for resource cleanup
export { dispose } from './computed';
