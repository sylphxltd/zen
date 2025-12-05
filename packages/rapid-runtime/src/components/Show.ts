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

import { effect, untrack } from '@rapid/signal';
import { disposeNode, onCleanup } from '@rapid/signal';
import { executeDescriptor, isDescriptor } from '../descriptor.js';
import { getPlatformOps } from '../platform-ops.js';
import { type MaybeReactive, resolve } from '../reactive-utils.js';
import { children } from '../utils/children.js';

interface ShowProps<T> {
  when: MaybeReactive<T>;
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
          let child = c();
          if (typeof child === 'function') {
            child = child(condition as T);
          }
          // Handle component descriptors (ADR-011)
          if (isDescriptor(child)) {
            child = executeDescriptor(child);
          }
          // IMPORTANT: DocumentFragment children are MOVED when appended, leaving fragment empty.
          // Extract children BEFORE appending to preserve them for re-renders.
          // This fixes the bug where Header (returning <>) disappears after navigation.
          if (
            child &&
            typeof child === 'object' &&
            'nodeName' in child &&
            (child as Node).nodeName === '#document-fragment'
          ) {
            const fragment = child as DocumentFragment;
            // Convert to array of children (before they get moved)
            const childArray = Array.from(fragment.childNodes);
            if (childArray.length > 0) {
              child = childArray;
            }
          }
          return child;
        });
      } else {
        // Falsy - render fallback
        const fb = f();
        if (fb) {
          currentNode = untrack(() => {
            let result: unknown;
            if (typeof fb === 'function') {
              result = (fb as () => unknown)();
            } else {
              result = fb;
            }
            // Handle component descriptors (ADR-011)
            if (isDescriptor(result)) {
              result = executeDescriptor(result);
            }
            return result;
          });
        }
      }

      // Update container
      if (currentNode) {
        // Handle array of children (multiple JSX children)
        const nodes = Array.isArray(currentNode) ? currentNode : [currentNode];
        ops.setChildren(container, nodes as object[]);
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
