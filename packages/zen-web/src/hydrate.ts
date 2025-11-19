/**
 * Hydration utilities for client-side activation of SSR content
 *
 * Hydration reuses server-rendered DOM instead of recreating it,
 * attaching event listeners and establishing reactivity.
 */

/**
 * Hydration context tracks the current position in the DOM tree
 * during hydration traversal
 */
type HydrateContext = {
  // Current node being hydrated
  current: Node | null;
  // Parent element containing hydration root
  container: Element;
};

// Global hydration state (set during hydrate() call)
let hydrateContext: HydrateContext | null = null;

/**
 * Check if currently in hydration mode
 * Used by jsx-runtime to decide whether to create or reuse nodes
 */
export function isHydrating(): boolean {
  return hydrateContext !== null;
}

/**
 * Get next node to hydrate from the DOM tree
 * Advances the hydration cursor to the next sibling
 *
 * @returns Next DOM node to hydrate, or null if none available
 */
export function getNextHydrateNode(): Node | null {
  if (!hydrateContext) return null;

  const node = hydrateContext.current;
  if (node) {
    hydrateContext.current = node.nextSibling;
  }

  return node;
}

/**
 * Enter a parent element during hydration
 * Used when hydrating nested elements
 *
 * @param parent - Parent element to enter
 */
export function enterHydrateParent(parent: Element): void {
  if (!hydrateContext) return;
  hydrateContext.current = parent.firstChild;
}

/**
 * Exit a parent element during hydration
 * Restores hydration cursor to the parent's next sibling
 *
 * @param parent - Parent element to exit
 */
export function exitHydrateParent(parent: Element): void {
  if (!hydrateContext) return;
  hydrateContext.current = parent.nextSibling;
}

/**
 * Hydrate server-rendered HTML with client-side reactivity
 *
 * Reuses existing DOM nodes instead of recreating them:
 * - Matches server-rendered nodes with component tree
 * - Attaches event listeners
 * - Establishes reactive subscriptions
 * - Removes unmatched nodes
 *
 * @example
 * ```tsx
 * // Server (Express/Bun)
 * const html = renderToString(() => <App />);
 * res.send(`<div id="root">${html}</div>`);
 *
 * // Client
 * import { hydrate } from '@zen/zen/hydrate';
 *
 * const root = document.getElementById('root');
 * hydrate(() => <App />, root);
 * ```
 */
export function hydrate(fn: () => Node, container: Element): void {
  // Initialize hydration context
  hydrateContext = {
    current: container.firstChild,
    container,
  };

  try {
    // Execute component tree
    // jsx-runtime will detect isHydrating() and reuse nodes
    fn();

    // Clean up unmatched nodes
    // (Nodes that exist in DOM but not in component tree)
    while (hydrateContext.current) {
      const next = hydrateContext.current.nextSibling;
      container.removeChild(hydrateContext.current);
      hydrateContext.current = next;
    }
  } finally {
    // Clear hydration context
    hydrateContext = null;
  }
}
