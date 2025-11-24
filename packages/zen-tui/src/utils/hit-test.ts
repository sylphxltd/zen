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
 * Get zIndex value from a node's style
 */
function getZIndex(node: TUINode): number {
  const style = typeof node.style === 'function' ? node.style() : node.style;
  if (!style) return 0;
  const zIndex = typeof style.zIndex === 'function' ? style.zIndex() : style.zIndex;
  return typeof zIndex === 'number' ? zIndex : 0;
}

/**
 * Check if a node is absolute positioned
 */
function isAbsolutePositioned(node: TUINode): boolean {
  const style = typeof node.style === 'function' ? node.style() : node.style;
  if (!style) return false;
  const position = typeof style.position === 'function' ? style.position() : style.position;
  return position === 'absolute';
}

/**
 * Find the deepest element at the given coordinates
 * Traverses the tree respecting zIndex for absolute positioned elements
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

  // Check children - need to handle absolute positioned elements specially
  if (node.children) {
    // Separate absolute and normal flow children that contain the point
    const absoluteHits: Array<{ node: TUINode; zIndex: number }> = [];
    const normalHits: TUINode[] = [];

    for (const child of node.children) {
      if (typeof child === 'string') continue;
      if (typeof child !== 'object' || child === null || !('type' in child)) continue;

      const childNode = child as TUINode;

      // Handle fragment nodes
      if (childNode.type === 'fragment') {
        for (const fragmentChild of childNode.children) {
          if (
            typeof fragmentChild === 'object' &&
            fragmentChild !== null &&
            'type' in fragmentChild
          ) {
            const fc = fragmentChild as TUINode;
            const fcLayout = layoutMap.get(fc);
            if (fcLayout && pointInRect(x, y, fcLayout)) {
              if (isAbsolutePositioned(fc)) {
                absoluteHits.push({ node: fc, zIndex: getZIndex(fc) });
              } else {
                normalHits.push(fc);
              }
            }
          }
        }
      } else {
        const childLayout = layoutMap.get(childNode);
        if (childLayout && pointInRect(x, y, childLayout)) {
          if (isAbsolutePositioned(childNode)) {
            absoluteHits.push({ node: childNode, zIndex: getZIndex(childNode) });
          } else {
            normalHits.push(childNode);
          }
        }
      }
    }

    // Sort absolute positioned elements by zIndex (highest first)
    absoluteHits.sort((a, b) => b.zIndex - a.zIndex);

    // Check absolute positioned children first (highest zIndex wins)
    for (const { node: absChild } of absoluteHits) {
      const hit = findElementAtPoint(absChild, x, y, layoutMap);
      if (hit) return hit;
    }

    // Then check normal flow children in reverse order (last rendered first)
    for (let i = normalHits.length - 1; i >= 0; i--) {
      const hit = findElementAtPoint(normalHits[i], x, y, layoutMap);
      if (hit) return hit;
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
 * Returns elements from root to leaf order, respecting zIndex for absolute positioned elements
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

    // Check children - handle absolute positioned elements specially
    if (node.children) {
      // Separate absolute and normal flow children
      const absoluteHits: Array<{ node: TUINode; zIndex: number }> = [];
      const normalChildren: TUINode[] = [];

      for (const child of node.children) {
        if (typeof child !== 'object' || child === null || !('type' in child)) continue;

        const childNode = child as TUINode;
        if (childNode.type === 'fragment') {
          for (const fragmentChild of childNode.children) {
            if (
              typeof fragmentChild === 'object' &&
              fragmentChild !== null &&
              'type' in fragmentChild
            ) {
              const fc = fragmentChild as TUINode;
              const fcLayout = currentLayoutMap?.get(fc);
              if (fcLayout && pointInRect(layoutX, layoutY, fcLayout)) {
                if (isAbsolutePositioned(fc)) {
                  absoluteHits.push({ node: fc, zIndex: getZIndex(fc) });
                } else {
                  normalChildren.push(fc);
                }
              }
            }
          }
        } else {
          const childLayout = currentLayoutMap?.get(childNode);
          if (childLayout && pointInRect(layoutX, layoutY, childLayout)) {
            if (isAbsolutePositioned(childNode)) {
              absoluteHits.push({ node: childNode, zIndex: getZIndex(childNode) });
            } else {
              normalChildren.push(childNode);
            }
          }
        }
      }

      // Process normal flow children first (in tree order)
      for (const child of normalChildren) {
        collectHits(child);
      }

      // Then process absolute positioned children sorted by zIndex (lowest first)
      // so that highest zIndex ends up at the end of results (most recent = topmost)
      absoluteHits.sort((a, b) => a.zIndex - b.zIndex);
      for (const { node: absChild } of absoluteHits) {
        collectHits(absChild);
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
