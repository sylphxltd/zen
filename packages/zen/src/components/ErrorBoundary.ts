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

  const reset = () => {
    error.value = null;
    render();
  };

  const render = () => {
    try {
      // Clear container
      container.innerHTML = '';

      if (error.value) {
        // Show fallback
        const fallbackNode = fallback(error.value, reset);
        container.appendChild(fallbackNode);
      } else {
        // Show children
        const childNode = typeof children === 'function' ? children() : children;
        container.appendChild(childNode);
      }
    } catch (err) {
      error.value = err as Error;
      // Retry render with error state
      const fallbackNode = fallback(err as Error, reset);
      container.innerHTML = '';
      container.appendChild(fallbackNode);
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

  // Cleanup
  (container as any)._dispose = () => {
    window.removeEventListener('error', errorHandler);
  };

  return container;
}
