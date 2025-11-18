/**
 * ZenJS - Ultra-fast, ultra-lightweight reactive framework
 *
 * Beyond SolidJS in performance and simplicity.
 * Powered by @zen/signal reactive core.
 */

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
export { Router, Link, navigate, currentRoute } from './components/Router.js';

// JSX
export { render, Fragment } from './jsx-runtime.js';

// Types
export type { Signal, ComputedZen as Computed } from '@zen/signal';
