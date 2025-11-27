/**
 * ScrollBox component for TUI
 *
 * Container with scrollable content support.
 * Enables mouse wheel and keyboard navigation.
 */

import { type MaybeReactive, resolve } from '@zen/runtime';
import { effect, signal } from '@zen/signal';
import { appendChild } from '../core/jsx-runtime.js';
import { scheduleNodeUpdate } from '../core/render-context.js';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { useMouseScroll } from '../hooks/useMouse.js';

export interface ScrollBoxProps {
  children?: any;
  style?: TUIStyle;
  /** Viewport height (required) - supports MaybeReactive */
  height: MaybeReactive<number>;
  /** Lines to scroll per step (default: 1) - supports MaybeReactive */
  scrollStep?: MaybeReactive<number>;
  /** Lines to scroll on page up/down (default: height - 1) - supports MaybeReactive */
  pageSize?: MaybeReactive<number>;
  /** Optional external scroll offset signal (for integration with Scrollbar) */
  scrollOffset?: any;
  /** Total content height (for scroll limiting) - supports MaybeReactive */
  contentHeight?: MaybeReactive<number>;
}

export function ScrollBox(props: ScrollBoxProps): TUINode {
  // Use external scrollOffset if provided, otherwise create internal one
  const scrollOffset = props.scrollOffset ?? signal(0);

  // Resolve reactive props
  const getHeight = () => resolve(props.height);
  const getScrollStep = () => resolve(props.scrollStep) ?? 1;
  const getPageSize = () => resolve(props.pageSize) ?? Math.max(1, getHeight() - 1);
  const getContentHeight = () => resolve(props.contentHeight);

  // Calculate maximum scroll offset
  const getMaxScroll = () => {
    const contentHeight = getContentHeight();
    if (contentHeight !== undefined) {
      // Account for border (2 lines if borderStyle is set)
      const hasBorder = props.style?.borderStyle && props.style.borderStyle !== 'none';
      const borderHeight = hasBorder ? 2 : 0;
      const padding = props.style?.padding ?? 0;
      const paddingY = props.style?.paddingY ?? padding;
      const viewportHeight = getHeight() - borderHeight - 2 * paddingY;
      return Math.max(0, contentHeight - viewportHeight);
    }
    return Number.POSITIVE_INFINITY; // No limit if contentHeight not provided
  };

  // Handle mouse scroll
  useMouseScroll((direction) => {
    const maxScroll = getMaxScroll();
    const scrollStep = getScrollStep();
    if (direction === 'up') {
      scrollOffset.value = Math.max(0, scrollOffset.value - scrollStep);
    } else {
      scrollOffset.value = Math.min(maxScroll, scrollOffset.value + scrollStep);
    }
  });

  // Handle keyboard navigation
  useInput((_input, key) => {
    const maxScroll = getMaxScroll();
    const scrollStep = getScrollStep();
    const pageSize = getPageSize();
    if (key.upArrow) {
      scrollOffset.value = Math.max(0, scrollOffset.value - scrollStep);
    } else if (key.downArrow) {
      scrollOffset.value = Math.min(maxScroll, scrollOffset.value + scrollStep);
    } else if (key.pageUp) {
      scrollOffset.value = Math.max(0, scrollOffset.value - pageSize);
    } else if (key.pageDown) {
      scrollOffset.value = Math.min(maxScroll, scrollOffset.value + pageSize);
    }
  });

  // Create container node
  const node: TUINode = {
    type: 'box',
    tagName: 'scrollbox',
    props: {
      ...props,
      scrollOffset, // Store scroll state
    },
    children: [],
    style: {
      ...props?.style,
      height: getHeight(),
      overflow: 'hidden' as any, // Mark as scrollable container
    },
  };

  // Handle children using appendChild for reactivity support
  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  // Track scrollOffset changes and trigger re-renders
  effect(() => {
    // Read scrollOffset to track it
    const _offset = scrollOffset.value;
    // Schedule a render update when scrollOffset changes
    scheduleNodeUpdate(node, '');
    return undefined;
  });

  return node;
}
