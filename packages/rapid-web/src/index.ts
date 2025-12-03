/**
 * @rapid/web - Web renderer for Rapid
 *
 * DOM-specific operations, JSX runtime, SSR, and hydration.
 * Depends on @rapid/runtime for platform-agnostic components.
 */

// Initialize platform operations for web
import { setPlatformOps } from '@rapid/runtime';
import { webPlatformOps } from './platform-ops.js';
setPlatformOps(webPlatformOps);

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
  // Descriptor pattern (ADR-011)
  isDescriptor,
  executeDescriptor,
  // Server utils
  isServer,
  createUniqueId,
  setServerIdPrefix,
  resetIdCounter,
} from '@rapid/runtime';

export type { Signal, Computed, Owner, Context, Reactive, MaybeReactive } from '@rapid/runtime';

// Web-specific: JSX runtime
export { render, Fragment } from './jsx-runtime.js';

// Web-specific: Hydration
export { hydrate } from './hydrate.js';

// Web-specific: SSR
export { renderToString } from './server.js';

// Web-specific: Portal component
export { Portal } from './components/Portal.js';
