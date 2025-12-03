/** @jsxImportSource @rapid/web */
/**
 * Router component for Rapid framework
 * Powered by @rapid/router-core
 */

import {
  $router,
  defineRoutes,
  startHistoryListener,
  stopHistoryListener,
} from '@rapid/router-core';
import type { RouteConfig } from '@rapid/router-core';
import { executeDescriptor, isDescriptor } from '@rapid/runtime';
import { computed, disposeNode, effect, onCleanup, onMount } from '@rapid/signal';

export interface ZenRoute {
  path: string;
  component: () => unknown; // May return Node or ComponentDescriptor
}

interface RouterProps {
  routes: ZenRoute[];
  fallback?: () => unknown; // May return Node or ComponentDescriptor
}

/**
 * Router component - Client-side routing powered by @rapid/router-core
 *
 * Fine-grained reactivity with component caching by path.
 * JSX runtime handles updates via reference equality check.
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
export function Router(props: RouterProps): Node {
  const { routes, fallback } = props;

  // Cache rendered components by path for fine-grained reactivity
  const componentCache = new Map<string, Node>();
  const disposalMap = new Map<string, () => void>();

  // Helper to find and render matching route (with caching)
  function renderRoute(path: string): Node {
    // Check cache first - returns same Node instance for same path
    const cached = componentCache.get(path);
    if (cached) {
      return cached;
    }

    const route = routes.find((r) => r.path === path);

    let result: unknown;
    if (route) {
      result = route.component();
    } else if (fallback) {
      result = fallback();
    } else {
      result = document.createTextNode('404 Not Found');
    }

    // Handle descriptor (Phase 2)
    if (isDescriptor(result)) {
      result = executeDescriptor(result);
    }

    // Ensure we have a Node
    if (!(result instanceof Node)) {
      result = document.createTextNode(String(result));
    }

    const node = result as Node;

    // Cache the rendered component
    componentCache.set(path, node);

    return node;
  }

  // Create computed signal for current route component
  const currentComponent = computed(() => {
    const { path } = $router.value;
    return renderRoute(path);
  });

  // Scroll to top on route change
  effect(() => {
    // Track path changes
    const _path = $router.value.path;
    // Scroll to top
    window.scrollTo(0, 0);
  });

  // Initialize router
  onMount(() => {
    // Convert ZenRoute to RouteConfig
    const routeConfigs: RouteConfig[] = routes.map((r) => ({
      path: r.path,
      component: r.component,
    }));

    defineRoutes(routeConfigs);
    startHistoryListener();

    // Cleanup on unmount
    onCleanup(() => {
      stopHistoryListener();

      // Dispose all cached components
      for (const [path, node] of componentCache) {
        disposeNode(node);
      }
      componentCache.clear();
      disposalMap.clear();
    });

    return undefined;
  });

  // Return JSX with computed component (use function for reactivity)
  // jsx-runtime now does reference equality check - same Node = no update
  return <div class="rapid-router-container">{() => currentComponent.value}</div>;
}
