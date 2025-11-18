/**
 * ZenJS JSX Runtime
 *
 * Renders JSX to fine-grained reactive DOM
 * Powered by @zen/signal reactive core
 */

import { effect } from '@zen/signal';
import type { AnyZen } from '@zen/signal';

export { Fragment } from './core/fragment.js';

type Props = Record<string, any>;
type Child = Node | string | number | boolean | null | undefined;
type ReactiveValue = AnyZen;

/**
 * Check if value is a reactive signal/computed from @zen/signal
 * Zen signals have _value and _observers properties
 */
function isReactive(value: any): value is ReactiveValue {
  return value !== null && typeof value === 'object' && '_value' in value && '_observers' in value;
}

/**
 * JSX factory function
 */
export function jsx(type: string | Function, props: Props | null): Node {
  const { children, ...restProps } = props || {};

  // Component
  if (typeof type === 'function') {
    return type({ ...restProps, children });
  }

  // Element
  const element = document.createElement(type);

  // Set properties and attributes
  if (restProps) {
    for (const [key, value] of Object.entries(restProps)) {
      setAttribute(element, key, value);
    }
  }

  // Append children
  if (children !== undefined) {
    appendChild(element, children);
  }

  return element;
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * Set attribute/property on element
 */
function setAttribute(element: Element, key: string, value: any): void {
  // Ref callback
  if (key === 'ref') {
    if (typeof value === 'function') {
      value(element);
    }
    return;
  }

  // Event listener
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    element.addEventListener(eventName, value);
    return;
  }

  // Reactive value (Signal or Computed)
  if (isReactive(value)) {
    // Special handling for form control values - don't use effect
    // to avoid interfering with user input
    if (
      key === 'value' &&
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement)
    ) {
      (element as any)[key] = value.value;
      return;
    }

    effect(() => {
      setStaticAttribute(element, key, value.value);
      return undefined;
    });
    return;
  }

  // Static value
  setStaticAttribute(element, key, value);
}

/**
 * Set static attribute value
 */
function setStaticAttribute(element: Element, key: string, value: any): void {
  // Class name
  if (key === 'className' || key === 'class') {
    element.className = String(value);
    return;
  }

  // Style
  if (key === 'style') {
    if (typeof value === 'string') {
      (element as HTMLElement).style.cssText = value;
    } else if (typeof value === 'object') {
      Object.assign((element as HTMLElement).style, value);
    }
    return;
  }

  // Property vs attribute
  if (key in element) {
    (element as any)[key] = value;
  } else {
    element.setAttribute(key, String(value));
  }
}

/**
 * Append child to element
 */
function appendChild(parent: Element, child: any): void {
  if (child === null || child === undefined || child === false) {
    return;
  }

  // Array of children
  if (Array.isArray(child)) {
    for (const c of child) {
      appendChild(parent, c);
    }
    return;
  }

  // Reactive child (Signal or Computed)
  if (isReactive(child)) {
    const textNode = document.createTextNode('');
    parent.appendChild(textNode);

    effect(() => {
      const value = child.value;
      textNode.data = String(value ?? '');
      return undefined;
    });
    return;
  }

  // Node
  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  // Text
  parent.appendChild(document.createTextNode(String(child)));
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
