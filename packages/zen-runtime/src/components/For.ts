/**
 * ZenJS For Component
 *
 * High-performance keyed list rendering with fine-grained updates
 *
 * Features:
 * - Keyed reconciliation (only updates changed items)
 * - Container pattern (children inside container, not siblings)
 * - Memory efficient (reuses nodes)
 */

import { effect } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { type MaybeReactive, resolve } from '../reactive-utils.js';

interface ForProps<T, U = unknown> {
  each: MaybeReactive<T[]>;
  children: (item: T, index: () => number) => U;
  fallback?: unknown;
  key?: (item: T, index: number) => unknown;
}

/**
 * For component - Keyed list rendering
 *
 * @example
 * // With signal
 * <For each={items}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 *
 * // With function (for filtering/mapping)
 * <For each={() => items.value.filter(i => i.active)}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 *
 * // With static array
 * <For each={[1, 2, 3]}>
 *   {(num) => <div>{num}</div>}
 * </For>
 *
 * // Custom key function
 * <For each={items} key={(item) => item.id}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 */
export function For<T, U = unknown>(props: ForProps<T, U>): unknown {
  const { each, children, fallback, key: keyFn } = props;

  const ops = getPlatformOps();

  // Create container - children will be inside this node
  const container = ops.createContainer('for');

  // Track rendered items by key for efficient updates
  const itemCache = new Map<unknown, { node: U; index: number; item: T }>();

  // Track if we're showing fallback
  let showingFallback = false;
  let fallbackNode: unknown = null;

  const dispose = effect(() => {
    // Resolve array - automatically tracks reactive dependencies
    const array = resolve(each) as T[];

    // Handle empty array - show fallback
    if (array.length === 0) {
      // Dispose all cached items
      for (const [, entry] of itemCache) {
        disposeNode(entry.node as object);
      }
      itemCache.clear();

      if (fallback && !showingFallback) {
        fallbackNode = fallback;
        showingFallback = true;
        ops.setChildren(container, [fallbackNode as object]);
        ops.notifyUpdate(container);
      } else if (!fallback) {
        ops.setChildren(container, []);
        ops.notifyUpdate(container);
      }
      return;
    }

    // Clear fallback if showing
    if (showingFallback) {
      showingFallback = false;
      fallbackNode = null;
    }

    // Build new children array
    const newChildren: U[] = [];
    const newCache = new Map<unknown, { node: U; index: number; item: T }>();

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      const itemKey = keyFn ? keyFn(item, i) : item;

      let entry = itemCache.get(itemKey);

      if (entry) {
        // Reuse existing node, update index
        entry.index = i;
        entry.item = item;
      } else {
        // Create new node
        const node = children(item, () => {
          const cachedEntry = newCache.get(itemKey);
          return cachedEntry ? cachedEntry.index : -1;
        });
        entry = { node, index: i, item };
      }

      newCache.set(itemKey, entry);
      newChildren.push(entry.node);
    }

    // Dispose items no longer in array
    for (const [key, entry] of itemCache) {
      if (!newCache.has(key)) {
        disposeNode(entry.node as object);
      }
    }

    // Update cache
    itemCache.clear();
    for (const [key, entry] of newCache) {
      itemCache.set(key, entry);
    }

    // Update container children
    ops.setChildren(container, newChildren as object[]);
    ops.notifyUpdate(container);
  });

  // Cleanup on dispose
  onCleanup(() => {
    dispose();
    for (const [, entry] of itemCache) {
      disposeNode(entry.node as object);
    }
    itemCache.clear();
  });

  return container;
}
