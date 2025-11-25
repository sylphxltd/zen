/**
 * @zen/tui-advanced - Advanced components for professional TUI applications
 *
 * Provides window management, split panes, text editors, charts, and more
 * for building full-screen terminal applications.
 *
 * Requires @zen/tui as peer dependency.
 */

// Re-export core dependencies for convenience
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  For,
  Show,
  Switch,
  Match,
} from '@zen/tui';

// ============================================================================
// Window Management - Multi-window desktop environment
// ============================================================================
export { Window, type WindowProps } from './window/Window.js';
export {
  // State
  $windows,
  $focusedWindowId,
  $sortedWindows,
  $focusedWindow,
  $taskbarItems,
  // Actions
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  toggleMaximize,
  moveWindow,
  resizeWindow,
  // Types
  type WindowState,
} from './window/WindowManager.js';

// ============================================================================
// Layout - Advanced layout components
// ============================================================================
export { List, type ListProps } from './layout/List.js';
export { Splitter, type SplitterProps, Pane, type PaneProps } from './layout/Splitter.js';

// ============================================================================
// Input - Advanced input components
// ============================================================================
export { TextArea, type TextAreaProps } from './input/TextArea.js';

// ============================================================================
// Navigation - Menu and navigation
// ============================================================================
// export { MenuBar, type MenuBarProps } from './navigation/MenuBar.js';
// export { Menu, type MenuProps } from './navigation/Menu.js';
// export { MenuItem, type MenuItemProps } from './navigation/MenuItem.js';
// export { ContextMenu, type ContextMenuProps } from './navigation/ContextMenu.js';

// ============================================================================
// Chart - Data visualization
// ============================================================================
// export { Chart, type ChartProps } from './chart/Chart.js';
// export { LineChart, type LineChartProps } from './chart/LineChart.js';
// export { BarChart, type BarChartProps } from './chart/BarChart.js';
// export { SparkLine, type SparkLineProps } from './chart/SparkLine.js';

// ============================================================================
// Re-export from @zen/tui for advanced features
// ============================================================================
export {
  // Layout
  FullscreenLayout,
  ScrollBox,
  Scrollbar,
  // Navigation
  Tabs,
  Tab,
  Router,
  RouterLink,
  Link,
  // Data
  TreeView,
  Markdown,
  Table,
  // Overlay
  CommandPalette,
  // Chrome
  StatusBar,
  StatusBarItem,
  StatusBarMode,
  StatusBarShortcut,
  // Interactive
  Pressable,
  Draggable,
  Hoverable,
  // Providers
  MouseProvider,
  // Hooks
  useMouse,
  useMouseClick,
  useMouseDrag,
  useTerminalSize,
  useTerminalResize,
} from '@zen/tui';
