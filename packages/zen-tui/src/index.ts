/**
 * @zen/tui - Terminal UI renderer for Zen
 *
 * Build beautiful CLI applications with Zen.
 * Uses @zen/runtime components with terminal rendering.
 */

// Initialize platform operations for TUI
import { setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from './platform-ops.js';
setPlatformOps(tuiPlatformOps);

// Re-export runtime for convenience
export {
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
  // Components from runtime
  For,
  Show,
  Switch,
  Match,
  ErrorBoundary,
  Suspense,
  Dynamic,
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

export type { Signal, Computed, Owner, Context, Reactive, MaybeReactive } from '@zen/runtime';

// TUI-specific: Renderer
export { render, renderToTerminal, renderToTerminalReactive } from './render.js';
export { Fragment } from './jsx-runtime.js';

// TUI-specific: Components
export { Box } from './components/Box.js';
export { Text } from './components/Text.js';
export { Static } from './components/Static.js';
export { Newline } from './components/Newline.js';
export { Spacer } from './components/Spacer.js';

// TUI-specific: Types
export type { TUINode, TUIStyle, RenderOutput } from './types.js';
