/**
 * Suspense - Loading boundary for async components
 *
 * Shows fallback UI while lazy components are loading.
 * Works with lazy() for code splitting.
 *
 * @example
 * ```tsx
 * const Heavy = lazy(() => import('./Heavy'));
 *
 * <Suspense fallback={<div>Loading...</div>}>
 *   <Heavy />
 *   <AnotherLazy />
 * </Suspense>
 * ```
 */

import { effect, signal } from '@zen/signal';
import { onCleanup } from '@zen/signal';

interface SuspenseProps {
  fallback: Node | string;
  children: Node | Node[];
}

/**
 * Check if a node is a lazy loading placeholder
 */
function isLazyLoading(node: Node): boolean {
  return node.nodeType === Node.COMMENT_NODE && (node as any)._zenLazyLoading === true;
}

/**
 * Check if node tree contains any loading placeholders
 */
function hasLoadingChildren(node: Node): boolean {
  // Check if this node itself is loading
  if (isLazyLoading(node)) {
    return true;
  }

  // Check child nodes recursively
  if (node.hasChildNodes()) {
    for (const child of Array.from(node.childNodes)) {
      if (hasLoadingChildren(child)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Suspense component
 */
export function Suspense(props: SuspenseProps): Node {
  const { fallback, children } = props;
  const container = document.createDocumentFragment();
  const isLoading = signal(false);
  const marker = document.createComment('suspense');

  // Append children
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (child instanceof Node) {
      container.appendChild(child);
    } else if (typeof child === 'string') {
      container.appendChild(document.createTextNode(child));
    }
  }

  // Create container to hold either fallback or children
  const wrapper = document.createElement('div');
  wrapper.style.display = 'contents'; // Don't affect layout

  const currentContent: Node = container;

  // Function to check and update loading state
  const checkLoading = () => {
    const loading = hasLoadingChildren(wrapper);

    if (loading !== isLoading.value) {
      isLoading.value = loading;

      // Replace content
      while (wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild);
      }

      if (loading) {
        // Show fallback
        if (fallback instanceof Node) {
          wrapper.appendChild(fallback);
        } else {
          wrapper.appendChild(document.createTextNode(String(fallback)));
        }
      } else {
        // Show children
        wrapper.appendChild(currentContent);
      }
    }
  };

  // Initial check
  wrapper.appendChild(currentContent);
  checkLoading();

  // Poll for loading state changes
  // (Lazy components update their loading state asynchronously)
  const intervalId = setInterval(checkLoading, 16); // ~60fps

  onCleanup(() => {
    clearInterval(intervalId);
  });

  return wrapper;
}
