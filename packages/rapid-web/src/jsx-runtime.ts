/**
 * ZenJS JSX Runtime - Descriptor Pattern
 *
 * Uses descriptor pattern (ADR-011) to fix Context propagation.
 *
 * Phase 1: jsx() returns descriptors for components
 * Phase 2: executeDescriptor() executes in correct order
 *
 * Performance optimizations:
 * 1. Avoid Object.entries() allocation
 * 2. Cache hydration state
 * 3. Optimize string operations
 * 4. Remove unnecessary checks
 * 5. Reorder conditions by frequency
 */

import { executeDescriptor, isDescriptor, isSignal } from '@rapid/runtime';
import type { ComponentDescriptor } from '@rapid/runtime';
import { effect, onCleanup } from '@rapid/signal';
import { enterHydrateParent, getNextHydrateNode, isHydrating } from './hydrate.js';

export { Fragment } from './core/fragment.js';

type Props = Record<string, unknown>;
type ComponentFunction = (props: Props | null) => Node;

/**
 * JSX factory function - Descriptor Pattern (ADR-011)
 *
 * Components: Return descriptor (delay execution)
 * Elements: Create DOM node immediately
 */
export function jsx(
  type: string | ComponentFunction,
  props: Props | null,
): Node | ComponentDescriptor {
  // Component: Return descriptor (Phase 1)
  // Execution delayed until parent accesses children via lazy getter
  if (typeof type === 'function') {
    return {
      _jsx: true,
      type,
      props,
    } as ComponentDescriptor;
  }

  // Cache hydration state (avoid repeated calls)
  const hydrating = isHydrating();

  // Element
  let element: Element;

  // Hydration mode: reuse existing node
  if (hydrating) {
    const node = getNextHydrateNode();

    if (
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName.toLowerCase() === type
    ) {
      element = node as Element;

      // Set up interactivity (avoid props extraction)
      if (props) {
        // Direct iteration - no Object.entries() allocation
        for (const key in props) {
          if (key !== 'children' && key !== 'key') {
            setAttribute(element, key, props[key]);
          }
        }
      }

      // Handle children
      const children = props?.children;
      if (children !== undefined) {
        enterHydrateParent(element);
        appendChild(element, children, hydrating);
      }

      return element;
    }

    // Mismatch warning in dev only
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      const actual = node
        ? node.nodeType === Node.ELEMENT_NODE
          ? (node as Element).tagName.toLowerCase()
          : node.nodeType === Node.TEXT_NODE
            ? '#text'
            : '#comment'
        : 'null';
    }
  }

  // Normal mode: create new element
  element = document.createElement(type);

  // Set attributes (avoid props extraction)
  if (props) {
    for (const key in props) {
      if (key !== 'children' && key !== 'key') {
        setAttribute(element, key, props[key]);
      }
    }
  }

  // Append children
  const children = props?.children;
  if (children !== undefined) {
    appendChild(element, children, hydrating);
  }

  return element;
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * Set attribute - optimized
 */
function setAttribute(element: Element, key: string, value: unknown): void {
  // Fast path: most common cases first

  // Event listener (most common in interactive apps)
  if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
    // 'on' prefix check via char codes (faster than startsWith)
    const eventName = key.slice(2).toLowerCase();
    const handler = value as EventListener;
    element.addEventListener(eventName, handler);
    // Register cleanup to remove listener when component is disposed
    onCleanup(() => element.removeEventListener(eventName, handler));
    return;
  }

  // Class name (very common)
  if (key === 'className' || key === 'class') {
    element.className = String(value);
    return;
  }

  // Style (common)
  if (key === 'style') {
    if (typeof value === 'string') {
      (element as HTMLElement).style.cssText = value;
    } else if (typeof value === 'function') {
      // Reactive style function: style={() => ({ color: 'red' })}
      effect(() => {
        const styleObj = value();
        if (styleObj && typeof styleObj === 'object') {
          Object.assign((element as HTMLElement).style, styleObj);
        }
        return undefined;
      });
    } else if (value) {
      Object.assign((element as HTMLElement).style, value);
    }
    return;
  }

  // Ref callback
  if (key === 'ref') {
    if (typeof value === 'function') {
      value(element);
    }
    return;
  }

  // Reactive value (signal)
  if (isSignal(value)) {
    // Special case: form control values - effect handles initial + updates
    if (
      key === 'value' &&
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement)
    ) {
      effect(() => {
        const newValue = value.value;
        const formElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (formElement[key] !== newValue) {
          formElement[key] = newValue;
        }
        return undefined;
      });
      return;
    }

    effect(() => {
      setStaticValue(element, key, value.value);
      return undefined;
    });
    return;
  }

  // Reactive function (from auto-unwrap transform: {signal.value} → {() => signal.value})
  // Only handle functions for commonly reactive attributes to avoid interfering with function props
  if (typeof value === 'function') {
    const reactiveAttrs = ['value', 'checked', 'disabled', 'selected', 'innerHTML', 'textContent'];

    if (reactiveAttrs.includes(key)) {
      // Special case: form control values - effect handles initial + updates
      if (
        key === 'value' &&
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement)
      ) {
        effect(() => {
          const newValue = value();
          const formElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (formElement[key] !== newValue) {
            formElement[key] = newValue;
          }
          return undefined;
        });
        return;
      }

      effect(() => {
        setStaticValue(element, key, value());
        return undefined;
      });
      return;
    }
    // For non-reactive attributes, fall through to static value (pass function as-is)
  }

  // Static value
  setStaticValue(element, key, value);
}

/**
 * Set static value - extracted to avoid duplication
 */
function setStaticValue(element: Element, key: string, value: unknown): void {
  // Property vs attribute
  if (key in element) {
    (element as any)[key] = value;
  } else {
    element.setAttribute(key, String(value));
  }
}

/**
 * Handle reactive child content (signal or function)
 *
 * Extracts common logic for both signal.value and function() reactive patterns.
 * This reduces ~160 lines of duplication to a single shared implementation.
 */
function handleReactiveChild(
  parent: Element,
  getValue: () => unknown,
  markerLabel: string,
  hydrating: boolean,
): void {
  // Get or create marker comment node to track position
  // During hydration: reuse marker from SSR
  // Normal render: create new marker
  let marker: Comment;
  if (hydrating) {
    const ssrMarker = getNextHydrateNode();
    if (ssrMarker && ssrMarker.nodeType === Node.COMMENT_NODE) {
      marker = ssrMarker as Comment;
    } else {
      // Fallback: create marker (SSR mismatch - content still works)
      marker = document.createComment(markerLabel);
    }
  } else {
    marker = document.createComment(markerLabel);
    parent.appendChild(marker);
  }

  let currentNodes: Node[] = [];
  let previousValue: unknown;
  // Track initial render to skip DOM manipulation only on first hydration run
  let isInitialRender = hydrating;

  // Cleanup marker and content nodes when disposed
  onCleanup(() => {
    for (const node of currentNodes) {
      if (node.parentNode === parent) {
        parent.removeChild(node);
      }
    }
    if (marker.parentNode === parent) {
      parent.removeChild(marker);
    }
  });

  // Wrap in effect for reactivity
  effect(() => {
    const value = getValue();

    // Fine-grained comparison: Only update if value actually changed
    // For Nodes: reference equality (same instance = no update needed)
    // For primitives: value equality
    if (value instanceof Node) {
      if (previousValue === value) {
        return undefined; // Same Node instance, skip update
      }
    } else if (Array.isArray(value) && Array.isArray(previousValue)) {
      // Array of nodes: check if all nodes are the same instances
      if (
        value.length === previousValue.length &&
        value.every((item, i) => item === previousValue[i])
      ) {
        return undefined; // Same array content, skip update
      }
    } else if (value === previousValue) {
      return undefined; // Same primitive value, skip update
    }

    previousValue = value;

    // Skip DOM manipulation only on initial hydration render
    // After that, we need to update DOM on value changes
    const skipDomUpdate = isInitialRender;
    isInitialRender = false;

    // Remove previous nodes (skip on initial hydration - SSR content exists)
    if (!skipDomUpdate) {
      for (const node of currentNodes) {
        if (node.parentNode === parent) {
          parent.removeChild(node);
        }
      }
    }
    currentNodes = [];

    // Handle null/undefined/false - remove nodes (already cleared above)
    if (value == null || value === false) {
      return undefined;
    }

    // Handle Node
    if (value instanceof Node) {
      if (!skipDomUpdate) {
        parent.insertBefore(value, marker);
      }
      currentNodes.push(value);
      return undefined;
    }

    // Handle array of nodes
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof Node) {
          if (!skipDomUpdate) {
            parent.insertBefore(item, marker);
          }
          currentNodes.push(item);
        }
      }
      return undefined;
    }

    // Handle primitive values (text)
    if (skipDomUpdate) {
      // During hydration, find the existing text node from SSR
      const existingText = getNextHydrateNode();
      if (existingText && existingText.nodeType === Node.TEXT_NODE) {
        currentNodes.push(existingText);
      }
    } else {
      const textNode = document.createTextNode(String(value));
      parent.insertBefore(textNode, marker);
      currentNodes.push(textNode);
    }
    return undefined;
  });
}

/**
 * Append child - optimized with descriptor support
 */
function appendChild(parent: Element, child: unknown, hydrating: boolean): void {
  // Null/undefined/false - most common in conditional rendering
  if (child == null || child === false) {
    return;
  }

  // Array of children - common in lists
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i], hydrating);
    }
    return;
  }

  // Descriptor - execute and append result (Phase 2)
  if (isDescriptor(child)) {
    const result = executeDescriptor(child);
    appendChild(parent, result, hydrating);
    return;
  }

  // Node - common for components
  if (child instanceof Node) {
    if (!hydrating) {
      parent.appendChild(child);
    }
    return;
  }

  // Reactive signal - auto-unwrap (runtime-first)
  if (isSignal(child)) {
    handleReactiveChild(parent, () => child.value, 'signal', hydrating);
    return;
  }

  // Function - reactive content (from unplugin transformation)
  if (typeof child === 'function') {
    handleReactiveChild(parent, child, 'reactive', hydrating);
    return;
  }

  // Text - very common
  if (hydrating) {
    const node = getNextHydrateNode();
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development' &&
      (!node || node.nodeType !== Node.TEXT_NODE)
    ) {
      const actual = node
        ? node.nodeType === Node.ELEMENT_NODE
          ? `<${(node as Element).tagName.toLowerCase()}>`
          : '#comment'
        : 'null';
    }
  } else {
    parent.appendChild(document.createTextNode(String(child)));
  }
}

/**
 * Render component to container - with descriptor support
 */
export function render(component: () => unknown, container: Element): () => void {
  let result = component();

  // Handle descriptor (Phase 2)
  if (isDescriptor(result)) {
    result = executeDescriptor(result);
  }

  // Ensure result is a Node
  if (!(result instanceof Node)) {
    throw new TypeError(
      `render() expected a Node, got ${typeof result}. Component must return a DOM element.`,
    );
  }

  container.appendChild(result);

  return () => {
    container.removeChild(result as Node);
  };
}
