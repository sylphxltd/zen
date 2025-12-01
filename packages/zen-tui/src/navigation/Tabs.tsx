/**
 * Tabs component for TUI
 *
 * Tab navigation with keyboard shortcuts.
 * Matches Ink tabs behavior.
 */

import { type Signal, createUniqueId, signal } from '@zen/runtime';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

export interface TabProps {
  name: string;
  children: TUINode | (() => TUINode);
}

export interface TabsProps {
  children: TabProps[] | TUINode[]; // Array of Tab components
  activeTab?: Signal<number> | number;
  onChange?: (index: number) => void;
  id?: string;
  style?: TUIStyle;
}

/**
 * Tab component - wrapper for tab content
 * Returns a special marker node that Tabs can identify and extract metadata from
 */
export function Tab(props: TabProps): TUINode {
  // Create a marker node that carries tab metadata
  // Tabs will extract this before rendering
  const marker: TUINode = {
    type: 'box',
    tagName: 'tab-marker',
    props: {
      __tabName: props.name, // Store tab name in props for Tabs to extract
      __tabChildren: props.children,
    },
    children: [],
    style: {},
  };

  return marker;
}

/**
 * Tabs component - tabbed navigation
 */
export function Tabs(props: TabsProps): TUINode {
  const id = props.id || `tabs-${createUniqueId()}`;

  // Active tab index
  const activeTabSignal =
    typeof props.activeTab === 'object' && 'value' in props.activeTab
      ? (props.activeTab as Signal<number>)
      : signal(typeof props.activeTab === 'number' ? props.activeTab : 0);

  // Focus management
  const { isFocused } = useFocus({ id });

  // Extract tab data from children
  const rawChildren = Array.isArray(props.children) ? props.children : [props.children];

  // Extract tab data: children are executed Tab components which return marker nodes
  const tabs = rawChildren.map((child: any) => {
    // Check if this is a tab marker node (created by Tab component)
    if (
      child &&
      typeof child === 'object' &&
      child.tagName === 'tab-marker' &&
      child.props?.__tabName
    ) {
      // Extract metadata from marker
      return {
        name: child.props.__tabName,
        children: child.props.__tabChildren,
      };
    }
    // Fallback for non-marker children
    return {
      name: undefined,
      children: child,
    };
  });

  const tabCount = tabs.length;

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleTabsInput(input, activeTabSignal, tabCount, props.onChange);
  });

  return Box({
    style: {
      flexDirection: 'column',
      ...props.style,
    },
    children: () => {
      const activeIndex = activeTabSignal.value;
      const focused = isFocused.value;

      // Render tab headers
      const tabHeaders = tabs.map((tab: any, index: number) => {
        const tabName = tab.name || `Tab ${index + 1}`;
        const isActive = activeIndex === index;

        return Text({
          key: `tab-header-${index}`,
          children: ` ${tabName} `,
          color: isActive ? 'cyan' : 'gray',
          bold: isActive,
          inverse: isActive,
          underline: isActive,
          style: { marginRight: 1 },
        });
      });

      // Get active tab content
      const activeTab = tabs[activeIndex];
      const tabChildren = activeTab?.children;
      const activeContent = tabChildren
        ? typeof tabChildren === 'function'
          ? tabChildren()
          : tabChildren
        : null;

      return [
        // Tab headers row
        Box({
          style: {
            flexDirection: 'row',
            borderStyle: focused ? 'round' : 'single',
            borderColor: focused ? 'cyan' : undefined,
            paddingX: 1,
            marginBottom: 1,
          },
          children: tabHeaders,
        }),
        // Active tab content
        Box({
          style: { flexDirection: 'column' },
          children: activeContent,
        }),
      ];
    },
  });
}

/**
 * Input handler for Tabs
 */
export function handleTabsInput(
  key: string,
  activeTabSignal: Signal<number>,
  tabCount: number,
  onChange?: (index: number) => void,
): boolean {
  const currentIndex = activeTabSignal.value;

  switch (key) {
    case '\x1b[D': // Left arrow
    case 'h':
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        activeTabSignal.value = newIndex;
        onChange?.(newIndex);
      }
      return true;

    case '\x1b[C': // Right arrow
    case 'l':
      if (currentIndex < tabCount - 1) {
        const newIndex = currentIndex + 1;
        activeTabSignal.value = newIndex;
        onChange?.(newIndex);
      }
      return true;

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9': {
      // Number keys for direct tab access
      const num = Number.parseInt(key, 10);
      if (num > 0 && num <= tabCount) {
        const newIndex = num - 1;
        activeTabSignal.value = newIndex;
        onChange?.(newIndex);
      }
      return true;
    }

    default:
      return false;
  }
}
