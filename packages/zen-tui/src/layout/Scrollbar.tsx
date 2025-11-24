/**
 * Scrollbar component for TUI
 *
 * Visual indicator showing scroll position and scrollable range.
 * Can be used standalone or with ScrollBox.
 */

import { effect } from '@zen/signal';
import type { Signal } from '@zen/signal';
import { appendChild } from '../core/jsx-runtime.js';
import { scheduleNodeUpdate } from '../core/render-context.js';
import type { TUINode, TUIStyle } from '../core/types.js';
import { Text } from '../primitives/Text.js';

export interface ScrollbarProps {
  scrollOffset: Signal<number>; // Current scroll offset
  contentHeight: number; // Total height of scrollable content
  viewportHeight: number; // Visible viewport height
  position?: 'left' | 'right'; // Scrollbar position (default: 'right')
  style?: TUIStyle;
  trackChar?: string; // Character for track (default: '│')
  thumbChar?: string; // Character for thumb (default: '█')
  trackColor?: string; // Color of track
  thumbColor?: string; // Color of thumb
}

export function Scrollbar(props: ScrollbarProps): TUINode {
  const {
    scrollOffset,
    contentHeight,
    viewportHeight,
    trackChar = '│',
    thumbChar = '█',
    trackColor = 'gray',
    thumbColor = 'cyan',
  } = props;

  // Calculate scrollbar dimensions
  const trackHeight = viewportHeight;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);

  // Calculate thumb size (proportional to viewport vs content)
  const thumbSize = Math.max(1, Math.floor((viewportHeight / contentHeight) * trackHeight));

  // Calculate thumb position
  const getThumbPosition = (): number => {
    if (maxScroll === 0) return 0; // No scrolling needed
    const scrollRatio = scrollOffset.value / maxScroll;
    const availableSpace = trackHeight - thumbSize;
    return Math.floor(scrollRatio * availableSpace);
  };

  // Create container node
  const node: TUINode = {
    type: 'box',
    tagName: 'scrollbar',
    props: {},
    children: [],
    style: {
      ...props.style,
      flexDirection: 'column',
      width: 1,
      height: viewportHeight,
    },
  };

  // Render scrollbar lines
  const renderLines = () => {
    const thumbPos = getThumbPosition();
    node.children = [];

    for (let i = 0; i < trackHeight; i++) {
      const isThumb = i >= thumbPos && i < thumbPos + thumbSize;

      const textNode: TUINode = {
        type: 'text',
        tagName: 'text',
        props: {},
        children: [isThumb ? thumbChar : trackChar],
        style: {
          color: isThumb ? thumbColor : trackColor,
        },
      };

      appendChild(node, textNode);
    }
  };

  // Initial render
  renderLines();

  // Track scrollOffset changes and re-render
  effect(() => {
    // Read scrollOffset to track it
    const _offset = scrollOffset.value;
    renderLines();
    // Schedule a render update when scrollOffset changes
    scheduleNodeUpdate(node, '');
    return undefined;
  });

  return node;
}
