/**
 * ZenJS Show Component
 *
 * Conditional rendering with fine-grained reactivity
 *
 * Features:
 * - Only renders active branch
 * - Destroys inactive branch (cleanup)
 * - Supports fallback
 * - Container pattern (child inside container)
 */

import { effect, untrack } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { type Reactive, resolve } from '../reactive-utils.js';
import { children } from '../utils/children.js';

interface ShowProps<T> {
  when: Reactive<T>;
  fallback?: unknown | (() => unknown);
  children: unknown | ((value: T) => unknown);
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
export function Show<T>(props: ShowProps<T>): unknown {
  // IMPORTANT: Don't destructure props.children here!
  // Descriptor pattern provides lazy getter - only read when needed
  const c = children(() => props.children);
  const f = children(() => props.fallback);

  const ops = getPlatformOps();

  // Create container - child will be inside this node
  const container = ops.createContainer('show');

  // Track current rendered node
  let currentNode: unknown = null;
  let previousCondition = false;

  const dispose = effect(() => {
    const condition = resolve(props.when);
    const conditionBool = !!condition;

    // Only update if condition changed
    if (previousCondition !== conditionBool || currentNode === null) {
      // Dispose previous node
      if (currentNode) {
        disposeNode(currentNode as object);
        currentNode = null;
      }

      previousCondition = conditionBool;

      // Render appropriate branch
      if (conditionBool) {
        // Truthy - render children
        currentNode = untrack(() => {
          const child = c();
          if (typeof child === 'function') {
            return child(condition as T);
          }
          return child;
        });
      } else {
        // Falsy - render fallback
        const fb = f();
        if (fb) {
          currentNode = untrack(() => {
            if (typeof fb === 'function') {
              return (fb as () => unknown)();
            }
            return fb;
          });
        }
      }

      // Update container
      if (currentNode) {
        ops.setChildren(container, [currentNode as object]);
      } else {
        ops.setChildren(container, []);
      }
      ops.notifyUpdate(container);
    }
  });

  // Cleanup on dispose
  onCleanup(() => {
    dispose();
    if (currentNode) {
      disposeNode(currentNode as object);
    }
  });

  return container;
}
