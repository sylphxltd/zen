/**
 * TUI JSX Runtime
 *
 * Creates virtual TUI nodes instead of DOM nodes.
 * Similar pattern to zen-web but for terminal rendering.
 */

import { attachNodeToOwner, createOwner, effect, setOwner } from '@zen/signal';
import type { AnyZen } from '@zen/signal';
import type { TUINode } from './types.js';

type Props = Record<string, any>;

/**
 * Check if value is reactive signal
 */
function isReactive(value: any): value is AnyZen {
  return value !== null && typeof value === 'object' && '_kind' in value;
}

/**
 * JSX factory for TUI
 */
export function jsx(type: string | Function, props: Props | null): TUINode {
  // Component
  if (typeof type === 'function') {
    const owner = createOwner();
    setOwner(owner);

    try {
      const node = type(props);
      attachNodeToOwner(node as any, owner);
      return node;
    } finally {
      setOwner(null);
    }
  }

  // TUI Element (box, text, etc.)
  const node: TUINode = {
    type: 'box',
    tagName: type,
    props: props || {},
    children: [],
    style: props?.style || {},
  };

  // Handle children
  const children = props?.children;
  if (children !== undefined) {
    appendChild(node, children);
  }

  return node;
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * Append child to TUI node
 */
function appendChild(parent: TUINode, child: any): void {
  // Null/undefined/false
  if (child == null || child === false) {
    return;
  }

  // Array of children
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i]);
    }
    return;
  }

  // TUI Node
  if (typeof child === 'object' && 'type' in child) {
    parent.children.push(child);
    child.parentNode = parent;
    return;
  }

  // Reactive signal - auto-unwrap (runtime-first)
  if (isReactive(child)) {
    // Create a text node that updates reactively
    const textNode: TUINode = {
      type: 'text',
      props: {},
      children: [''],
    };

    parent.children.push(textNode);

    // Wrap in effect for reactivity
    effect(() => {
      textNode.children[0] = String(child.value ?? '');
      return undefined;
    });
    return;
  }

  // Function - reactive text (from compiler transformation)
  if (typeof child === 'function') {
    const textNode: TUINode = {
      type: 'text',
      props: {},
      children: [''],
    };

    parent.children.push(textNode);

    // Wrap in effect for reactivity
    effect(() => {
      const value = child();
      textNode.children[0] = String(value ?? '');
      return undefined;
    });
    return;
  }

  // Plain text
  parent.children.push(String(child));
}

/**
 * Fragment component
 */
export function Fragment(props: { children?: any }): TUINode {
  const node: TUINode = {
    type: 'box',
    tagName: 'fragment',
    props: {},
    children: [],
  };

  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
