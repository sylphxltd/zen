/**
 * selector - Efficient selection tracking
 *
 * Optimizes large list rendering by caching equality checks.
 * Only the old selected item and new selected item will update.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = signal(1);
 * const isSelected = selector(selected);
 *
 * <For each={items}>
 *   {(item) => (
 *     <div class={isSelected(item.id) ? 'active' : ''}>
 *       {item.name}
 *     </div>
 *   )}
 * </For>
 * ```
 */

import { computed } from '@zen/signal';

/**
 * Create a selector for efficient equality checks
 */
export function selector<T>(source: { value: T }): (value: T) => boolean {
  const cache = new Map<T, ReturnType<typeof computed<boolean>>>();

  return (value: T): boolean => {
    let comp = cache.get(value);
    if (!comp) {
      comp = computed(() => source.value === value);
      cache.set(value, comp);
    }
    return (comp as any).value;
  };
}
