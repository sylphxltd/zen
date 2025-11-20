/**
 * Newline component for TUI
 *
 * Renders one or more newlines/line breaks.
 * Useful for spacing between elements.
 */

import type { TUINode } from '../types.js';

export interface NewlineProps {
  count?: number;
}

export function Newline(props: NewlineProps = {}): TUINode {
  const count = props.count ?? 1;
  const newlines = '\n'.repeat(Math.max(0, count - 1)); // -1 because Box already adds newline

  return {
    type: 'text',
    tagName: 'text',
    props: { children: newlines },
    children: [newlines],
    style: {},
  };
}
