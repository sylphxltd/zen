/**
 * SSR JSX Runtime - String-based rendering
 *
 * Generates HTML strings instead of DOM nodes for server-side rendering.
 * Used automatically when bundling for server environments.
 *
 * IMPORTANT: SSR must emit marker comments (<!--signal-->, <!--reactive-->)
 * to match client hydration expectations. Without these, hydration cursor
 * gets misaligned.
 */

import { executeComponent, isSignal } from '@rapid/runtime';

// Symbol to mark safe HTML strings
const SAFE_HTML = Symbol('SAFE_HTML');

type SafeHtml = {
  [SAFE_HTML]: true;
  html: string;
};

function isSafeHtml(value: any): value is SafeHtml {
  return value && typeof value === 'object' && value[SAFE_HTML] === true;
}

function createSafeHtml(html: string): SafeHtml {
  return { [SAFE_HTML]: true, html };
}

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

  for (const [key, rawValue] of Object.entries(props)) {
    // Skip special props
    if (key === 'children' || key === 'ref' || key === 'key') continue;

    // Skip event handlers (client-only)
    if (key.startsWith('on')) continue;

    // Unwrap reactive values (signals and functions)
    let value = rawValue;
    if (isSignal(value)) {
      value = value.value;
    } else if (typeof value === 'function') {
      // Only unwrap for reactive attributes (same list as client-side)
      const reactiveAttrs = [
        'value',
        'checked',
        'disabled',
        'selected',
        'innerHTML',
        'textContent',
      ];
      if (reactiveAttrs.includes(key)) {
        value = value();
      }
    }

    // Skip undefined/null (check after unwrapping)
    if (value == null) continue;

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

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
}

/**
 * Render children to HTML string
 *
 * IMPORTANT: Signals and functions emit marker comments to match
 * client-side hydration. Client creates <!--signal--> and <!--reactive-->
 * markers, so SSR must emit them too for hydration cursor alignment.
 */
function renderChildren(children: any): string {
  // Null/undefined
  if (children == null) return '';

  // Safe HTML (from jsx() calls)
  if (isSafeHtml(children)) return children.html;

  // String/number (escape for XSS protection)
  if (typeof children === 'string') return escapeHtml(children);
  if (typeof children === 'number') return String(children);
  if (typeof children === 'boolean') return '';

  // Array
  if (Array.isArray(children)) {
    return children.map(renderChildren).join('');
  }

  // Signal - emit marker for hydration alignment
  // Client creates <!--signal--> marker, so SSR must match
  if (isSignal(children)) {
    return `<!--signal-->${renderChildren(children.value)}`;
  }

  // Function (reactive content) - emit marker for hydration alignment
  // Client creates <!--reactive--> marker, so SSR must match
  if (typeof children === 'function') {
    return `<!--reactive-->${renderChildren(children())}`;
  }

  // DOM Comment nodes (from Show, For, etc.) - render as HTML comments
  if (typeof children === 'object' && children.nodeType === 8) {
    return `<!--${children.textContent || ''}-->`;
  }

  return '';
}

/**
 * JSX factory function for SSR
 */
export function jsx(type: any, props: any): SafeHtml {
  const { children, ...restProps } = props || {};

  // Component function
  if (typeof type === 'function') {
    return executeComponent(() => {
      const result = type({ ...restProps, children });
      const html = renderChildren(result);
      return createSafeHtml(html);
    });
  }

  // Intrinsic HTML element
  const attrs = renderAttributes(restProps);
  const childrenHtml = renderChildren(children);

  // Void elements (self-closing)
  if (VOID_ELEMENTS.has(type)) {
    return createSafeHtml(`<${type}${attrs} />`);
  }

  // Regular element
  return createSafeHtml(`<${type}${attrs}>${childrenHtml}</${type}>`);
}

// Aliases for different JSX modes
export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * Fragment component
 */
export function Fragment(props: { children?: any }): SafeHtml {
  const html = renderChildren(props.children);
  return createSafeHtml(html);
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
