/**
 * ZenJS Show Component
 *
 * Conditional rendering with fine-grained reactivity
 *
 * Features:
 * - Only renders active branch
 * - Destroys inactive branch (cleanup)
 * - Supports fallback
 */

import { effect, untrack } from '@zen/signal';
import type { AnyZen } from '@zen/signal';

interface ShowProps<T> {
  when: T | AnyZen | (() => T);
  fallback?: Node | (() => Node);
  children: Node | ((value: T) => Node);
}

/**
 * Show component - Conditional rendering
 *
 * @example
 * <Show when={isLoggedIn} fallback={<Login />}>
 *   <Dashboard />
 * </Show>
 *
 * // With function children (gets the truthy value)
 * <Show when={user}>
 *   {(u) => <div>Hello {u.name}</div>}
 * </Show>
 */
export function Show<T>(props: ShowProps<T>): Node {
  const { when, fallback, children } = props;

  // Anchor to mark position
  const marker = document.createComment('show');

  // Track current node
  let currentNode: Node | null = null;
  let currentDispose: (() => void) | undefined;

  // Effect to update conditional
  const dispose = effect(() => {
    // Evaluate condition
    const condition = typeof when === 'function' ? (when as Function)() : when;

    // Cleanup previous
    if (currentNode?.parentNode) {
      currentNode.parentNode.removeChild(currentNode);
      currentNode = null;
    }
    if (currentDispose) {
      currentDispose();
      currentDispose = undefined;
    }

    // Render appropriate branch
    if (condition) {
      // Truthy - render children
      currentNode = untrack(() => {
        if (typeof children === 'function') {
          return children(condition as T);
        }
        return children;
      });
    } else if (fallback) {
      // Falsy - render fallback
      currentNode = untrack(() => {
        if (typeof fallback === 'function') {
          return fallback();
        }
        return fallback;
      });
    }

    // Insert into DOM
    if (currentNode && marker.parentNode) {
      marker.parentNode.insertBefore(currentNode, marker);

      // Store dispose if available
      if ((currentNode as any)._dispose) {
        currentDispose = (currentNode as any)._dispose;
      }
    }

    return undefined;
  });

  // Cleanup
  (marker as any)._dispose = () => {
    dispose();
    if (currentNode?.parentNode) {
      currentNode.parentNode.removeChild(currentNode);
    }
    if (currentDispose) {
      currentDispose();
    }
  };

  return marker;
}
