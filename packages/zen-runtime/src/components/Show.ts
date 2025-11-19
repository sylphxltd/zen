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
import { disposeNode, onCleanup } from '@zen/signal';
import { type Reactive, resolve } from '../reactive-utils.js';

interface ShowProps<T> {
  when: Reactive<T>;
  fallback?: Node | (() => Node);
  children: Node | ((value: T) => Node);
}

/**
 * Show component - Conditional rendering
 *
 * @example
 * // With function
 * <Show when={() => isLoggedIn.value} fallback={<Login />}>
 *   <Dashboard />
 * </Show>
 *
 * // With signal directly
 * <Show when={computed(() => user.value !== null)}>
 *   {(u) => <div>Hello {u.name}</div>}
 * </Show>
 */
export function Show<T>(props: ShowProps<T>): Node {
  const { when, fallback, children } = props;

  // Anchor to mark position
  const marker = document.createComment('show');

  // Track current node
  let currentNode: Node | null = null;
  let dispose: (() => void) | undefined;

  // Defer effect until marker is in DOM (same fix as Router component)
  queueMicrotask(() => {
    dispose = effect(() => {
      // Resolve condition - automatically tracks reactive dependencies
      const condition = resolve(when);

      // Cleanup previous node
      if (currentNode) {
        if (currentNode.parentNode) {
          currentNode.parentNode.removeChild(currentNode);
        }
        // Dispose child component's owner
        disposeNode(currentNode);
        currentNode = null;
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
      }

      return undefined;
    });
  });

  // Register cleanup via owner system
  onCleanup(() => {
    if (dispose) {
      dispose();
    }
    if (currentNode) {
      if (currentNode.parentNode) {
        currentNode.parentNode.removeChild(currentNode);
      }
      disposeNode(currentNode);
    }
  });

  return marker;
}
