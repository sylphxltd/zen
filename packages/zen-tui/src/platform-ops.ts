/**
 * TUI Platform Operations
 *
 * Virtual node implementation of platform operations for terminal UI.
 * Registered during @zen/tui initialization.
 *
 * Uses container pattern: reactive content is stored as children inside
 * fragment nodes, not as siblings of a marker.
 */

import type { PlatformOps } from '@zen/runtime';
import { getCurrentParent } from './parent-context.js';
import { scheduleNodeUpdate } from './render-context.js';
import type { TUINode } from './types.js';

/**
 * TUI platform operations using virtual node tree
 *
 * All reactive containers (For, Show, Switch, etc.) create fragment nodes
 * and manage children inside them. This is simpler than the marker pattern
 * and unifies all reactive content handling.
 */
export const tuiPlatformOps: PlatformOps<TUINode> = {
  /**
   * Create a reactive container (fragment node)
   *
   * Container nodes hold children that can be updated via setChildren.
   * This is used by For, Show, Switch, Suspense, ErrorBoundary.
   */
  createContainer(name: string): TUINode {
    const parent = getCurrentParent();

    const container: TUINode = {
      type: 'fragment',
      props: { _containerName: name },
      children: [],
    };

    // Set parentNode immediately if parent is available
    if (parent) {
      try {
        container.parentNode = parent;
      } catch {
        // Object is frozen/sealed, skip parentNode assignment
      }
    }

    return container;
  },

  /**
   * Set the children of a container node
   *
   * Replaces all existing children with new ones.
   * This is the primary way to update reactive content.
   */
  setChildren(container: TUINode, children: TUINode[]): void {
    // Update children array
    container.children = children;

    // Set parentNode for all children
    for (const child of children) {
      if (typeof child === 'object' && child !== null) {
        try {
          (child as TUINode).parentNode = container;
        } catch {
          // Object is frozen/sealed, skip parentNode assignment
        }
      }
    }
  },

  /**
   * Append a single child to a container
   */
  appendChild(container: TUINode, child: TUINode): void {
    container.children.push(child);

    // Set parentNode
    try {
      child.parentNode = container;
    } catch {
      // Object is frozen/sealed, skip parentNode assignment
    }
  },

  /**
   * Remove a child from its parent container
   */
  removeChild(parent: TUINode, child: TUINode): void {
    const index = parent.children.findIndex((c) => c === child);
    if (index !== -1) {
      parent.children.splice(index, 1);

      // Clear parentNode
      try {
        child.parentNode = undefined;
      } catch {
        // Object is frozen/sealed, skip parentNode assignment
      }
    }
  },

  /**
   * Get the parent of a node
   */
  getParent(node: TUINode): TUINode | null {
    return node.parentNode || null;
  },

  /**
   * Notify the renderer that a node has been updated
   */
  notifyUpdate(node: TUINode): void {
    scheduleNodeUpdate(node, '');
  },
};
