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
import type { MouseClickEvent, TUINode, TUIStyle } from '../core/types.js';

/**
 * BoxProps - Ink-compatible props interface
 *
 * All TUIStyle properties can be passed as top-level props (Ink style)
 * or nested in a `style` object.
 */
export interface BoxProps extends TUIStyle {
  children?: any;
  style?: TUIStyle;
  /** Click handler - called when the box is clicked */
  onClick?: (event: MouseClickEvent) => void;
  /** React key for list rendering */
  key?: string | number;
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
  // Merge shorthand props with style object (shorthand takes precedence)
  const mergedStyle: TUIStyle = { ...(props?.style || {}) };

  for (const prop of STYLE_PROPS) {
    if (props && prop in props && (props as Record<string, unknown>)[prop] !== undefined) {
      (mergedStyle as Record<string, unknown>)[prop] = (props as Record<string, unknown>)[prop];
    }
  }

  const node: TUINode = {
    type: 'box',
    tagName: 'box',
    props: props || {},
    children: [],
    style: mergedStyle,
  };

  // Handle children using appendChild for reactivity support
  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
