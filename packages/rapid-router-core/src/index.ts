// Entry point for @rapid/router-core

// TODO: Implement router logic inspired by @nanostores/router
// Goals: Tiny size, high performance, FP principles

import { map } from '@rapid/signal-extensions/patterns';
import type { MapStore } from '@rapid/signal-extensions/patterns';

/** Route type placeholder (extend as needed) */
export type Route = string;
/** Params type placeholder (mapping of route params) */
export type Params<
  P extends Record<string, string | undefined> = Record<string, string | undefined>,
> = P;
/** Search type placeholder (mapping of query params) */
export type Search<
  S extends Record<string, string | undefined> = Record<string, string | undefined>,
> = S;

/** Represents the state of the router */
export interface RouterState {
  path: string;
  params: Params;
  search: Search;
}

// --- Public API ---

// Store
export const $router: MapStore<RouterState> = map({
  path: '',
  params: {},
  search: {},
});
// Functions
export { defineRoutes } from './routes';
export {
  open,
  redirect,
  replace,
  back,
  forward,
  startHistoryListener,
  stopHistoryListener,
} from './history';
export { matchRoutes, pathToRegexp } from './matcher';

// Types
export type { RouteConfig, RouteMatch } from './matcher';
