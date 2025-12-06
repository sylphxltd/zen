/**
 * ZenJS ErrorBoundary Component
 *
 * Catch and handle errors in component tree
 *
 * Features:
 * - Catch render errors
 * - Display fallback UI
 * - Error recovery
 * - Container pattern (child inside container)
 */

import { effect, signal, untrack } from '@rapid/signal';
import { disposeNode, onCleanup } from '@rapid/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children as resolveChildren } from '../utils/children.js';

interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => unknown;
  children: unknown;
}

/**
 * ErrorBoundary component - Catch errors in component tree
 *
 * @example
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <h1>Error: {error.message}</h1>
 *     <button onClick={reset}>Retry</button>
 *   </div>
 * )}>
 *   <App />
 * </ErrorBoundary>
 */
export function ErrorBoundary(props: ErrorBoundaryProps): object {
  const c = resolveChildren(() => props.children);

  const ops = getPlatformOps();

  // Create container - content will be inside this node
  const container = ops.createContainer('error-boundary');

  // Track current node and error state
  let currentNode: unknown = null;
  const error = signal<Error | null>(null);

  const reset = () => {
    error.value = null;
  };

  const dispose = effect(() => {
    const err = error.value;

    // Dispose previous node
    if (currentNode) {
      disposeNode(currentNode as object);
      currentNode = null;
    }

    // Render appropriate content
    try {
      if (err) {
        // Show error fallback
        currentNode = untrack(() => props.fallback(err, reset));
      } else {
        // Show children
        currentNode = untrack(() => c());
      }
    } catch (renderError) {
      // Caught error during render
      error.value = renderError as Error;
      // Retry render with error state
      currentNode = untrack(() => props.fallback(renderError as Error, reset));
    }

    // Update container
    if (currentNode) {
      ops.setChildren(container, [currentNode as object]);
    } else {
      ops.setChildren(container, []);
    }
    ops.notifyUpdate(container);
  });

  // Cleanup on dispose
  onCleanup(() => {
    dispose();
    if (currentNode) {
      disposeNode(currentNode as object);
    }
  });

  return container;
}
