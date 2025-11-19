/**
 * SSR JSX Runtime - String-based rendering
 *
 * Generates HTML strings instead of DOM nodes for server-side rendering.
 * Used automatically when bundling for server environments.
 */

import { createOwner, setOwner, getOwner } from './lifecycle.js';

// Void elements that don't have closing tags
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert style object to CSS string
 */
function styleToString(style: Record<string, any>): string {
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}:${value}`;
    })
    .join(';');
}

/**
 * Render props as HTML attributes
 */
function renderAttributes(props: Record<string, any>): string {
  const attrs: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    // Skip special props
    if (key === 'children' || key === 'ref' || key === 'key') continue;

    // Skip undefined/null
    if (value == null) continue;

    // Skip event handlers (client-only)
    if (key.startsWith('on')) continue;

    // Boolean attributes
    if (typeof value === 'boolean') {
      if (value) attrs.push(key);
      continue;
    }

    // className → class
    const attrName = key === 'className' ? 'class' : key;

    // Style object → string
    if (key === 'style' && typeof value === 'object') {
      const styleStr = styleToString(value);
      if (styleStr) attrs.push(`style="${styleStr}"`);
      continue;
    }

    // Regular attribute
    attrs.push(`${attrName}="${escapeHtml(String(value))}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Render children to HTML string
 */
function renderChildren(children: any): string {
  // Null/undefined
  if (children == null) return '';

  // String/number
  if (typeof children === 'string') return escapeHtml(children);
  if (typeof children === 'number') return String(children);
  if (typeof children === 'boolean') return '';

  // Array
  if (Array.isArray(children)) {
    return children.map(renderChildren).join('');
  }

  // Function (shouldn't happen in normal JSX, but handle it)
  if (typeof children === 'function') {
    return renderChildren(children());
  }

  // Already rendered string (from components)
  if (typeof children === 'string') return children;

  // DOM Comment nodes (from Show, For, etc.)
  // These are marker comments, skip them in SSR
  return '';
}

/**
 * JSX factory function for SSR
 */
export function jsx(type: any, props: any): string {
  const { children, ...restProps } = props || {};

  // Component function
  if (typeof type === 'function') {
    // Create owner for component scope
    const owner = createOwner();
    const prev = getOwner();
    setOwner(owner);

    try {
      // Execute component
      const result = type({ ...restProps, children });
      return renderChildren(result);
    } finally {
      setOwner(prev);
    }
  }

  // Intrinsic HTML element
  const attrs = renderAttributes(restProps);
  const childrenHtml = renderChildren(children);

  // Void elements (self-closing)
  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attrs} />`;
  }

  // Regular element
  return `<${type}${attrs}>${childrenHtml}</${type}>`;
}

// Aliases for different JSX modes
export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * Fragment component
 */
export function Fragment(props: { children?: any }): string {
  return renderChildren(props.children);
}

/**
 * Render function (for manual usage)
 */
export function render(fn: () => string, container?: Element): string {
  const html = fn();

  // If container provided (for testing), set innerHTML
  if (container) {
    container.innerHTML = html;
  }

  return html;
}
