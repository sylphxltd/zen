/**
 * @zen/runtime - Platform-agnostic runtime
 *
 * Components and utilities that work across all platforms (web, native, TUI).
 * No DOM dependencies - pure reactive primitives and control flow.
 */

// Re-export from @zen/signal for convenience
export {
  signal,
  computed,
  effect,
  rawEffect,
  batch,
  untrack,
  peek,
  subscribe,
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
} from '@zen/signal';
export type { Signal, Computed, Owner } from '@zen/signal';

// Components
export { For } from './components/For.js';
export { Show } from './components/Show.js';
export { Switch, Match } from './components/Switch.js';
export { ErrorBoundary } from './components/ErrorBoundary.js';
export { Suspense } from './components/Suspense.js';
export { Dynamic } from './components/Dynamic.js';

// Context API
export { createContext, useContext } from './components/Context.js';
export type { Context } from './components/Context.js';

// Utilities
export { lazy } from './lazy.js';
export { resolve, isSignal, executeComponent } from './reactive-utils.js';
export type { Reactive, MaybeReactive } from './reactive-utils.js';
export { mergeProps, splitProps } from './utils/props.js';
export { selector } from './utils/selector.js';
export { runWithOwner } from './utils/runWithOwner.js';

// Server utilities
export { isServer, createUniqueId, setServerIdPrefix, resetIdCounter } from './server-utils.js';

// Platform operations
export { setPlatformOps, getPlatformOps, hasPlatformOps } from './platform-ops.js';
export type { PlatformOps } from './platform-ops.js';
