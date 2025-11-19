/**
 * ZenJS Switch/Match Components
 *
 * Multi-branch conditional rendering
 *
 * Features:
 * - Only renders first matching branch
 * - Efficient branch switching
 * - Supports fallback
 */

import { effect, untrack } from '@zen/signal';
import type { AnyZen } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';

interface SwitchProps {
  fallback?: Node | (() => Node);
  children: Node[];
}

interface MatchProps<T> {
  when: T | AnyZen | (() => T);
  children: Node | ((value: T) => Node);
}

/**
 * Match component - Single branch in Switch
 *
 * @example
 * <Match when={route === 'home'}>
 *   <Home />
 * </Match>
 */
export function Match<T>(props: MatchProps<T>): Node {
  const marker = document.createComment('match');

  // Store props for Switch to access
  (marker as any)._matchProps = props;

  return marker;
}

/**
 * Switch component - Multi-branch conditional
 *
 * @example
 * <Switch fallback={<NotFound />}>
 *   <Match when={route === 'home'}><Home /></Match>
 *   <Match when={route === 'about'}><About /></Match>
 * </Switch>
 */
export function Switch(props: SwitchProps): Node {
  const { fallback, children } = props;

  // Anchor
  const marker = document.createComment('switch');

  // Track current node
  let currentNode: Node | null = null;

  // Effect to evaluate conditions
  const dispose = effect(() => {
    // Cleanup previous
    if (currentNode) {
      if (currentNode.parentNode) {
        currentNode.parentNode.removeChild(currentNode);
      }
      disposeNode(currentNode);
      currentNode = null;
    }

    // Find first matching branch
    for (const child of children) {
      const matchProps = (child as any)._matchProps;

      if (matchProps) {
        const { when, children: matchChildren } = matchProps;

        // Evaluate condition
        const condition = typeof when === 'function' ? when() : when;

        if (condition) {
          // Found match - render
          currentNode = untrack(() => {
            if (typeof matchChildren === 'function') {
              return matchChildren(condition);
            }
            return matchChildren;
          });

          break;
        }
      }
    }

    // No match - render fallback
    if (!currentNode && fallback) {
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

  // Register cleanup via owner system
  onCleanup(() => {
    dispose();
    if (currentNode) {
      if (currentNode.parentNode) {
        currentNode.parentNode.removeChild(currentNode);
      }
      disposeNode(currentNode);
    }
  });

  return marker;
}
