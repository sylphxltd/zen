/**
 * @zen/web - Web renderer for Zen
 *
 * DOM-specific operations, JSX runtime, SSR, and hydration.
 * Depends on @zen/runtime for platform-agnostic components.
 */

// Import JSX types (global augmentation)
import './jsx-types.js';

// Re-export runtime for convenience
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
  // Components
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
  setServerIdPrefix,
  resetIdCounter,
} from '@zen/runtime';

export type { Signal, Computed, Owner, Context, Reactive, MaybeReactive } from '@zen/runtime';

// Web-specific: JSX runtime
export { render, Fragment } from './jsx-runtime.js';

// Web-specific: Hydration
export { hydrate } from './hydrate.js';

// Web-specific: SSR
export { renderToString } from './server.js';

// Web-specific: Portal component
export { Portal } from './components/Portal.js';
