/**
 * Static component for TUI
 *
 * Renders static, non-reactive content efficiently.
 * Useful for logs, command history, or any content that doesn't update.
 *
 * Unlike reactive components, Static content is rendered once and never updates,
 * making it highly performant for large lists of unchanging items.
 */

import { appendChild } from '../jsx-runtime.js';
import type { TUINode } from '../types.js';

export interface StaticProps<T = any> {
  items: T[];
  children: (item: T, index: number) => TUINode | string;
  style?: any;
}

export function Static<T = any>(props: StaticProps<T>): TUINode {
  const node: TUINode = {
    type: 'box',
    tagName: 'static',
    props: props || {},
    children: [],
    style: props?.style || {},
  };

  // Render items statically (no reactivity)
  if (props?.items && props.children) {
    for (let i = 0; i < props.items.length; i++) {
      const item = props.items[i];
      const child = props.children(item, i);
      appendChild(node, child);
    }
  }

  return node;
}
