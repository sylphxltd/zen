/**
 * RouterLink component for TUI
 * Navigation link for client-side routing
 * Powered by @zen/router-core
 */

import { open } from '@zen/router-core';
import { createUniqueId, signal } from '@zen/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { useFocus } from '../utils/focus.js';

export interface RouterLinkProps {
  href: string;
  children?: any;
  style?: TUIStyle;
  color?: string;
  focusColor?: string;
  activeColor?: string;
  id?: string;
}

/**
 * RouterLink - Navigation link with client-side routing for TUI
 *
 * Focusable link that navigates to a route when activated (Enter/Space).
 * Shows visual feedback for focus and active states.
 *
 * @example
 * ```tsx
 * <RouterLink href="/">Home</RouterLink>
 * <RouterLink href="/about">About</RouterLink>
 * <RouterLink href="/users/123">User Profile</RouterLink>
 * ```
 */
export function RouterLink(props: RouterLinkProps): TUINode {
  const {
    href,
    children,
    style,
    color = 'cyan',
    focusColor = 'yellow',
    activeColor = 'green',
    id,
  } = props;

  const linkId = id || `router-link-${createUniqueId()}`;

  // Visual states
  const isPressed = signal(false);

  const { isFocused } = useFocus({
    id: linkId,
    isActive: true,
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (!isFocused.value) return;

    // Enter or Space to navigate
    if (key.return || input === ' ') {
      // Visual feedback
      isPressed.value = true;
      setTimeout(() => {
        isPressed.value = false;
      }, 100);

      // Navigate to route
      open(href);
    }
  });

  // Compute color based on state
  const linkColor = () => {
    if (isPressed.value) return activeColor;
    if (isFocused.value) return focusColor;
    return color;
  };

  // Create text node manually to avoid JSX build issues
  const node: TUINode = {
    type: 'text',
    tagName: 'router-link',
    props: {},
    children: [],
    style: {
      ...style,
      color: linkColor,
      underline: true,
      bold: () => isFocused.value,
    },
  };

  // Add children
  appendChild(node, children || href);

  return node;
}
