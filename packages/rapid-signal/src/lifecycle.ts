/**
 * Lifecycle utilities for ZenJS
 *
 * Even though components render once, lifecycle hooks are essential
 * for side effects that depend on DOM insertion.
 *
 * Owner system provides component cleanup tracking similar to SolidJS.
 */

type CleanupFunction = () => void;

/**
 * Owner represents a component's lifecycle context
 * Forms a tree structure for hierarchical cleanup
 */
export type Owner = {
  cleanups: CleanupFunction[];
  children: Owner[];
  parent: Owner | null;
  disposed: boolean;
};

// Current owner context (set during component rendering)
let currentOwner: Owner | null = null;

// Server mode flag (disables effects/mounts during SSR)
let isServerMode = false;

// Map DOM nodes to their owners for cleanup tracking
const nodeOwners = new WeakMap<Node, Owner>();

/**
 * Set server rendering mode
 * When true, effects and mounts are skipped
 * @internal Used by renderToString
 */
export function setServerMode(mode: boolean): void {
  isServerMode = mode;
}

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
export function onMount(callback: () => void | undefined | CleanupFunction): void {
  // Skip in server mode (no DOM)
  if (isServerMode) return;

  // Capture owner synchronously (before queueMicrotask)
  const owner = currentOwner;

  // Use queueMicrotask to ensure DOM is inserted
  queueMicrotask(() => {
    // Temporarily restore owner context during callback execution
    // This ensures onCleanup() calls inside callback use the correct owner
    const prevOwner = currentOwner;
    currentOwner = owner;

    try {
      const cleanup = callback();

      // Track cleanup function in captured owner
      if (typeof cleanup === 'function' && owner && !owner.disposed) {
        owner.cleanups.push(cleanup);
      }
    } finally {
      // Restore previous owner context
      currentOwner = prevOwner;
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
  if (currentOwner && !currentOwner.disposed) {
    currentOwner.cleanups.push(cleanup);
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
export function createEffect(effectFn: () => void | undefined | CleanupFunction): void {
  // Skip in server mode
  if (isServerMode) return;

  let cleanup: CleanupFunction | void | undefined;

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

// ============================================================================
// OWNER SYSTEM (Component Lifecycle Management)
// ============================================================================

/**
 * Create a new owner context for a component
 * Owner tracks all cleanups registered during component rendering
 * Establishes parent-child relationship for hierarchical disposal
 */
export function createOwner(): Owner {
  const owner: Owner = {
    cleanups: [],
    children: [],
    parent: currentOwner,
    disposed: false,
  };

  // Register as child of current owner
  if (currentOwner) {
    currentOwner.children.push(owner);
  }

  return owner;
}

/**
 * Set the current owner context
 * Called by jsx-runtime when rendering components
 */
export function setOwner(owner: Owner | null): void {
  currentOwner = owner;
}

/**
 * Get the current owner context
 */
export function getOwner(): Owner | null {
  return currentOwner;
}

/**
 * Dispose an owner, running all registered cleanups
 * Recursively disposes all children first (tree disposal)
 * Called when a component is removed from the DOM
 */
export function disposeOwner(owner: Owner): void {
  if (owner.disposed) return;

  owner.disposed = true;

  // Dispose all children first (depth-first)
  for (const child of owner.children) {
    disposeOwner(child);
  }

  // Run all cleanups in reverse order (LIFO)
  for (let i = owner.cleanups.length - 1; i >= 0; i--) {
    try {
      owner.cleanups[i]?.();
    } catch (error) {}
  }

  owner.cleanups = [];
  owner.children = [];
}

/**
 * Attach a DOM node to an owner for cleanup tracking
 * Called by jsx-runtime after component renders
 */
export function attachNodeToOwner(node: Node, owner: Owner): void {
  // WeakMap requires object keys - guard against null/undefined
  if (node != null && owner != null) {
    nodeOwners.set(node, owner);
  }
}

/**
 * Get the owner for a DOM node
 */
export function getNodeOwner(node: Node): Owner | undefined {
  return nodeOwners.get(node);
}

/**
 * Dispose a node and its owner
 * Called when removing nodes from DOM or platform tree
 */
export function disposeNode(node: object): void {
  const owner = nodeOwners.get(node as Node);
  if (owner) {
    disposeOwner(owner);
    nodeOwners.delete(node as Node);
  }
}

/**
 * Create an isolated reactive scope with manual cleanup
 *
 * Unlike components, reactive logic in createRoot is not tied to the DOM.
 * Useful for:
 * - Testing (create/dispose reactive contexts)
 * - Global state management (long-lived reactive logic)
 * - Manual control over cleanup timing
 *
 * @example
 * ```tsx
 * // Testing
 * test('reactive logic', () => {
 *   const dispose = createRoot((dispose) => {
 *     const count = signal(0);
 *     const double = computed(() => count.value * 2);
 *
 *     count.value = 5;
 *     expect(double.value).toBe(10);
 *
 *     return dispose;
 *   });
 *
 *   dispose(); // Manual cleanup
 * });
 *
 * // Global store
 * const store = createRoot(() => {
 *   const user = signal(null);
 *   const isLoggedIn = computed(() => !!user.value);
 *
 *   return { user, isLoggedIn };
 * });
 * ```
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner = createOwner();
  const prev = currentOwner;
  currentOwner = owner;

  try {
    const dispose = () => disposeOwner(owner);
    return fn(dispose);
  } finally {
    currentOwner = prev;
  }
}
