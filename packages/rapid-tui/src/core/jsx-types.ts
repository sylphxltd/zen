/**
 * JSX type definitions for @rapid/tui
 *
 * Defines the JSX namespace for custom TUI components.
 * This file provides types for @jsxImportSource @rapid/tui.
 */

import type { MouseClickEvent, TUIChildren, TUIElement, TUINode, TUIStyle } from './types.js';

// Reactive type - allows both direct values and getters
type MaybeReactive<T> = T | (() => T);

// Re-export for convenience
export type { TUIElement };

// JSX namespace for TypeScript
export namespace JSX {
  // Base props that all elements share - with index signature for extensibility
  interface BaseElementProps {
    key?: string | number;
    children?: TUIChildren;
    style?: TUIStyle | MaybeReactive<TUIStyle>;
    [key: string]: unknown;
  }

  // Box-specific props extending base
  export interface BoxElementProps extends BaseElementProps {
    onClick?: (event: MouseClickEvent) => void;
    props?: Record<string, unknown>;
  }

  // Text-specific props extending base
  export interface TextElementProps extends BaseElementProps {
    color?: MaybeReactive<string | undefined>;
    backgroundColor?: MaybeReactive<string | undefined>;
    bold?: MaybeReactive<boolean | undefined>;
    italic?: MaybeReactive<boolean | undefined>;
    underline?: MaybeReactive<boolean | undefined>;
    strikethrough?: MaybeReactive<boolean | undefined>;
    dim?: MaybeReactive<boolean | undefined>;
    inverse?: MaybeReactive<boolean | undefined>;
  }

  // Base element props for intrinsic elements
  export interface IntrinsicElements {
    box: BoxElementProps;
    text: TextElementProps;
    [elemName: string]: BaseElementProps;
  }

  // Result of JSX expressions
  // Includes TUIElement plus object for platform-agnostic components (For, Show, etc.)
  // These components return containers created by platform ops which are valid TUINodes at runtime
  export type Element = TUIElement | object;

  // Props passed to components
  export interface ElementChildrenAttribute {
    children: unknown;
  }

  // Allow any function component that returns TUIElement
  export interface ElementClass {
    render(): Element;
  }

  export interface IntrinsicAttributes {
    key?: string | number;
  }
}
