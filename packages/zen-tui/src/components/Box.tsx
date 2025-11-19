/**
 * Box component for TUI
 *
 * Container component with flexbox layout support.
 * Similar to <div> in web but for terminal.
 */

import type { TUINode, TUIStyle } from '../types.js';

export interface BoxProps {
  children?: any;
  style?: TUIStyle;
}

export function Box(props: BoxProps): TUINode {
  const node: TUINode = {
    type: 'box',
    tagName: 'box',
    props: props || {},
    children: [],
    style: props?.style || {},
  };

  // Handle children
  if (props?.children !== undefined) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child != null && child !== false) {
        if (typeof child === 'object' && 'type' in child) {
          node.children.push(child);
          child.parentNode = node;
        } else {
          node.children.push(String(child));
        }
      }
    }
  }

  return node;
}
