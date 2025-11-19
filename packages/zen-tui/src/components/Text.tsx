/**
 * Text component for TUI
 *
 * Renders text with styling support.
 */

import type { TUINode, TUIStyle } from '../types.js';

export interface TextProps {
  children?: any;
  style?: TUIStyle;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
}

export function Text(props: TextProps): TUINode {
  const style: TUIStyle = {
    ...props?.style,
    color: props?.color || props?.style?.color,
    backgroundColor: props?.backgroundColor || props?.style?.backgroundColor,
    bold: props?.bold !== undefined ? props.bold : props?.style?.bold,
    italic: props?.italic !== undefined ? props.italic : props?.style?.italic,
    underline: props?.underline !== undefined ? props.underline : props?.style?.underline,
    strikethrough:
      props?.strikethrough !== undefined ? props.strikethrough : props?.style?.strikethrough,
    dim: props?.dim !== undefined ? props.dim : props?.style?.dim,
  };

  const node: TUINode = {
    type: 'text',
    tagName: 'text',
    props: props || {},
    children: [],
    style,
  };

  // Handle children (text content)
  if (props?.children !== undefined) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child != null && child !== false) {
        node.children.push(String(child));
      }
    }
  }

  return node;
}
