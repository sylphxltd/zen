/**
 * ZenJS Switch/Match Components
 *
 * Multi-branch conditional rendering
 *
 * Features:
 * - Only renders first matching branch
 * - Efficient branch switching
 * - Supports fallback
 * - Container pattern (child inside container)
 */

import { effect, untrack } from '@zen/signal';
import type { AnySignal } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children as resolveChildren } from '../utils/children.js';

interface SwitchProps {
  fallback?: unknown | (() => unknown);
  children: unknown[];
}

interface MatchProps<T> {
  when: T | AnySignal | (() => T);
  children: unknown | ((value: T) => unknown);
}

// Symbol to identify Match config objects
const MATCH_CONFIG = Symbol('match-config');

interface MatchConfig<T> {
  [MATCH_CONFIG]: true;
  when: T | AnySignal | (() => T);
  children: unknown | ((value: T) => unknown);
}

/**
 * Match component - Single branch in Switch
 *
 * Returns a config object that Switch consumes, not a real node.
 *
 * @example
 * <Match when={route === 'home'}>
 *   <Home />
 * </Match>
 */
export function Match<T>(props: MatchProps<T>): MatchConfig<T> {
  return {
    [MATCH_CONFIG]: true,
    when: props.when,
    children: props.children,
  };
}

/**
 * Check if an object is a Match config
 */
function isMatchConfig(obj: unknown): obj is MatchConfig<unknown> {
  return typeof obj === 'object' && obj !== null && MATCH_CONFIG in obj;
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
export function Switch(props: SwitchProps): unknown {
  const { fallback, children } = props;

  const ops = getPlatformOps();

  // Create container - matched child will be inside this node
  const container = ops.createContainer('switch');

  // Track current rendered node
  let currentNode: unknown = null;

  const dispose = effect(() => {
    // Dispose previous node
    if (currentNode) {
      disposeNode(currentNode as object);
      currentNode = null;
    }

    // Find first matching branch
    for (const child of children) {
      if (isMatchConfig(child)) {
        const { when, children: matchChildren } = child;

        // Evaluate condition (triggers reactive tracking)
        const condition = typeof when === 'function' ? (when as () => unknown)() : when;

        if (condition) {
          // Found match - render
          const c = resolveChildren(() => matchChildren);
          currentNode = untrack(() => {
            const resolved = c();
            if (typeof resolved === 'function') {
              return (resolved as (value: unknown) => unknown)(condition);
            }
            return resolved;
          });
          break;
        }
      }
    }

    // No match - render fallback
    if (!currentNode && fallback) {
      currentNode = untrack(() => {
        if (typeof fallback === 'function') {
          return (fallback as () => unknown)();
        }
        return fallback;
      });
    }

    // Update container
    if (currentNode) {
      ops.setChildren(container, [currentNode as object]);
    } else {
      ops.setChildren(container, []);
    }
    ops.notifyUpdate(container);
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
