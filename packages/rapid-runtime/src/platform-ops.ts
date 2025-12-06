/**
 * Platform Operations Abstraction
 *
 * Defines platform-agnostic operations for DOM-like manipulation.
 * Each renderer (web, tui, native) implements these operations
 * for their specific platform.
 *
 * This abstraction allows @rapid/runtime components to work across
 * all platforms without direct DOM dependencies.
 */

export interface PlatformOps<TNode = object> {
  /**
   * Create a reactive container node
   *
   * Container nodes hold children that can be updated reactively.
   * This is the primary abstraction for For, Show, Switch, etc.
   *
   * TUI: TUINode { type: 'fragment', children: [] }
   * Web: Wrapper element or fragment
   * Native: Container view
   */
  createContainer(name: string): TNode;

  /**
   * Set the children of a container node
   * Replaces all existing children with new ones
   */
  setChildren(container: TNode, children: TNode[]): void;

  /**
   * Append a single child to a container
   */
  appendChild(container: TNode, child: TNode): void;

  /**
   * Remove a child from its parent container
   */
  removeChild(parent: TNode, child: TNode): void;

  /**
   * Get the parent of a node
   */
  getParent(node: TNode): TNode | null;

  /**
   * Notify the renderer that a node has been updated
   * Triggers re-render for the affected subtree
   */
  notifyUpdate(node: TNode): void;

  // ============================================
  // DEPRECATED - Legacy marker pattern
  // These methods are kept for backwards compatibility
  // New code should use createContainer + setChildren
  // ============================================

  /**
   * @deprecated Use createContainer instead
   */
  createMarker?(name: string): TNode;

  /**
   * @deprecated Use setChildren instead
   */
  createFragment?(): TNode[];

  /**
   * @deprecated Use setChildren instead
   */
  insertBefore?(parent: TNode, child: TNode | TNode[], reference: TNode): void;

  /**
   * @deprecated Use setChildren instead
   */
  appendToFragment?(fragment: TNode[], child: TNode): void;
}

/**
 * Current platform operations
 * Set by each renderer during initialization
 */
let currentPlatformOps: PlatformOps | null = null;

/**
 * Set the platform operations for the current environment
 * Called by renderer initialization (@rapid/web, @rapid/tui, etc.)
 */
export function setPlatformOps(ops: PlatformOps): void {
  currentPlatformOps = ops;
}

/**
 * Get the current platform operations
 * Throws if not initialized (helps catch missing renderer setup)
 */
export function getPlatformOps(): PlatformOps {
  if (!currentPlatformOps) {
    throw new Error(
      'Platform operations not initialized. ' +
        'Import and use a renderer (@rapid/web, @rapid/tui, or @rapid/native) before using components.',
    );
  }
  return currentPlatformOps;
}

/**
 * Check if platform operations are available
 */
export function hasPlatformOps(): boolean {
  return currentPlatformOps !== null;
}
