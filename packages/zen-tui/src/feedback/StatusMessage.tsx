/**
 * StatusMessage component for TUI
 *
 * Status indicator with icon and colored message.
 * Matches @inkjs/ui StatusMessage behavior.
 */

import { type MaybeReactive, resolve } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface StatusMessageProps {
  /** Message type - supports MaybeReactive */
  type: MaybeReactive<StatusType>;
  /** Message content - supports MaybeReactive */
  children: MaybeReactive<string>;
  /** Custom styles */
  style?: any;
}

const STATUS_CONFIG = {
  success: {
    icon: '✓',
    color: 'green' as const,
  },
  error: {
    icon: '✗',
    color: 'red' as const,
  },
  warning: {
    icon: '⚠',
    color: 'yellow' as const,
  },
  info: {
    icon: 'ℹ',
    color: 'cyan' as const,
  },
};

export function StatusMessage(props: StatusMessageProps): TUINode {
  return Box({
    style: {
      flexDirection: 'row',
      ...props.style,
    },
    children: () => {
      const type = resolve(props.type);
      const children = resolve(props.children);
      const config = STATUS_CONFIG[type];

      return [
        Text({
          children: config.icon,
          color: config.color,
          bold: true,
          style: { marginRight: 1 },
        }),
        Text({
          children: children,
          color: config.color,
        }),
      ];
    },
  });
}
