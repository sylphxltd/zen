/**
 * TUI JSX Runtime - Descriptor Pattern with Fine-Grained Reactivity
 *
 * Creates virtual TUI nodes instead of DOM nodes.
 * Uses descriptor pattern (ADR-011) to fix Context propagation.
 * Implements fine-grained reactivity (ADR-014) for efficient updates.
 *
 * ## Architecture
 *
 * Phase 1: jsx() returns descriptors for components (deferred execution)
 * Phase 2: executeDescriptor() executes components in correct order
 * Phase 3: Effects update nodes and mark them dirty for re-rendering
 *
 * ## Fine-Grained Reactivity
 *
 * When a signal changes:
 * 1. The effect created by handleSignal/handleReactiveFunction runs
 * 2. The node's children are updated
 * 3. markNodeDirty() is called to schedule re-render
 * 4. Only the dirty node is re-rendered (not the whole tree)
 *
 * This is the key to performance - we avoid re-rendering unchanged content.
 */

import { executeDescriptor, isDescriptor, isSignal } from '@rapid/runtime';
import type { ComponentDescriptor } from '@rapid/runtime';
import { disposeNode, effect, untrack } from '@rapid/signal';
import { terminalWidth } from '../utils/terminal-width.js';
import { withParent } from './parent-context.js';
import { markLayoutDirty, markNodeDirty } from './render-context.js';
import type { TUINode } from './types.js';

// ============================================================================
// Text Dimension Tracking
// ============================================================================

/**
 * Get text dimensions for layout tracking.
 *
 * Tracks both:
 * - width: Maximum line width (for horizontal layout)
 * - height: Number of lines (for vertical layout)
 *
 * This ensures layout is recalculated when:
 * - Text width changes (e.g., "9" → "10")
 * - Line count changes (e.g., "A" → "A\nB")
 * - Max line width changes in multiline text
 */
function getTextDimensions(text: string): { width: number; height: number } {
  const lines = text.split('\n');
  const height = lines.length;
  // Max line width (for layout purposes, not total width)
  const width = lines.length > 0 ? Math.max(...lines.map((line) => terminalWidth(line))) : 0;
  return { width, height };
}

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// JSX Factory
// ============================================================================

/**
 * JSX factory for TUI - Descriptor Pattern (ADR-011)
 *
 * Components: Return descriptor (delay execution until parent context is available)
 * Elements: Create TUINode immediately
 *
 * @param type - Tag name (string) or component function
 * @param props - Props including children
 * @returns TUINode for elements, ComponentDescriptor for components
 */
export function jsx(
  type: string | ComponentFunction,
  props: Props | null,
): TUINode | TUINode[] | ComponentDescriptor {
  // Component: Return descriptor (Phase 1)
  // Execution delayed until parent accesses children via lazy getter
  // This ensures Context is available when component runs
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

  // Handle children - this may create reactive effects
  const children = props?.children;
  if (children !== undefined) {
    appendChild(node, children);
  }

  return node;
}

// Aliases for different JSX modes
export const jsxs = jsx;
export const jsxDEV = jsx;

// ============================================================================
// Type Guards
// ============================================================================

function isReactElement(child: unknown): child is ReactElement {
  return typeof child === 'object' && child !== null && 'type' in child && '$$typeof' in child;
}

function isTUINode(child: unknown): child is TUINode {
  return typeof child === 'object' && child !== null && 'type' in child && !('$$typeof' in child);
}

// ============================================================================
// Child Handlers
// ============================================================================

/**
 * Handle component descriptor - Phase 2 execution
 *
 * Executes the component function with correct parent context,
 * then appends the result to the parent node.
 */
function handleDescriptor(parent: TUINode, desc: ComponentDescriptor): void {
  // Execute descriptor with parent context
  // This allows runtime components to access parent during construction
  const result = withParent(parent, () => executeDescriptor(desc));

  appendChild(parent, result);
}

/**
 * Handle React-style elements (from libraries that use React's JSX)
 */
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

/**
 * Handle TUINode child - simply append to parent
 */
function handleTUINode(parent: TUINode, node: TUINode): void {
  parent.children.push(node);
  try {
    node.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }
}

/**
 * Handle signal as child - creates reactive text node
 *
 * ## Fine-Grained Reactivity Implementation
 *
 * When a signal is used as a child like `<Text>{count}</Text>`:
 * 1. Create a text node with empty initial content
 * 2. Create an effect that watches the signal
 * 3. When signal changes, effect updates text and marks node dirty
 * 4. Only this text node is re-rendered, not siblings
 *
 * @param parent - Parent node to append to
 * @param signal - The signal to render
 */
function handleSignal(parent: TUINode, signal: SignalLike): void {
  // Create a text node to hold the signal's value
  // This node is persistent - created once, updated in place
  const textNode: TUINode = {
    type: 'text',
    props: {},
    children: [''], // Start with empty string, will be filled by effect
    parentNode: parent, // CRITICAL: Set parent for dirty propagation
  };

  parent.children.push(textNode);

  // Track previous text dimensions for efficient updates
  let prevWidth = 0;
  let prevHeight = 1;

  // Create reactive effect to update text when signal changes
  // This is the core of fine-grained reactivity
  effect(() => {
    // Read signal value (creates dependency)
    const newValue = String(signal.value ?? '');
    const { width: newWidth, height: newHeight } = getTextDimensions(newValue);

    // Update the text node's content
    // This mutates the existing node, not replace it
    textNode.children[0] = newValue;

    // Smart dirty tracking:
    // - Dimensions changed: need layout recalculation (width or height)
    // - Dimensions same: content-only update (faster)
    if (newWidth !== prevWidth || newHeight !== prevHeight) {
      markLayoutDirty(textNode);
      prevWidth = newWidth;
      prevHeight = newHeight;
    } else {
      markNodeDirty(textNode);
    }

    return undefined;
  });
}

/**
 * Handle reactive function children like {() => expr}
 *
 * ## Fragment-Based Reactivity
 *
 * Reactive functions create a fragment node that acts as a container.
 * When the function's dependencies change, the fragment's children
 * are replaced and the fragment is marked dirty.
 *
 * Fragment nodes are transparent - renderers iterate their children
 * as if they were direct children of the parent.
 *
 * ## Why Fragment Instead of Direct Children?
 *
 * We need a stable node identity to:
 * 1. Track dirty state
 * 2. Know where to re-render in the buffer
 * 3. Properly clean up old children
 *
 * @param parent - Parent node to append to
 * @param fn - Reactive function that returns content
 */
function handleReactiveFunction(parent: TUINode, fn: () => unknown): void {
  // Create a fragment node to hold reactive content
  // Fragment is persistent - created once, children updated in place
  const fragment: TUINode = {
    type: 'fragment',
    props: { _reactive: true }, // Mark as reactive for debugging
    children: [],
  };

  parent.children.push(fragment);

  // Set parentNode before effect runs (effects are synchronous on first run)
  try {
    fragment.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }

  // Track previous content dimensions for efficient updates (primitive values only)
  let prevWidth = 0;
  let prevHeight = 1;

  // Create reactive effect to update fragment when dependencies change
  effect(() => {
    // Call the function to get new value (creates dependencies)
    const value = fn();

    // ========================================================================
    // Clean up old children
    // ========================================================================
    // CRITICAL: Dispose old children before replacing them
    // This ensures useInput handlers, effects, etc. are properly cleaned up
    for (const oldChild of fragment.children) {
      if (oldChild && typeof oldChild === 'object' && 'type' in oldChild) {
        try {
          disposeNode(oldChild);
        } catch {
          // Ignore disposal errors - node might already be disposed
        }
      }
    }
    fragment.children = [];

    // ========================================================================
    // Handle different value types
    // ========================================================================

    // Case 1: Component descriptor (not yet executed)
    if (isDescriptor(value)) {
      // CRITICAL: Use untrack to prevent component's signal accesses from
      // becoming dependencies of THIS effect. Otherwise, when a component
      // accesses its internal signals, this parent effect would re-run
      // and recreate the component entirely.
      const node = untrack(() =>
        withParent(fragment.parentNode || parent, () => executeDescriptor(value)),
      );
      if (node) {
        if (Array.isArray(node)) {
          fragment.children.push(...(node as (TUINode | string)[]));
        } else {
          fragment.children.push(node as TUINode | string);
        }
      }
      // Mark fragment dirty - its children changed
      // Layout might change if new component has different size
      markLayoutDirty(fragment);
      return undefined;
    }

    // Case 2: TUINode (already rendered component or element)
    if (value && typeof value === 'object' && 'type' in value) {
      fragment.children.push(value as TUINode);
      // Layout might change with new node
      markLayoutDirty(fragment);
      return undefined;
    }

    // Case 3: Array (e.g., from .map())
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isDescriptor(item)) {
          // Execute component descriptors in array
          const node = untrack(() =>
            withParent(fragment.parentNode || parent, () => executeDescriptor(item)),
          );
          if (node) {
            if (Array.isArray(node)) {
              fragment.children.push(...(node as (TUINode | string)[]));
            } else {
              fragment.children.push(node as TUINode | string);
            }
          }
        } else if (item != null && item !== false) {
          fragment.children.push(item as TUINode | string);
        }
      }
      // Layout might change with array content
      markLayoutDirty(fragment);
      return undefined;
    }

    // Case 4: Primitive value (string, number, etc.)
    if (value != null && value !== false) {
      const stringValue = String(value);
      const { width: newWidth, height: newHeight } = getTextDimensions(stringValue);
      fragment.children.push(stringValue);

      // Smart dirty tracking:
      // - Dimensions changed: need layout recalculation (width or height)
      // - Dimensions same: content-only update (faster)
      if (newWidth !== prevWidth || newHeight !== prevHeight) {
        markLayoutDirty(fragment);
        prevWidth = newWidth;
        prevHeight = newHeight;
      } else {
        markNodeDirty(fragment);
      }
    }

    return undefined;
  });
}

// ============================================================================
// Main appendChild Function
// ============================================================================

/**
 * Append child to TUI node - with descriptor and reactivity support
 *
 * Handles all types of children:
 * - Arrays (recursively)
 * - Component descriptors (deferred execution)
 * - React elements (converted to descriptors)
 * - TUINode (direct append)
 * - Signals (reactive text)
 * - Functions (reactive content)
 * - Primitives (converted to string)
 *
 * @param parent - Parent node to append to
 * @param child - Child to append (any type)
 */
export function appendChild(parent: TUINode, child: unknown): void {
  // Null/false children are skipped (enables conditional rendering)
  if (child == null || child === false) {
    return;
  }

  // Arrays: recursively process each item
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i]);
    }
    return;
  }

  // Component descriptor: defer execution for proper context
  if (isDescriptor(child)) {
    handleDescriptor(parent, child);
    return;
  }

  // React element: convert to descriptor
  if (isReactElement(child)) {
    handleReactElement(parent, child);
    return;
  }

  // TUINode: direct append
  if (isTUINode(child)) {
    handleTUINode(parent, child);
    return;
  }

  // Signal: create reactive text node
  if (isSignal(child)) {
    handleSignal(parent, child as SignalLike);
    return;
  }

  // Function: create reactive fragment
  if (typeof child === 'function') {
    handleReactiveFunction(parent, child as () => unknown);
    return;
  }

  // Primitive: convert to string and append
  parent.children.push(String(child));
}

// ============================================================================
// Fragment Component
// ============================================================================

/**
 * Fragment component - groups children without adding a container element.
 * Like React.Fragment or <></> syntax.
 *
 * Fragment nodes are transparent - renderers iterate their children
 * as if they were direct children of the parent.
 *
 * @example
 * ```tsx
 * <>
 *   <Text>Line 1</Text>
 *   <Text>Line 2</Text>
 * </>
 * ```
 */
export function Fragment(props: { children?: unknown }): TUINode {
  const node: TUINode = {
    type: 'fragment',
    props: {},
    children: [],
  };

  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
