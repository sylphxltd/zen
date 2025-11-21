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
import { scheduleNodeUpdate } from './render-context.js';
import type { TUINode } from './types.js';

type Props = Record<string, unknown>;
type ComponentFunction = (props: Props | null) => TUINode | TUINode[];

interface ReactElement {
  $$typeof: symbol;
  type: ComponentFunction;
  props: Props;
}

interface TUIMarker {
  _type: 'marker';
  _kind: string;
  children: (TUINode | string)[];
  parentNode?: TUINode;
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

function isTUIMarker(child: unknown): child is TUIMarker {
  return (
    typeof child === 'object' &&
    child !== null &&
    '_type' in child &&
    (child as TUIMarker)._type === 'marker'
  );
}

/**
 * Handle component descriptor - Phase 2 execution
 */
function handleDescriptor(parent: TUINode, desc: ComponentDescriptor): void {
  const result = executeDescriptor(desc);
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

function handleTUIMarker(parent: TUINode, marker: TUIMarker): void {
  parent.children.push(marker);
  try {
    marker.parentNode = parent;
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

function handleReactiveFunction(parent: TUINode, fn: () => unknown): void {
  const marker: TUIMarker = {
    _type: 'marker',
    _kind: 'reactive',
    children: [],
  };

  parent.children.push(marker);

  effect(() => {
    const value = fn();
    marker.children = [];

    if (value && typeof value === 'object' && 'type' in value) {
      marker.children.push(value as TUINode);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, ''); // Will render the TUINode
      return undefined;
    }

    if (Array.isArray(value)) {
      marker.children.push(...value);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, ''); // Will render the array
      return undefined;
    }

    if (value != null && value !== false) {
      const stringValue = String(value);
      marker.children.push(stringValue);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, stringValue);
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

  if (isTUIMarker(child)) {
    handleTUIMarker(parent, child);
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
