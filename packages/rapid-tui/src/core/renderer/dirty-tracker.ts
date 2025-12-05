/**
 * Dirty Tracker for Fine-Grained Reactivity
 *
 * Tracks which nodes and regions need to be re-rendered.
 * Enables incremental rendering by knowing exactly what changed.
 */

import type { TUINode } from '../types.js';
import type { LayoutMap } from '../yoga-layout.js';
import { type Region, createRegion, mergeRegions, totalRegionArea } from './region.js';

/**
 * Types of dirty state.
 * Higher values indicate more significant changes.
 */
export enum DirtyType {
  None = 0,
  Content = 1, // Only content changed (text, style)
  Layout = 2, // Position or size changed
  Structure = 4, // Node added or removed
}

/**
 * Tracks dirty nodes and their affected regions.
 */
export class DirtyTracker {
  /** Map of dirty nodes to their dirty type */
  private dirtyNodes: Map<TUINode, DirtyType> = new Map();

  /** Set of dirty regions (bounding boxes of dirty nodes) */
  private dirtyRegions: Set<Region> = new Set();

  /** Map of nodes to their current regions (from layout) */
  private nodeRegions: Map<TUINode, Region> = new Map();

  /** Whether layout needs to be recomputed */
  private _layoutDirty = false;

  /** Buffer dimensions for ratio calculations */
  private width = 80;
  private height = 24;

  /**
   * Set buffer dimensions for ratio calculations.
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Mark a node as having content changes (text, style).
   * Does not require layout recomputation.
   */
  markContentDirty(node: TUINode): void {
    const existing = this.dirtyNodes.get(node) ?? DirtyType.None;
    this.dirtyNodes.set(node, existing | DirtyType.Content);

    // Add node's region to dirty regions
    const region = this.nodeRegions.get(node);
    if (region) {
      this.dirtyRegions.add(region);
    }
  }

  /**
   * Mark a node as having layout changes (position, size).
   * Requires layout recomputation.
   */
  markLayoutDirty(node: TUINode): void {
    const existing = this.dirtyNodes.get(node) ?? DirtyType.None;
    this.dirtyNodes.set(node, existing | DirtyType.Layout);
    this._layoutDirty = true;

    // For layout changes, we need to mark both old and new regions
    // Old region will be handled by nodeRegions, new will be computed after layout
    const region = this.nodeRegions.get(node);
    if (region) {
      this.dirtyRegions.add(region);
    }
  }

  /**
   * Mark a node as having structural changes (added/removed).
   * Requires layout recomputation and affects entire subtree.
   */
  markStructureDirty(node: TUINode): void {
    this.dirtyNodes.set(node, DirtyType.Structure);
    this._layoutDirty = true;

    // For structural changes, mark the node's region
    const region = this.nodeRegions.get(node);
    if (region) {
      this.dirtyRegions.add(region);
    }
  }

  /**
   * Mark the entire screen as dirty (for full refresh).
   */
  markFullDirty(): void {
    this._layoutDirty = true;
    this.dirtyRegions.add(createRegion(0, 0, this.width, this.height));
  }

  /**
   * Check if layout needs recomputation.
   */
  get layoutDirty(): boolean {
    return this._layoutDirty;
  }

  /**
   * Set layout dirty flag directly.
   */
  set layoutDirty(value: boolean) {
    this._layoutDirty = value;
  }

  /**
   * Check if there are any dirty nodes.
   */
  get hasDirtyNodes(): boolean {
    return this.dirtyNodes.size > 0;
  }

  /**
   * Get dirty nodes.
   */
  getDirtyNodes(): Map<TUINode, DirtyType> {
    return this.dirtyNodes;
  }

  /**
   * Get dirty regions (merged to reduce overlap).
   */
  getDirtyRegions(): Region[] {
    return mergeRegions([...this.dirtyRegions]);
  }

  /**
   * Get raw dirty regions without merging.
   */
  getRawDirtyRegions(): Region[] {
    return [...this.dirtyRegions];
  }

  /**
   * Update node-to-region mapping after layout computation.
   */
  updateNodeRegions(layoutMap: LayoutMap): void {
    this.nodeRegions.clear();

    for (const [node, layout] of layoutMap) {
      this.nodeRegions.set(
        node,
        createRegion(
          Math.floor(layout.x),
          Math.floor(layout.y),
          Math.ceil(layout.width),
          Math.ceil(layout.height),
        ),
      );
    }
  }

  /**
   * Get the region for a specific node.
   */
  getNodeRegion(node: TUINode): Region | undefined {
    return this.nodeRegions.get(node);
  }

  /**
   * Calculate the ratio of dirty area to total area.
   * Used to decide between incremental and full refresh.
   */
  getDirtyRatio(): number {
    const regions = this.getDirtyRegions();
    if (regions.length === 0) return 0;

    const dirtyArea = totalRegionArea(regions);
    const totalArea = this.width * this.height;

    return dirtyArea / totalArea;
  }

  /**
   * Clear all dirty state.
   * Called after render is complete.
   */
  clear(): void {
    this.dirtyNodes.clear();
    this.dirtyRegions.clear();
    this._layoutDirty = false;
  }

  /**
   * Check if a specific node is dirty.
   */
  isNodeDirty(node: TUINode): boolean {
    return this.dirtyNodes.has(node);
  }

  /**
   * Get the dirty type for a specific node.
   */
  getNodeDirtyType(node: TUINode): DirtyType {
    return this.dirtyNodes.get(node) ?? DirtyType.None;
  }
}

/**
 * Global dirty tracker instance.
 */
let globalDirtyTracker: DirtyTracker | null = null;

/**
 * Get the global dirty tracker.
 */
export function getDirtyTracker(): DirtyTracker | null {
  return globalDirtyTracker;
}

/**
 * Set the global dirty tracker.
 */
export function setDirtyTracker(tracker: DirtyTracker | null): void {
  globalDirtyTracker = tracker;
}
