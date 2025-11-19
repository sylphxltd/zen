/**
 * ZenJS JSX Runtime - Optimized
 *
 * Performance optimizations:
 * 1. Avoid Object.entries() allocation
 * 2. Cache hydration state
 * 3. Optimize string operations
 * 4. Remove unnecessary checks
 * 5. Reorder conditions by frequency
 */

import { effect } from '@zen/signal';
import type { AnyZen } from '@zen/signal';
import { attachNodeToOwner, createOwner, setOwner } from '@zen/signal';
import { enterHydrateParent, getNextHydrateNode, isHydrating } from './hydrate.js';

export { Fragment } from './core/fragment.js';

type Props = Record<string, any>;
type Child = Node | string | number | boolean | null | undefined;
type ReactiveValue = AnyZen;

/**
 * Fast reactive check - inline for better performance
 * Check _kind first (faster than _value lookup)
 */
function isReactive(value: any): value is ReactiveValue {
  return value !== null && typeof value === 'object' && '_kind' in value;
}

/**
 * JSX factory function - optimized
 */
export function jsx(type: string | Function, props: Props | null): Node {
  // Component
  if (typeof type === 'function') {
    const owner = createOwner();
    setOwner(owner);

    try {
      const node = type(props);
      attachNodeToOwner(node, owner);
      return node;
    } finally {
      setOwner(null);
    }
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
function setAttribute(element: Element, key: string, value: any): void {
  // Fast path: most common cases first

  // Event listener (most common in interactive apps)
  if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
    // 'on' prefix check via char codes (faster than startsWith)
    const eventName = key.slice(2).toLowerCase();
    element.addEventListener(eventName, value);
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

  // Reactive value
  if (isReactive(value)) {
    // Special case: form control values
    if (
      key === 'value' &&
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement)
    ) {
      (element as any)[key] = value.value;

      effect(() => {
        const newValue = value.value;
        if ((element as any)[key] !== newValue) {
          (element as any)[key] = newValue;
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

  // Static value
  setStaticValue(element, key, value);
}

/**
 * Set static value - extracted to avoid duplication
 */
function setStaticValue(element: Element, key: string, value: any): void {
  // Property vs attribute
  if (key in element) {
    (element as any)[key] = value;
  } else {
    element.setAttribute(key, String(value));
  }
}

/**
 * Append child - optimized
 */
function appendChild(parent: Element, child: any, hydrating: boolean): void {
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

  // Node - common for components
  if (child instanceof Node) {
    if (!hydrating) {
      parent.appendChild(child);
    }
    return;
  }

  // Reactive signal - auto-unwrap (runtime-first)
  if (isReactive(child)) {
    const textNode = document.createTextNode('');
    if (!hydrating) {
      parent.appendChild(textNode);
    }

    // Wrap in effect for reactivity
    effect(() => {
      textNode.data = String(child.value ?? '');
      return undefined;
    });
    return;
  }

  // Function - reactive text (from unplugin transformation)
  if (typeof child === 'function') {
    const textNode = document.createTextNode('');
    if (!hydrating) {
      parent.appendChild(textNode);
    }

    // Wrap in effect for reactivity
    effect(() => {
      const value = child();
      textNode.data = String(value ?? '');
      return undefined;
    });
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
    }
  } else {
    parent.appendChild(document.createTextNode(String(child)));
  }
}

/**
 * Render component to container
 */
export function render(component: () => Node, container: Element): () => void {
  const node = component();
  container.appendChild(node);

  return () => {
    container.removeChild(node);
  };
}
