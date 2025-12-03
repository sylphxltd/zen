/**
 * Vue adapter for Rapid Router
 *
 * @example
 * ```tsx
 * import { useRouter, useParams } from '@rapid/router-vue';
 *
 * export default {
 *   setup() {
 *     const params = useParams();
 *     return { params };
 *   }
 * }
 * ```
 */

import { $router, type Params, type RouterState, type Search, open } from '@rapid/router-core';
import { subscribe } from '@rapid/signal-core';
import { onUnmounted, ref } from 'vue';

/**
 * Vue composable for router state
 */
export function useRouter(): RouterState {
  const state = ref<RouterState>($router.value);

  const unsubscribe = subscribe($router, (newState: RouterState) => {
    state.value = newState;
  });

  // Vue automatically handles cleanup with onUnmounted
  onUnmounted(unsubscribe);

  return state.value;
}

/**
 * Vue composable for route params
 */
export function useParams(): Params {
  const router = useRouter();
  return router.params;
}

/**
 * Vue composable for search params
 */
export function useSearchParams(): Search {
  const router = useRouter();
  return router.search;
}

/**
 * Navigate function
 */
export function useNavigate() {
  return open;
}

// Re-export types
export type { RouterState, Params, Search } from '@rapid/router-core';
