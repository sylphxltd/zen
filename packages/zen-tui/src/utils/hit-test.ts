/**
 * Hit Testing Module
 *
 * Maps screen coordinates to TUI elements using Yoga layout data.
 * Enables mouse interaction with specific components.
 */

import type { TUINode } from '../core/types.js';
import type { LayoutMap, LayoutResult } from '../core/yoga-layout.js';

/**
 * Hit test result - the element at a given position
 */
export interface HitTestResult {
  /** The node that was hit */
  node: TUINode;
  /** Layout bounds of the node */
  layout: LayoutResult;
  /** Relative coordinates within the node (0-based) */
  localX: number;
  localY: number;
}

/**
 * Global layout map reference (updated by renderer)
 * Used for hit testing mouse events
 */
let currentLayoutMap: LayoutMap | null = null;
let currentRootNode: TUINode | null = null;

/**
 * Set the current layout map for hit testing
 * Called by the renderer after computing layout
 */
export function setHitTestLayout(layoutMap: LayoutMap, rootNode: TUINode): void {
  currentLayoutMap = layoutMap;
  currentRootNode = rootNode;
}

/**
 * Clear hit test layout
 * Called on cleanup
 */
export function clearHitTestLayout(): void {
  currentLayoutMap = null;
  currentRootNode = null;
}

/**
 * Check if a point is within a bounding box
 */
function pointInRect(x: number, y: number, rect: LayoutResult): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

/**
 * Find the deepest element at the given coordinates
 * Traverses the tree in depth-first order, returning the most nested hit
 */
function findElementAtPoint(
  node: TUINode,
  x: number,
  y: number,
  layoutMap: LayoutMap,
): HitTestResult | null {
  const layout = layoutMap.get(node);
  if (!layout) return null;

  // Check if point is within this node
  if (!pointInRect(x, y, layout)) {
    return null;
  }

  // Check children (deepest match wins)
  if (node.children) {
    // Iterate in reverse to find topmost (last rendered) element first
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];

      // Skip string children
      if (typeof child === 'string') continue;

      // Handle TUINode children
      if (typeof child === 'object' && child !== null && 'type' in child) {
        const childNode = child as TUINode;

        // Handle fragment nodes - check their children
        if (childNode.type === 'fragment') {
          for (let j = childNode.children.length - 1; j >= 0; j--) {
            const fragmentChild = childNode.children[j];
            if (
              typeof fragmentChild === 'object' &&
              fragmentChild !== null &&
              'type' in fragmentChild
            ) {
              const hit = findElementAtPoint(fragmentChild as TUINode, x, y, layoutMap);
              if (hit) return hit;
            }
          }
        } else {
          const hit = findElementAtPoint(childNode, x, y, layoutMap);
          if (hit) return hit;
        }
      }
    }
  }

  // No child was hit, return this node
  return {
    node,
    layout,
    localX: x - layout.x,
    localY: y - layout.y,
  };
}

/**
 * Perform hit test at the given screen coordinates
 *
 * @param x Screen column (1-indexed from mouse event)
 * @param y Screen row (1-indexed from mouse event)
 * @returns The hit test result, or null if nothing was hit
 *
 * @example
 * ```tsx
 * useMouse((event) => {
 *   const hit = hitTest(event.x, event.y);
 *   if (hit && hit.node.props?.onClick) {
 *     hit.node.props.onClick();
 *   }
 * });
 * ```
 */
export function hitTest(x: number, y: number): HitTestResult | null {
  if (!currentLayoutMap || !currentRootNode) {
    return null;
  }

  // Convert 1-indexed mouse coordinates to 0-indexed layout coordinates
  const layoutX = x - 1;
  const layoutY = y - 1;

  return findElementAtPoint(currentRootNode, layoutX, layoutY, currentLayoutMap);
}

/**
 * Find all elements at the given coordinates (not just the deepest)
 * Returns elements from root to leaf order
 */
export function hitTestAll(x: number, y: number): HitTestResult[] {
  if (!currentLayoutMap || !currentRootNode) {
    return [];
  }

  const layoutX = x - 1;
  const layoutY = y - 1;
  const results: HitTestResult[] = [];

  function collectHits(node: TUINode): void {
    const layout = currentLayoutMap?.get(node);
    if (!layout) return;
    if (!pointInRect(layoutX, layoutY, layout)) return;

    results.push({
      node,
      layout,
      localX: layoutX - layout.x,
      localY: layoutY - layout.y,
    });

    // Check children
    if (node.children) {
      for (const child of node.children) {
        if (typeof child === 'object' && child !== null && 'type' in child) {
          const childNode = child as TUINode;
          if (childNode.type === 'fragment') {
            for (const fragmentChild of childNode.children) {
              if (
                typeof fragmentChild === 'object' &&
                fragmentChild !== null &&
                'type' in fragmentChild
              ) {
                collectHits(fragmentChild as TUINode);
              }
            }
          } else {
            collectHits(childNode);
          }
        }
      }
    }
  }

  collectHits(currentRootNode);
  return results;
}

/**
 * Check if a node or any of its ancestors has an onClick handler
 * Walks up the tree to find the nearest clickable element
 */
export function findClickableAncestor(result: HitTestResult | null): TUINode | null {
  if (!result || !currentLayoutMap) {
    return null;
  }

  // Check if current node has onClick
  if (result.node.props?.onClick) {
    return result.node;
  }

  // For now, just return null if the hit node doesn't have onClick
  // Future: could traverse up parent chain if we track parents
  return null;
}
