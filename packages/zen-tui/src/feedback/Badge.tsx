/**
 * Badge component for TUI
 *
 * Small status indicator with colored background.
 */

import { type MaybeReactive, resolve } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

type BadgeColor = 'green' | 'red' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';

export interface BadgeProps {
  /** Badge content - supports MaybeReactive */
  children: MaybeReactive<string>;
  /** Badge color - supports MaybeReactive */
  color?: MaybeReactive<BadgeColor>;
  /** Custom styles */
  style?: any;
}

export function Badge(props: BadgeProps): TUINode {
  return Box({
    style: {
      backgroundColor: () => resolve(props.color) || 'cyan',
      paddingX: 1,
      ...props.style,
    },
    children: Text({
      children: () => resolve(props.children),
      color: 'black',
      bold: true,
    }),
  });
}
