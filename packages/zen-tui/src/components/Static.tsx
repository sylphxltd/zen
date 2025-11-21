/**
 * Static component for TUI
 *
 * React Ink-compatible Static component with fine-grained reactive internals.
 *
 * Behavior (matching React Ink):
 * - Items are rendered permanently to terminal scrollback
 * - New items append above the dynamic UI
 * - Once rendered, items cannot be updated (static in scrollback)
 * - Dynamic content below updates in-place via fine-grained reactivity
 *
 * Usage:
 * ```tsx
 * const logs = signal([]);
 *
 * <Static items={logs.value}>
 *   {(log, index) => (
 *     <Box key={log.id}>
 *       <Text>✔ {log.message}</Text>
 *     </Box>
 *   )}
 * </Static>
 * ```
 */

import { appendChild } from '../jsx-runtime.js';
import type { TUINode } from '../types.js';

export interface StaticProps<T = any> {
  items: T[] | (() => T[]);
  children: (item: T, index: number) => TUINode | string;
  style?: any;
}

export function Static<T = any>(props: StaticProps<T>): TUINode {
  // For fine-grained reactivity: store items getter on the node
  // The renderer will check for new items and render them to scrollback
  const itemsGetter = typeof props?.items === 'function' ? props.items : () => props?.items || [];

  const node: TUINode = {
    type: 'box',
    tagName: 'static',
    props: {
      ...props,
      __itemsGetter: itemsGetter,  // Store getter for renderer to use
      __renderChild: props.children, // Store render function
    },
    children: [],
    style: props?.style || {},
  };

  // Get initial items
  const items = itemsGetter();

  // Render initial items
  if (items && props.children) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const child = props.children(item, i);
      appendChild(node, child);
    }
  }

  return node;
}
