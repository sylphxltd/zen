/**
 * Link component for TUI
 *
 * Clickable terminal link using OSC 8 escape sequences.
 * Matches ink-link behavior with fallback for unsupported terminals.
 */

import { type MaybeReactive, resolve } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { Text } from '../primitives/Text.js';

export interface LinkProps {
  /** URL to link to - supports MaybeReactive */
  url: MaybeReactive<string>;
  /** Link text - supports MaybeReactive */
  children: MaybeReactive<string>;
  /** Show URL in parentheses if true (default: false) - supports MaybeReactive */
  fallback?: MaybeReactive<boolean>;
  /** Custom styles */
  style?: any;
}

/**
 * Link component with terminal hyperlink support
 *
 * Uses OSC 8 escape sequences for clickable links.
 * Supported in: iTerm2, Terminal.app (macOS 10.15+), VSCode, Windows Terminal
 */
export function Link(props: LinkProps): TUINode {
  return Text({
    children: () => {
      const url = resolve(props.url);
      const children = resolve(props.children);
      const fallback = resolve(props.fallback) ?? false;

      // OSC 8 format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
      // See: https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
      return fallback ? `${children} (${url})` : `\x1b]8;;${url}\x1b\\${children}\x1b]8;;\x1b\\`;
    },
    color: 'cyan',
    underline: true,
    ...props.style,
  });
}
