/**
 * Spacer component for TUI
 *
 * Flexible spacing component that fills available space.
 * Similar to flexbox flex-grow: 1 in web.
 *
 * Note: Currently renders as empty space.
 * Full flexbox support will make this truly flexible.
 */

import type { TUINode } from '../types.js';

export interface SpacerProps {
  // Future: support for minimum spacing
  minHeight?: number;
  minWidth?: number;
}

export function Spacer(props: SpacerProps = {}): TUINode {
  return {
    type: 'box',
    tagName: 'spacer',
    props: props,
    children: [],
    style: {
      flexGrow: 1,
      flexShrink: 1,
      ...props,
    },
  };
}
