/**
 * lazy - Code splitting utility
 *
 * Dynamically import components for code splitting.
 * Works with Suspense to show fallback during loading.
 *
 * @example
 * ```tsx
 * const Heavy = lazy(() => import('./HeavyComponent'));
 *
 * <Suspense fallback={<Loading />}>
 *   <Heavy />
 * </Suspense>
 * ```
 */

import { computedAsync } from '@zen/signal-extensions/patterns';

type Component<P = any> = (props: P) => Node;
type ComponentModule<P = any> = { default: Component<P> };

/**
 * Lazy load a component
 */
export function lazy<P = any>(loader: () => Promise<ComponentModule<P>>): Component<P> {
  // Use computedAsync for state management
  const module = computedAsync(loader);

  // Return a component that renders the loaded module
  return (props: P) => {
    const state = module.value;

    // If still loading, return placeholder comment
    // Suspense will handle showing fallback
    if (state.loading) {
      const comment = document.createComment('lazy-loading');
      // Attach loading state for Suspense to detect
      (comment as any)._zenLazyLoading = true;
      return comment;
    }

    // If error, throw for ErrorBoundary
    if (state.error) {
      throw state.error;
    }

    // Render loaded component
    if (!state.data) {
      throw new Error('Lazy component failed to load');
    }

    return state.data.default(props);
  };
}
