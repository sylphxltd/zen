/**
 * JSX type definitions for @rapid/tui
 *
 * Defines the JSX namespace for custom TUI components.
 * This file overrides React's JSX types for the @rapid/tui jsxImportSource.
 */

import type { ComponentDescriptor } from '@rapid/runtime';
import type { MouseClickEvent, TUINode, TUIStyle } from './types.js';

// Reactive type - allows both direct values and getters
type MaybeReactive<T> = T | (() => T);

// TUI Element type - what JSX expressions evaluate to
export type TUIElement = TUINode | TUINode[] | ComponentDescriptor;

// Child element types - allow reactive functions for fine-grained reactivity
type ChildElement = TUIElement | string | number | null | undefined;
type ChildrenType = ChildElement | ChildElement[] | (() => ChildElement | ChildElement[]);

export namespace JSX {
  // Base element props for intrinsic elements
  interface IntrinsicElements {
    box: BoxElementProps;
    text: TextElementProps;
    [elemName: string]: Record<string, unknown>;
  }

  interface BoxElementProps {
    style?: TUIStyle | MaybeReactive<TUIStyle>;
    children?: ChildrenType;
    onClick?: (event: MouseClickEvent) => void;
    props?: Record<string, unknown>;
    key?: string | number;
  }

  interface TextElementProps {
    style?: TUIStyle | MaybeReactive<TUIStyle>;
    children?: ChildrenType;
    color?: MaybeReactive<string | undefined>;
    backgroundColor?: MaybeReactive<string | undefined>;
    bold?: MaybeReactive<boolean | undefined>;
    italic?: MaybeReactive<boolean | undefined>;
    underline?: MaybeReactive<boolean | undefined>;
    strikethrough?: MaybeReactive<boolean | undefined>;
    dim?: MaybeReactive<boolean | undefined>;
    inverse?: MaybeReactive<boolean | undefined>;
    key?: string | number;
  }

  // Result of JSX expressions - allows TUINode and component descriptors
  type Element = TUIElement;

  // Props passed to components
  interface ElementChildrenAttribute {
    children: unknown;
  }

  // Allow any function component that returns TUIElement
  interface ElementClass {
    render(): Element;
  }

  interface IntrinsicAttributes {
    key?: string | number;
  }
}
