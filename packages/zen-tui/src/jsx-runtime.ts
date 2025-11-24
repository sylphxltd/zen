/**
 * TUI JSX Runtime - Descriptor Pattern
 *
 * Creates virtual TUI nodes instead of DOM nodes.
 * Uses descriptor pattern (ADR-011) to fix Context propagation.
 *
 * Phase 1: jsx() returns descriptors for components
 * Phase 2: executeDescriptor() executes in correct order
 */

import { executeDescriptor, isDescriptor, isSignal } from '@zen/runtime';
import type { ComponentDescriptor } from '@zen/runtime';
import { effect } from '@zen/signal';
import { withParent } from './parent-context.js';
import { scheduleNodeUpdate } from './render-context.js';
import type { TUINode } from './types.js';

type Props = Record<string, unknown>;
type ComponentFunction = (props: Props | null) => TUINode | TUINode[];

interface ReactElement {
  $$typeof: symbol;
  type: ComponentFunction;
  props: Props;
}

interface SignalLike {
  _kind: string;
  value: unknown;
}

/**
 * JSX factory for TUI - Descriptor Pattern (ADR-011)
 *
 * Components: Return descriptor (delay execution)
 * Elements: Create TUINode immediately
 */
export function jsx(
  type: string | ComponentFunction,
  props: Props | null,
): TUINode | TUINode[] | ComponentDescriptor {
  // Component: Return descriptor (Phase 1)
  // Execution delayed until parent accesses children via lazy getter
  if (typeof type === 'function') {
    return {
      _jsx: true,
      type,
      props,
    } as ComponentDescriptor;
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

function isReactElement(child: unknown): child is ReactElement {
  return typeof child === 'object' && child !== null && 'type' in child && '$$typeof' in child;
}

function isTUINode(child: unknown): child is TUINode {
  return typeof child === 'object' && child !== null && 'type' in child && !('$$typeof' in child);
}

/**
 * Handle component descriptor - Phase 2 execution
 */
function handleDescriptor(parent: TUINode, desc: ComponentDescriptor): void {
  // Execute descriptor with parent context
  // This allows runtime components to access parent during construction
  const result = withParent(parent, () => executeDescriptor(desc));

  appendChild(parent, result);
}

function handleReactElement(parent: TUINode, reactEl: ReactElement): void {
  if (typeof reactEl.type === 'function') {
    // Convert React element to descriptor for consistent handling
    const desc: ComponentDescriptor = {
      _jsx: true,
      type: reactEl.type,
      props: reactEl.props,
    };
    handleDescriptor(parent, desc);
  }
}

function handleTUINode(parent: TUINode, node: TUINode): void {
  parent.children.push(node);
  try {
    node.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }
}

function handleSignal(parent: TUINode, signal: SignalLike): void {
  const textNode: TUINode = {
    type: 'text',
    props: {},
    children: [''],
  };

  parent.children.push(textNode);

  effect(() => {
    const newValue = String(signal.value ?? '');
    textNode.children[0] = newValue;
    // Schedule fine-grained update
    scheduleNodeUpdate(textNode, newValue);
    return undefined;
  });
}

/**
 * Handle reactive function children like {() => expr}
 * Creates a fragment node that updates its children reactively.
 *
 * Fragment nodes are transparent containers - renderers just iterate their children.
 * This is the architectural equivalent of React Fragments for dynamic content.
 */
function handleReactiveFunction(parent: TUINode, fn: () => unknown): void {
  // Create a proper fragment node instead of marker
  // Fragment is a first-class TUINode that renderers naturally support
  const fragment: TUINode = {
    type: 'fragment',
    props: { _reactive: true }, // Mark as reactive for debugging
    children: [],
  };

  parent.children.push(fragment);
  // CRITICAL: Set parentNode before effect runs (effects are immediate sync)
  try {
    fragment.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }

  effect(() => {
    const value = fn();
    fragment.children = [];

    // Check if value is a descriptor (component not yet executed)
    if (isDescriptor(value)) {
      const node = withParent(fragment.parentNode || parent, () => executeDescriptor(value));
      if (node) {
        if (Array.isArray(node)) {
          fragment.children.push(...node);
        } else {
          fragment.children.push(node);
        }
      }
      scheduleNodeUpdate(fragment, '');
      // Notify persistent tree builder to rebuild (for persistent renderer)
      (fragment as any).onUpdate?.();
      return undefined;
    }

    if (value && typeof value === 'object' && 'type' in value) {
      fragment.children.push(value as TUINode);
      // Schedule fine-grained update for the fragment
      scheduleNodeUpdate(fragment, ''); // Will render the TUINode
      // Notify persistent tree builder to rebuild (for persistent renderer)
      (fragment as any).onUpdate?.();
      return undefined;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        // Execute descriptors in arrays (e.g., from array.map() returning <Component />)
        if (isDescriptor(item)) {
          const node = withParent(fragment.parentNode || parent, () => executeDescriptor(item));
          if (node) {
            if (Array.isArray(node)) {
              fragment.children.push(...node);
            } else {
              fragment.children.push(node);
            }
          }
        } else if (item != null && item !== false) {
          fragment.children.push(item);
        }
      }
      // Schedule fine-grained update for the fragment
      scheduleNodeUpdate(fragment, ''); // Will render the array
      // Notify persistent tree builder to rebuild (for persistent renderer)
      (fragment as any).onUpdate?.();
      return undefined;
    }

    if (value != null && value !== false) {
      const stringValue = String(value);
      fragment.children.push(stringValue);
      // Schedule fine-grained update for the fragment
      scheduleNodeUpdate(fragment, stringValue);
      // Notify persistent tree builder to rebuild (for persistent renderer)
      (fragment as any).onUpdate?.();
    }

    return undefined;
  });
}

/**
 * Append child to TUI node - with descriptor support
 */
export function appendChild(parent: TUINode, child: unknown): void {
  if (child == null || child === false) {
    return;
  }

  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i]);
    }
    return;
  }

  // NEW: Handle descriptors (Phase 2)
  if (isDescriptor(child)) {
    handleDescriptor(parent, child);
    return;
  }

  if (isReactElement(child)) {
    handleReactElement(parent, child);
    return;
  }

  if (isTUINode(child)) {
    handleTUINode(parent, child);
    return;
  }

  if (isSignal(child)) {
    handleSignal(parent, child as SignalLike);
    return;
  }

  if (typeof child === 'function') {
    handleReactiveFunction(parent, child);
    return;
  }

  parent.children.push(String(child));
}

/**
 * Fragment component - groups children without adding a container element.
 * Like React.Fragment or <></> syntax.
 *
 * Fragment nodes are transparent - renderers just iterate their children.
 */
export function Fragment(props: { children?: unknown }): TUINode {
  const node: TUINode = {
    type: 'fragment', // Proper fragment type, not box
    props: {},
    children: [],
  };

  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
