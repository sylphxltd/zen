/**
 * Router component for TUI
 * Powered by @zen/router-core
 */

import {
  $router,
  defineRoutes,
  open,
  startHistoryListener,
  stopHistoryListener,
} from '@zen/router-core';
import type { RouteConfig } from '@zen/router-core';
import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { computed, disposeNode, onCleanup, onMount } from '@zen/signal';
import { appendChild } from '../jsx-runtime.js';
import type { TUINode } from '../types.js';

export interface TUIRoute {
  path: string;
  component: () => unknown; // May return TUINode or ComponentDescriptor
}

export interface RouterProps {
  routes: TUIRoute[];
  fallback?: () => unknown; // May return TUINode or ComponentDescriptor
}

/**
 * Router component - Client-side routing for TUI powered by @zen/router-core
 *
 * Fine-grained reactivity with component caching by path.
 *
 * @example
 * ```tsx
 * <Router routes={[
 *   { path: '/', component: () => <Home /> },
 *   { path: '/users/:id', component: () => <UserProfile /> },
 *   { path: '/about', component: () => <About /> },
 * ]} fallback={() => <NotFound />} />
 * ```
 */
export function Router(props: RouterProps): TUINode {
  const { routes, fallback } = props;

  // Cache rendered components by path for fine-grained reactivity
  const componentCache = new Map<string, TUINode>();

  // Helper to check if value is a TUINode
  function isTUINode(value: unknown): value is TUINode {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      'props' in value &&
      'children' in value
    );
  }

  // Helper to find and render matching route (with caching)
  function renderRoute(path: string): TUINode {
    // Treat empty path as "/" (TUI has no browser URL, starts empty)
    const normalizedPath = path || '/';

    // Check cache first - returns same TUINode instance for same path
    const cached = componentCache.get(normalizedPath);
    if (cached) {
      return cached;
    }

    const route = routes.find((r) => r.path === normalizedPath);

    let result: unknown;
    if (route) {
      result = route.component();
    } else if (fallback) {
      result = fallback();
    } else {
      // Default 404 fallback - create manual Text node
      result = {
        type: 'text',
        tagName: 'text',
        props: {},
        children: ['404 Not Found'],
        style: {},
      } as TUINode;
    }

    // Handle descriptor (Phase 2)
    if (isDescriptor(result)) {
      result = executeDescriptor(result);
    }

    // Ensure we have a TUINode
    if (!isTUINode(result)) {
      // Convert string or other primitives to Text node
      result = {
        type: 'text',
        tagName: 'text',
        props: {},
        children: [String(result)],
        style: {},
      } as TUINode;
    }

    const node = result as TUINode;

    // Cache the rendered component
    componentCache.set(normalizedPath, node);

    return node;
  }

  // Create computed signal for current route component
  const currentComponent = computed(() => {
    const { path } = $router.value;
    return renderRoute(path);
  });

  // Initialize router
  onMount(() => {
    // Convert TUIRoute to RouteConfig
    const routeConfigs: RouteConfig[] = routes.map((r) => ({
      path: r.path,
      component: r.component,
    }));

    defineRoutes(routeConfigs);
    startHistoryListener();

    // Initialize to root path if no path is set (TUI has no browser URL)
    if (!$router.value.path) {
      open('/');
    }

    // Cleanup on unmount
    onCleanup(() => {
      stopHistoryListener();

      // Dispose all cached components
      for (const [_path, node] of componentCache) {
        disposeNode(node);
      }
      componentCache.clear();
    });

    return undefined;
  });

  // Return Box container with computed component (use function for reactivity)
  const container: TUINode = {
    type: 'box',
    tagName: 'router-container',
    props: {},
    children: [],
    style: {
      flex: 1,
      flexDirection: 'column',
    },
  };

  // Add current component as child (using function for reactivity)
  appendChild(container, () => currentComponent.value);

  return container;
}
