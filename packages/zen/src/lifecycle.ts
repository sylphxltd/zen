/**
 * Lifecycle utilities for ZenJS
 *
 * Even though components render once, lifecycle hooks are essential
 * for side effects that depend on DOM insertion.
 */

type CleanupFunction = () => void;

// Track cleanup functions for the current component
let currentCleanups: CleanupFunction[] | null = null;

/**
 * Run callback after component is mounted (inserted into DOM)
 *
 * Critical for:
 * - DOM measurements (offsetWidth, getBoundingClientRect)
 * - Third-party library initialization
 * - Focus/scroll operations
 * - Window/document event listeners
 * - Initial data fetching
 *
 * @example
 * ```tsx
 * function Component() {
 *   const ref = signal<HTMLElement | null>(null);
 *
 *   onMount(() => {
 *     console.log(ref.value?.offsetWidth); // Works!
 *     ref.value?.focus();
 *
 *     // Return cleanup function
 *     return () => console.log('Cleanup');
 *   });
 *
 *   return <div ref={(el) => ref.value = el}>Content</div>;
 * }
 * ```
 */
export function onMount(callback: () => undefined | CleanupFunction): void {
  // Use queueMicrotask to ensure DOM is inserted
  queueMicrotask(() => {
    const cleanup = callback();

    // Track cleanup function
    if (typeof cleanup === 'function') {
      if (currentCleanups) {
        currentCleanups.push(cleanup);
      }
    }
  });
}

/**
 * Register cleanup function to run when component is removed
 *
 * @example
 * ```tsx
 * function Component() {
 *   onMount(() => {
 *     const handler = () => console.log('resize');
 *     window.addEventListener('resize', handler);
 *
 *     onCleanup(() => {
 *       window.removeEventListener('resize', handler);
 *     });
 *   });
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function onCleanup(cleanup: CleanupFunction): void {
  if (currentCleanups) {
    currentCleanups.push(cleanup);
  }
}

/**
 * Create effect that runs after mount and cleans up on unmount
 *
 * Similar to React's useEffect, but runs once like Solid's createEffect
 *
 * @example
 * ```tsx
 * function Component() {
 *   const count = signal(0);
 *
 *   createEffect(() => {
 *     console.log('Count:', count.value);
 *
 *     return () => {
 *       console.log('Cleanup for count:', count.value);
 *     };
 *   });
 *
 *   return <button onClick={() => count.value++}>{count.value}</button>;
 * }
 * ```
 */
export function createEffect(effectFn: () => undefined | CleanupFunction): void {
  let cleanup: CleanupFunction | undefined;

  // Run effect after mount
  onMount(() => {
    cleanup = effectFn();

    // Return cleanup to onMount
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  });
}

// Internal: Set cleanup tracking context
export function _setCleanupContext(cleanups: CleanupFunction[] | null): void {
  currentCleanups = cleanups;
}

// Internal: Get current cleanups
export function _getCleanups(): CleanupFunction[] | null {
  return currentCleanups;
}
