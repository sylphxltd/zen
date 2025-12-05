/**
 * Core factory for creating framework-specific router hooks
 *
 * This factory eliminates code duplication across React-like frameworks
 * by abstracting the common subscription pattern.
 */

import { $router, type RouterState, open } from '@rapid/router-core';
import { subscribe } from '@rapid/signal-core';

/**
 * Hooks interface that all React-like frameworks must implement
 */
export interface ReactiveHooks {
  useState: <T>(initialState: T) => [T, (newState: T) => void];
  useEffect: (effect: () => undefined | (() => void), deps?: any[]) => void;
}

/**
 * Creates a useRouter hook for any framework with useState/useEffect
 *
 * @param hooks - Framework-specific hooks (useState, useEffect)
 * @returns useRouter hook function
 *
 * @example
 * ```typescript
 * import { useState, useEffect } from 'react';
 * import { createUseRouter } from '@rapid/router-adapters/core';
 *
 * export const useRouter = createUseRouter({ useState, useEffect });
 * ```
 */
export function createUseRouter(hooks: ReactiveHooks) {
  return function useRouter(): RouterState {
    const [state, setState] = hooks.useState<RouterState>($router.value);

    hooks.useEffect(() => {
      // Subscribe to router changes (subscribe to underlying _state signal)
      const unsubscribe = subscribe($router._state, (newState: RouterState) => {
        setState(newState);
      });

      // Sync check after mount (in case state changed between initial read and subscribe)
      const currentState = $router.value;
      if (currentState !== state) {
        setState(currentState);
      }

      // Cleanup on unmount
      return unsubscribe;
    }, []); // Empty deps - only subscribe once on mount

    return state;
  };
}

/**
 * Creates useParams hook
 */
export function createUseParams(hooks: ReactiveHooks) {
  const useRouter = createUseRouter(hooks);

  return function useParams() {
    const router = useRouter();
    return router.params;
  };
}

/**
 * Creates useSearchParams hook
 */
export function createUseSearchParams(hooks: ReactiveHooks) {
  const useRouter = createUseRouter(hooks);

  return function useSearchParams() {
    const router = useRouter();
    return router.search;
  };
}

/**
 * Creates useNavigate hook (framework-agnostic)
 */
export function createUseNavigate() {
  // Import statically - bundlers will tree-shake if not used
  return function useNavigate() {
    // Re-export from router-core
    return open;
  };
}
