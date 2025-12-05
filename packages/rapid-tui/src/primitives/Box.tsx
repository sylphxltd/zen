/**
 * Box component for TUI
 *
 * Container component with flexbox layout support.
 * Similar to <div> in web but for terminal.
 *
 * Supports both Ink-style shorthand props and nested style object:
 * - `<Box flexDirection="row" gap={1}>` (shorthand)
 * - `<Box style={{ flexDirection: 'row', gap: 1 }}>` (nested)
 *
 * Shorthand props take precedence over style object properties.
 */

import { appendChild } from '../core/jsx-runtime.js';
import type { MouseClickEvent, TUIChildren, TUINode, TUIStyle } from '../core/types.js';

/**
 * BoxProps - Ink-compatible props interface
 *
 * All TUIStyle properties can be passed as top-level props (Ink style)
 * or nested in a `style` object.
 *
 * Supports reactive (function) values for style properties.
 */
export interface BoxProps extends TUIStyle {
  children?: TUIChildren;
  /** Style object or function returning style object (for reactivity) */
  style?: TUIStyle | (() => TUIStyle);
  /** Click handler - called when the box is clicked */
  onClick?: (event: MouseClickEvent) => void;
  /** React key for list rendering */
  key?: string | number;
  /** Custom properties to attach to the node */
  props?: Record<string, unknown>;
}

/**
 * Style properties that can be passed as shorthand props
 */
const STYLE_PROPS: (keyof TUIStyle)[] = [
  // Layout
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  // Positioning
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'zIndex',
  // Flexbox
  'flex',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'justifyContent',
  // Spacing
  'padding',
  'paddingX',
  'paddingY',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginX',
  'marginY',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
  // Border
  'borderStyle',
  'borderColor',
  // Colors
  'color',
  'backgroundColor',
  // Text
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'dim',
  'inverse',
  // Overflow
  'overflow',
];

export function Box(props: BoxProps): TUINode {
  // Handle style as function or object
  const resolveStyle = (): TUIStyle => {
    const baseStyle = typeof props?.style === 'function' ? props.style() : props?.style || {};
    const mergedStyle: TUIStyle = { ...baseStyle };

    for (const prop of STYLE_PROPS) {
      if (props && prop in props && (props as Record<string, unknown>)[prop] !== undefined) {
        (mergedStyle as Record<string, unknown>)[prop] = (props as Record<string, unknown>)[prop];
      }
    }
    return mergedStyle;
  };

  // If style is a function, keep it as a function for reactivity
  const style = typeof props?.style === 'function' ? resolveStyle : resolveStyle();

  const node: TUINode = {
    type: 'box',
    tagName: 'box',
    props: props || {},
    children: [],
    style: style as TUIStyle,
  };

  // Handle children using appendChild for reactivity support
  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
