/**
 * TUI JSX Runtime
 *
 * Creates virtual TUI nodes instead of DOM nodes.
 * Similar pattern to zen-web but for terminal rendering.
 */

import { executeComponent, isSignal } from '@zen/runtime';
import { attachNodeToOwner, effect, getOwner } from '@zen/signal';
import type { TUINode } from './types.js';

type Props = Record<string, unknown>;
type ComponentFunction = (props: Props | null) => TUINode | TUINode[];

/**
 * JSX factory for TUI
 */
export function jsx(type: string | ComponentFunction, props: Props | null): TUINode | TUINode[] {
  // Component
  if (typeof type === 'function') {
    const result = executeComponent(
      () => type(props),
      // biome-ignore lint/suspicious/noExplicitAny: Generic node type from framework
      (node: any, owner: any) => {
        // Only attach if it's a single node, not an array/fragment
        if (!Array.isArray(node)) {
          attachNodeToOwner(node, owner);
        }
      },
    );
    return result;
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
export function appendChild(parent: TUINode, child: unknown): void {
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
    parent.children.push(child as TUINode);
    // Try to set parentNode, but don't fail if object is frozen/sealed
    try {
      (child as TUINode).parentNode = parent;
    } catch {
      // Object is frozen/sealed, skip parentNode assignment
    }
    return;
  }

  // TUI Marker (from runtime components like For, Show, Switch)
  if (typeof child === 'object' && '_type' in child && (child as any)._type === 'marker') {
    parent.children.push(child as any);
    // Try to set parentNode, but don't fail if object is frozen/sealed
    try {
      (child as any).parentNode = parent;
    } catch {
      // Object is frozen/sealed, skip parentNode assignment
    }
    return;
  }

  // Reactive signal - auto-unwrap (runtime-first)
  if (isSignal(child)) {
    // Create a text node that updates reactively
    const textNode: TUINode = {
      type: 'text',
      props: {},
      children: [''],
    };

    parent.children.push(textNode);

    // Wrap in effect for reactivity
    effect(() => {
      textNode.children[0] = String((child as any).value ?? '');
      return undefined;
    });
    return;
  }

  // Function - reactive content (from compiler transformation)
  if (typeof child === 'function') {
    // Create a marker node that will hold the reactive content
    // biome-ignore lint/suspicious/noExplicitAny: Marker is internal type used by runtime
    const marker: any = {
      _type: 'marker',
      _kind: 'reactive',
      children: [],
    };

    parent.children.push(marker);

    // Wrap in effect for reactivity
    effect(() => {
      const value = child();

      // Clear previous children
      marker.children = [];

      // Handle TUINode
      if (value && typeof value === 'object' && 'type' in value) {
        marker.children.push(value as TUINode);
        return undefined;
      }

      // Handle array of nodes
      if (Array.isArray(value)) {
        marker.children.push(...value);
        return undefined;
      }

      // Handle primitive values (text)
      if (value != null && value !== false) {
        marker.children.push(String(value));
      }

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
export function Fragment(props: { children?: unknown }): TUINode {
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
