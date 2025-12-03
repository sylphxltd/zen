/**
 * Rapid Signal - React JSX Runtime
 *
 * Runtime-first signal integration for React.
 * Auto-detects and unwraps Rapid signals without compiler transformations.
 *
 * Usage:
 * ```tsx
 * import { signal } from '@rapid/signal-core';
 *
 * const count = signal(0);
 * <div>{count}</div>  // Automatically reactive!
 * ```
 */

import React, { type ReactElement, useEffect, useState } from 'react';
import * as ReactJSX from 'react/jsx-runtime';

// ============================================================================
// SIGNAL DETECTION
// ============================================================================

/**
 * Check if value is a Rapid signal
 * Matches Rapid framework's isReactive check
 */
// biome-ignore lint/suspicious/noExplicitAny: Runtime detection requires dynamic type
function isZenSignal(value: any): boolean {
  return value !== null && typeof value === 'object' && '_kind' in value;
}

// ============================================================================
// REACTIVE WRAPPER COMPONENT
// ============================================================================

/**
 * Wrapper component that subscribes to a signal and updates on changes
 * Uses React hooks for integration with React's rendering system
 */
// biome-ignore lint/suspicious/noExplicitAny: Component must handle any signal type
function ZenReactive({ signal }: { signal: any }): any {
  const [value, setValue] = useState(() => signal.value);

  useEffect(() => {
    // Subscribe to signal changes
    // The signal.subscribe API provides an unsubscribe function
    if (typeof signal.subscribe === 'function') {
      return signal.subscribe((newValue: any) => {
        setValue(newValue);
      });
    }

    // Fallback for signals without subscribe (shouldn't happen)
    return () => {};
  }, [signal]);

  return value;
}

// ============================================================================
// JSX RUNTIME
// ============================================================================

/**
 * Custom JSX transform that auto-detects signals in children
 *
 * Process:
 * 1. Check if children contain signals
 * 2. Wrap signals in ZenReactive component
 * 3. Pass through to React's JSX runtime
 */
// biome-ignore lint/suspicious/noExplicitAny: JSX runtime requires dynamic types for type and props
export function jsx(type: any, props: any, key?: any): ReactElement {
  // Only process DOM elements (strings) that have children
  if (typeof type === 'string' && props?.children !== undefined) {
    const { children, ...restProps } = props;

    // Single child - check if it's a signal
    if (isZenSignal(children)) {
      const wrappedChild = React.createElement(ZenReactive, { signal: children });
      return ReactJSX.jsx(type, { ...restProps, children: wrappedChild }, key);
    }

    // Array of children - check each child
    if (Array.isArray(children)) {
      const wrappedChildren = children.map((child, i) =>
        isZenSignal(child) ? React.createElement(ZenReactive, { key: i, signal: child }) : child,
      );
      return ReactJSX.jsx(type, { ...restProps, children: wrappedChildren }, key);
    }
  }

  // Pass through to React's JSX runtime
  return ReactJSX.jsx(type, props, key);
}

/**
 * JSX transform for multiple children
 * Same logic as jsx() but for static children arrays
 */
// biome-ignore lint/suspicious/noExplicitAny: JSX runtime requires dynamic types for type and props
export function jsxs(type: any, props: any, key?: any): ReactElement {
  // Only process DOM elements (strings) that have children
  if (typeof type === 'string' && props?.children !== undefined) {
    const { children, ...restProps } = props;

    // Array of children - check each child
    if (Array.isArray(children)) {
      const wrappedChildren = children.map((child, i) =>
        isZenSignal(child) ? React.createElement(ZenReactive, { key: i, signal: child }) : child,
      );
      return ReactJSX.jsxs(type, { ...restProps, children: wrappedChildren }, key);
    }

    // Single child - check if it's a signal
    if (isZenSignal(children)) {
      const wrappedChild = React.createElement(ZenReactive, { signal: children });
      return ReactJSX.jsxs(type, { ...restProps, children: wrappedChild }, key);
    }
  }

  // Pass through to React's JSX runtime
  return ReactJSX.jsxs(type, props, key);
}

/**
 * Development mode JSX transform
 * Includes additional dev-only features like __source and __self
 */
// biome-ignore lint/suspicious/noExplicitAny: JSX DEV runtime requires dynamic types
export function jsxDEV(
  type: any,
  props: any,
  key?: any,
  isStaticChildren?: boolean,
  source?: any,
  self?: any,
): ReactElement {
  // Only process DOM elements (strings) that have children
  if (typeof type === 'string' && props?.children !== undefined) {
    const { children, ...restProps } = props;

    // Single child - check if it's a signal
    if (isZenSignal(children)) {
      const wrappedChild = React.createElement(ZenReactive, { signal: children });
      return (ReactJSX as any).jsxDEV(
        type,
        { ...restProps, children: wrappedChild },
        key,
        isStaticChildren,
        source,
        self,
      );
    }

    // Array of children - check each child
    if (Array.isArray(children)) {
      const wrappedChildren = children.map((child, i) =>
        isZenSignal(child) ? React.createElement(ZenReactive, { key: i, signal: child }) : child,
      );
      return (ReactJSX as any).jsxDEV(
        type,
        { ...restProps, children: wrappedChildren },
        key,
        isStaticChildren,
        source,
        self,
      );
    }
  }

  // Pass through to React's JSX runtime
  return (ReactJSX as any).jsxDEV(type, props, key, isStaticChildren, source, self);
}

// Re-export Fragment from React
export { Fragment } from 'react';
