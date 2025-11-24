/**
 * @zen/tui - Terminal UI renderer for Zen
 *
 * Build beautiful CLI applications with Zen.
 * Uses @zen/runtime components with terminal rendering.
 */

// Force chalk to always output colors BEFORE any imports
// This must be FIRST to ensure chalk initializes with colors enabled
process.env.FORCE_COLOR = '3';

// Initialize platform operations for TUI
import { setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from './core/platform-ops.js';
setPlatformOps(tuiPlatformOps);

// Force chalk color level (Bun workaround)
import chalk from 'chalk';
(chalk as any).level = 3;

// ============================================================================
// Re-export @zen/runtime for convenience
// ============================================================================
export {
  // Signals
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
  // Control Flow Components
  For,
  Show,
  Switch,
  Match,
  ErrorBoundary,
  Suspense,
  // Context
  createContext,
  useContext,
  // Utilities
  lazy,
  resolve,
  isSignal,
  mergeProps,
  splitProps,
  selector,
  runWithOwner,
  // Server utils
  isServer,
  createUniqueId,
} from '@zen/runtime';

// ============================================================================
// Core - Rendering infrastructure
// ============================================================================
// Legacy render APIs (deprecated - use renderApp instead)
export { render, renderToTerminal, renderToTerminalReactive } from './core/render.js';
export { renderToTerminalPersistent } from './core/persistent-renderer.js';
// New unified render API
export { renderApp } from './core/unified-render.js';
export { Fragment } from './core/jsx-runtime.js';
export type { TUINode, TUIStyle, RenderOutput, MouseClickEvent } from './core/types.js';

// ============================================================================
// Primitives - Basic building blocks
// ============================================================================
export { Box, type BoxProps } from './primitives/Box.js';
export { Text } from './primitives/Text.js';
export { Static } from './primitives/Static.js';
export { Newline } from './primitives/Newline.js';
export { Spacer } from './primitives/Spacer.js';

// ============================================================================
// Layout - Containers and structure
// ============================================================================
export { ScrollBox } from './layout/ScrollBox.js';
export { Scrollbar } from './layout/Scrollbar.js';
export { Divider } from './layout/Divider.js';
export { FullscreenLayout, type FullscreenLayoutProps } from './layout/FullscreenLayout.js';

// ============================================================================
// Providers - Capability providers
// ============================================================================
export {
  MouseProvider,
  type MouseProviderProps,
  type PressEvent,
  type DragEvent,
  type HoverEvent,
} from './providers/index.js';

// ============================================================================
// Interactive - Composable interaction behaviors
// ============================================================================
export { Pressable, type PressableProps } from './interactive/Pressable.js';
export { Draggable, type DraggableProps } from './interactive/Draggable.js';
export { Hoverable, type HoverableProps } from './interactive/Hoverable.js';

// ============================================================================
// Input - Forms and user input
// ============================================================================
export {
  TextInput,
  handleTextInput,
  type TextInputProps,
  type SuggestionProvider,
} from './input/TextInput.js';
export { SelectInput, handleSelectInput, type SelectOption } from './input/SelectInput.js';
export {
  MultiSelect,
  handleMultiSelectInput,
  type MultiSelectOption,
} from './input/MultiSelect.js';
export { Checkbox, handleCheckbox } from './input/Checkbox.js';
export { Radio, handleRadioInput, type RadioOption } from './input/Radio.js';
export { Button, handleButton } from './input/Button.js';
export { Confirmation } from './input/Confirmation.js';

// ============================================================================
// Feedback - User feedback and status
// ============================================================================
export {
  Spinner,
  updateSpinner,
  createAnimatedSpinner,
} from './feedback/Spinner.js';
export {
  ProgressBar,
  incrementProgress,
  setProgress,
  resetProgress,
} from './feedback/ProgressBar.js';
export { StatusMessage } from './feedback/StatusMessage.js';
export { Badge } from './feedback/Badge.js';
export {
  Toast,
  ToastContainer,
  toast,
  type ToastType,
  type ToastMessage,
  type ToastProps,
  type SingleToastProps,
} from './feedback/Toast.js';

// ============================================================================
// Data - Data display components
// ============================================================================
export { Table, type TableColumn } from './data/Table.js';
export { TreeView, type TreeNode, type TreeViewProps } from './data/TreeView.js';
export { Markdown, type MarkdownProps } from './data/Markdown.js';

// ============================================================================
// Overlay - Modals and floating UI
// ============================================================================
export {
  Modal,
  ConfirmDialog,
  AlertDialog,
  type ModalProps,
  type ModalButton,
  type ConfirmDialogProps,
  type AlertDialogProps,
} from './overlay/Modal.js';
export {
  CommandPalette,
  type Command,
  type CommandPaletteProps,
} from './overlay/CommandPalette.js';

// ============================================================================
// Navigation - Routing and navigation
// ============================================================================
export { Tabs, Tab, handleTabsInput, type TabProps, type TabsProps } from './navigation/Tabs.js';
export { Link } from './navigation/Link.js';
export { Router, type TUIRoute, type RouterProps } from './navigation/Router.js';
export { RouterLink, type RouterLinkProps } from './navigation/RouterLink.js';

// ============================================================================
// Chrome - Application frame
// ============================================================================
export {
  StatusBar,
  StatusBarItem,
  StatusBarMode,
  StatusBarShortcut,
  StatusBarSeparator,
  type StatusBarProps,
  type StatusBarItemProps,
  type StatusBarModeProps,
  type StatusBarShortcutProps,
} from './chrome/StatusBar.js';

// ============================================================================
// Hooks - React-like hooks
// ============================================================================
export { useInput, dispatchInput, type InputHandler, type Key } from './hooks/useInput.js';
export { useApp, type AppContext } from './hooks/useApp.js';
export {
  useMouse,
  useMouseClick,
  useMouseScroll,
  useMouseDrag,
  dispatchMouseEvent,
} from './hooks/useMouse.js';
export {
  useTerminalSize,
  useTerminalResize,
  getTerminalSize,
  type TerminalSize,
} from './hooks/useTerminalSize.js';

// ============================================================================
// Utils - Focus, hit testing, etc.
// ============================================================================
export {
  FocusProvider,
  useFocusManager,
  useFocus,
  type FocusManagerValue,
  type FocusableItem,
} from './utils/focus.js';
export {
  hitTest,
  hitTestAll,
  findClickableAncestor,
  type HitTestResult,
} from './utils/hit-test.js';
export type { MouseEvent } from './utils/mouse-parser.js';
export { terminalWidth } from './utils/terminal-width.js';

// ============================================================================
// Router primitives (re-export from @zen/router-core)
// ============================================================================
export {
  $router,
  defineRoutes,
  startHistoryListener,
  stopHistoryListener,
  open,
  back,
  forward,
  replace,
  type RouteConfig,
  type RouterState,
} from '@zen/router-core';
