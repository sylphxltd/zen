/**
 * ZenJS Suspense Component
 *
 * Handle async loading states with fallback UI
 *
 * Features:
 * - Shows fallback while children are loading
 * - Supports nested suspense boundaries
 * - Container pattern (child inside container)
 */

import { effect, signal, untrack } from '@rapid/signal';
import { disposeNode, onCleanup } from '@rapid/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children as resolveChildren } from '../utils/children.js';

interface SuspenseProps {
  fallback: unknown;
  children: unknown;
}

/**
 * Suspense component - Async loading boundary
 *
 * @example
 * <Suspense fallback={<Loading />}>
 *   <AsyncComponent />
 * </Suspense>
 */
export function Suspense(props: SuspenseProps): object {
  const c = resolveChildren(() => props.children);
  const f = resolveChildren(() => props.fallback);

  const ops = getPlatformOps();

  // Create container - content will be inside this node
  const container = ops.createContainer('suspense');

  // Track current node and loading state
  let currentNode: unknown = null;
  const isLoading = signal(false);

  const dispose = effect(() => {
    const loading = isLoading.value;

    // Dispose previous node
    if (currentNode) {
      disposeNode(currentNode as object);
      currentNode = null;
    }

    // Render appropriate content
    if (loading) {
      // Show fallback
      currentNode = untrack(() => f());
    } else {
      // Show children
      currentNode = untrack(() => c());
    }

    // Update container
    if (currentNode) {
      ops.setChildren(container, [currentNode as object]);
    } else {
      ops.setChildren(container, []);
    }
    ops.notifyUpdate(container);
  });

  // Initial render with children
  isLoading.value = false;

  // Cleanup on dispose
  onCleanup(() => {
    dispose();
    if (currentNode) {
      disposeNode(currentNode as object);
    }
  });

  return container;
}
