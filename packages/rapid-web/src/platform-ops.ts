/**
 * Web Platform Operations
 *
 * DOM-specific implementation of platform operations.
 * Registered during @rapid/web initialization.
 *
 * Uses container pattern: reactive content (For, Show, Switch) creates
 * a container element that holds children. This matches TUI's approach
 * for consistent cross-platform behavior.
 */

import type { PlatformOps } from '@rapid/runtime';

/**
 * Custom element to act as transparent container for reactive content.
 * Uses display:contents to be invisible in layout while holding children.
 */
const CONTAINER_TAG = 'rapid-container';

/**
 * Web platform operations using native DOM APIs
 */
export const webPlatformOps: PlatformOps<Node> = {
  /**
   * Create a reactive container element
   *
   * Uses a custom element with display:contents to be transparent in layout.
   * The container holds children that can be updated via setChildren().
   *
   * @param name - Debug name for the container (stored as data attribute)
   */
  createContainer(name: string): HTMLElement {
    const container = document.createElement(CONTAINER_TAG);
    container.setAttribute('data-name', name);
    // Make container transparent in layout
    container.style.display = 'contents';
    return container;
  },

  /**
   * Set the children of a container node
   *
   * Replaces all existing children with new ones.
   * This is the primary way to update reactive content.
   */
  setChildren(container: Node, children: Node[]): void {
    // Clear existing children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Add new children
    for (const child of children) {
      container.appendChild(child);
    }
  },

  /**
   * Append a single child to a container
   */
  appendChild(container: Node, child: Node): void {
    container.appendChild(child);
  },

  /**
   * Remove a child from its parent container
   */
  removeChild(parent: Node, child: Node): void {
    parent.removeChild(child);
  },

  /**
   * Get the parent of a node
   */
  getParent(node: Node): Node | null {
    return node.parentNode;
  },

  /**
   * Notify the renderer that a node has been updated
   *
   * For web, this is a no-op since DOM updates are immediate.
   * Kept for API compatibility with TUI which needs explicit update scheduling.
   */
  notifyUpdate(_node: Node): void {
    // No-op for web - DOM updates are immediate
  },

  // ============================================
  // DEPRECATED - Legacy marker pattern
  // Kept for backwards compatibility
  // ============================================

  createMarker(name: string): Comment {
    return document.createComment(name);
  },

  createFragment(): DocumentFragment {
    return document.createDocumentFragment();
  },

  insertBefore(parent: Node, child: Node | DocumentFragment, reference: Node | Comment): void {
    parent.insertBefore(child, reference);
  },

  appendToFragment(fragment: DocumentFragment, child: Node): void {
    fragment.appendChild(child);
  },
};
