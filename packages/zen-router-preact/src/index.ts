import { subscribe } from '@zen/signal';
import { $router, type RouterState } from '@zen/zen-router';
import { useEffect, useState } from 'preact/hooks'; // Import hooks from preact

/**
 * Preact hook to subscribe to the router state.
 *
 * Returns the current router state object ({ path, params, search }).
 * The component will re-render when the router state changes.
 *
 * @returns The current router state.
 */
export function useRouter(): RouterState {
  // Get the initial state synchronously
  const [state, setState] = useState<RouterState>($router.value);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = subscribe($router, (newState: RouterState) => {
      // Update state on change
      setState(newState);
    });

    // Initial sync check after mount, in case state changed between initial .value read and subscribe()
    const currentState = $router.value;
    if (currentState !== state) {
      setState(currentState);
    }

    // Unsubscribe on component unmount
    return unsubscribe;
    // biome-ignore lint/correctness/useExhaustiveDependencies: $router is stable, state comparison intentional
  }, []);

  return state;
}

// Re-export core types for convenience
export type { RouterState, Params, Search } from '@zen/zen-router';
