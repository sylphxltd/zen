/**
 * RouterLink component for TUI
 * Navigation link for client-side routing
 * Powered by @rapid/router-core
 */

import { open } from '@rapid/router-core';
import { signal } from '@rapid/signal';
import { useFocus, useInput } from '@rapid/tui';
import type { TUINode, TUIStyle } from '@rapid/tui';

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

  const linkId = id || `router-link-${Math.random().toString(36).slice(2, 9)}`;

  // Visual states
  const isPressed = signal(false);

  const { isFocused } = useFocus({
    id: linkId,
    isActive: true,
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (!isFocused.value) return undefined;

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
    return undefined;
  });

  // Compute color based on state
  const linkColor = () => {
    if (isPressed.value) return activeColor;
    if (isFocused.value) return focusColor;
    return color;
  };

  // Create text node manually to avoid JSX build issues
  // Use type assertion for reactive style functions (valid at runtime)
  const node: TUINode = {
    type: 'text',
    tagName: 'router-link',
    props: {},
    children: [],
    style: {
      ...style,
      color: linkColor as unknown as string,
      underline: true,
      bold: (() => isFocused.value) as unknown as boolean,
    },
  };

  // Add children
  if (children !== undefined) {
    if (Array.isArray(children)) {
      node.children.push(...children);
    } else {
      node.children.push(children);
    }
  } else {
    node.children.push(href);
  }

  return node;
}
