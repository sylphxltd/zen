/**
 * @rapid/router
 *
 * Rapid framework router with Router and Link components
 * Built on @rapid/router-core reactive primitives
 */

// Re-export core router primitives
export {
  $router,
  defineRoutes,
  startHistoryListener,
  stopHistoryListener,
  open,
  back,
  forward,
  replace,
} from '@rapid/router-core';

export type { RouteConfig, RouterState, RouteParams } from '@rapid/router-core';

// Export Rapid framework components
export { Router } from './Router.js';
export type { ZenRoute } from './Router.js';

export { Link } from './Link.js';
export type { LinkProps } from './Link.js';
