/**
 * ZenJS ErrorBoundary Component
 *
 * Catch and handle errors in component tree
 *
 * Features:
 * - Catch render errors
 * - Display fallback UI
 * - Error recovery
 */

import { signal } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';

interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => Node;
  children: Node | (() => Node);
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
export function ErrorBoundary(props: ErrorBoundaryProps): Node {
  const { fallback, children } = props;

  const error = signal<Error | null>(null);
  const container = document.createElement('div');
  let currentChild: Node | null = null;

  const reset = () => {
    error.value = null;
    render();
  };

  const render = () => {
    try {
      // Dispose previous child
      if (currentChild) {
        if (container.contains(currentChild)) {
          container.removeChild(currentChild);
        }
        disposeNode(currentChild);
        currentChild = null;
      }

      if (error.value) {
        // Show fallback
        currentChild = fallback(error.value, reset);
        container.appendChild(currentChild);
      } else {
        // Show children
        currentChild = typeof children === 'function' ? children() : children;
        container.appendChild(currentChild);
      }
    } catch (err) {
      error.value = err as Error;
      // Retry render with error state
      if (currentChild) {
        if (container.contains(currentChild)) {
          container.removeChild(currentChild);
        }
        disposeNode(currentChild);
        currentChild = null;
      }
      currentChild = fallback(err as Error, reset);
      container.appendChild(currentChild);
    }
  };

  // Initial render
  render();

  // Global error handler (optional - catches async errors)
  const errorHandler = (event: ErrorEvent) => {
    if (container.contains(event.target as Node)) {
      event.preventDefault();
      error.value = event.error;
      render();
    }
  };

  window.addEventListener('error', errorHandler);

  // Register cleanup via owner system
  onCleanup(() => {
    window.removeEventListener('error', errorHandler);
    if (currentChild) {
      if (container.contains(currentChild)) {
        container.removeChild(currentChild);
      }
      disposeNode(currentChild);
    }
  });

  return container;
}
