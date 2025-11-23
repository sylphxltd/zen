/**
 * Tabs component for TUI
 *
 * Tab navigation with keyboard shortcuts.
 * Matches Ink tabs behavior.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface TabProps {
  name: string;
  children: TUINode | (() => TUINode);
}

export interface TabsProps {
  children: TabProps[] | TUINode[]; // Array of Tab components
  activeTab?: Signal<number> | number;
  onChange?: (index: number) => void;
  id?: string;
  style?: any;
}

/**
 * Tab component - wrapper for tab content
 */
export function Tab(props: TabProps): TUINode {
  // Tab is just a data container, rendering handled by Tabs
  return props.children as TUINode;
}

/**
 * Tabs component - tabbed navigation
 */
export function Tabs(props: TabsProps): TUINode {
  const id = props.id || `tabs-${Math.random().toString(36).slice(2, 9)}`;

  // Active tab index
  const activeTabSignal =
    typeof props.activeTab === 'object' && 'value' in props.activeTab
      ? (props.activeTab as Signal<number>)
      : signal(typeof props.activeTab === 'number' ? props.activeTab : 0);

  // Focus management
  const { isFocused } = useFocus({ id });

  // Extract tab data from children
  const tabs = Array.isArray(props.children) ? props.children : [props.children];
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
      const activeContent = activeTab
        ? typeof activeTab.children === 'function'
          ? activeTab.children()
          : activeTab.children
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
