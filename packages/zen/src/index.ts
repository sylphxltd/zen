/**
 * ZenJS - Ultra-fast, ultra-lightweight reactive framework
 *
 * Beyond SolidJS in performance and simplicity.
 * Powered by @zen/signal reactive core.
 */

// Import JSX types (global augmentation)
import './jsx-types.js';

// Re-export core primitives from @zen/signal
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
} from '@zen/signal';

// Components
export { For } from './components/For.js';
export { Show } from './components/Show.js';
export { Switch, Match } from './components/Switch.js';
export { Portal } from './components/Portal.js';
export { ErrorBoundary } from './components/ErrorBoundary.js';
export { Suspense } from './components/Suspense.js';
export { Dynamic } from './components/Dynamic.js';

// Context API
export { createContext, useContext } from './components/Context.js';
export type { Context } from './components/Context.js';

// JSX
export { render, Fragment } from './jsx-runtime.js';

// Lifecycle
export { onMount, onCleanup, createEffect, createRoot, disposeNode, getOwner } from './lifecycle.js';
export type { Owner } from './lifecycle.js';

// Utilities
export { lazy } from './lazy.js';
export { mergeProps, splitProps } from './utils/props.js';
export { selector } from './utils/selector.js';
export { runWithOwner } from './utils/runWithOwner.js';

// Types
export type { Signal, Computed } from '@zen/signal';
