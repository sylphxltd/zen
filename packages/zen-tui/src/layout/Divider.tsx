/**
 * Divider component for TUI
 *
 * Horizontal divider line for separating content.
 */

import type { TUINode } from '../core/types.js';
import { Text } from '../primitives/Text.js';

export interface DividerProps {
  character?: string; // Character to use for divider (default: '─')
  width?: number; // Width of divider (default: full width)
  color?: string;
  padding?: number; // Vertical padding (default: 0)
  style?: any;
}

export function Divider(props: DividerProps): TUINode {
  const char = props.character || '─';
  const width = props.width || 80; // Default terminal width
  const padding = props.padding || 0;

  const line = char.repeat(width);

  return Text({
    children: line,
    color: props.color,
    dim: true,
    style: {
      marginTop: padding,
      marginBottom: padding,
      ...props.style,
    },
  });
}
