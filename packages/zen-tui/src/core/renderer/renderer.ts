/**
 * Optimal Terminal Renderer
 *
 * Implements the architecture from ADR-003:
 * - Double buffer with smart diffing
 * - Adaptive strategy (incremental vs full refresh)
 * - Synchronized output
 * - Fine-grained dirty tracking
 *
 * @see docs/adr/003-final-renderer-architecture.md
 */

import { TerminalBuffer } from '../terminal-buffer.js';
import type { TUINode } from '../types.js';
import type { LayoutMap } from '../yoga-layout.js';
import { DirtyTracker, DirtyType } from './dirty-tracker.js';
import { ESC, OutputBuffer } from './output-buffer.js';
import { type Region, clampRegion, createRegion, regionContainsPoint } from './region.js';

/**
 * Rendering strategy.
 */
export enum RenderStrategy {
  /** Update only changed regions */
  Incremental = 'incremental',
  /** Redraw everything */
  Full = 'full',
}

/**
 * Rendering mode.
 */
export type RenderMode = 'inline' | 'fullscreen';

/**
 * Thresholds for strategy selection.
 */
export const STRATEGY_THRESHOLDS = {
  /** If dirty ratio exceeds this, use full refresh */
  dirtyRatio: 0.5,

  /** If more than this many regions, use full refresh (too fragmented) */
  maxRegions: 10,

  /** Minimum dirty area to consider full refresh (below this, always incremental) */
  minAreaForFull: 50,
};

/**
 * Line change from buffer diff.
 */
export interface LineChange {
  y: number;
  content: string;
}

/**
 * Renderer configuration.
 */
export interface RendererConfig {
  width: number;
  height: number;
  mode: RenderMode;
  syncEnabled?: boolean;
}

/**
 * Render function signature for rendering nodes to buffer.
 */
export type RenderNodeFn = (
  node: TUINode,
  buffer: TerminalBuffer,
  layoutMap: LayoutMap,
  fullRender: boolean,
) => void;

/**
 * Main renderer class.
 */
export class Renderer {
  /** Current render buffer */
  private currentBuffer: TerminalBuffer;

  /** Previous render buffer (for diffing) */
  private previousBuffer: TerminalBuffer;

  /** Dirty tracker for fine-grained updates */
  private dirtyTracker: DirtyTracker;

  /** Output buffer for synchronized writes */
  private output: OutputBuffer;

  /** Current rendering mode */
  private mode: RenderMode;

  /** Buffer width */
  private width: number;

  /** Buffer height */
  private height: number;

  /** Content height for inline mode */
  private contentHeight = 0;

  /** Current cursor line for inline mode (relative positioning) */
  private cursorLine = 0;

  /** Whether this is the first render */
  private isFirstRender = true;

  /** External render function */
  private renderNodeFn: RenderNodeFn | null = null;

  /** Last output hash for skip-identical optimization */
  private lastOutputHash = '';

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.mode = config.mode;

    // For inline mode, use a large buffer height
    const bufferHeight = config.mode === 'fullscreen' ? config.height : 1000;
    this.height = bufferHeight;

    this.currentBuffer = new TerminalBuffer(config.width, bufferHeight);
    this.previousBuffer = new TerminalBuffer(config.width, bufferHeight);

    this.dirtyTracker = new DirtyTracker();
    this.dirtyTracker.setDimensions(config.width, bufferHeight);

    this.output = new OutputBuffer();
    this.output.setSyncEnabled(config.syncEnabled ?? true);
  }

  /**
   * Set the render node function.
   */
  setRenderNodeFn(fn: RenderNodeFn): void {
    this.renderNodeFn = fn;
  }

  /**
   * Get the dirty tracker for external use.
   */
  getDirtyTracker(): DirtyTracker {
    return this.dirtyTracker;
  }

  /**
   * Get the current buffer for external use.
   */
  getCurrentBuffer(): TerminalBuffer {
    return this.currentBuffer;
  }

  /**
   * Get current content height (inline mode).
   */
  getContentHeight(): number {
    return this.contentHeight;
  }

  /**
   * Resize the renderer.
   */
  resize(width: number, height: number): void {
    this.width = width;

    const bufferHeight = this.mode === 'fullscreen' ? height : 1000;
    this.height = bufferHeight;

    this.currentBuffer.resize(width, bufferHeight);
    this.previousBuffer.resize(width, bufferHeight);
    this.previousBuffer.clear();

    this.dirtyTracker.setDimensions(width, bufferHeight);
    this.dirtyTracker.markFullDirty();
  }

  /**
   * Main render entry point.
   */
  render(root: TUINode, layoutMap: LayoutMap, newContentHeight?: number): void {
    // Phase 1: Update node regions from layout
    this.dirtyTracker.updateNodeRegions(layoutMap);

    // Phase 2: Select strategy
    const strategy = this.selectStrategy(newContentHeight);

    // Phase 3: Render to buffer
    if (this.renderNodeFn) {
      const fullRender = strategy === RenderStrategy.Full;
      if (fullRender) {
        this.currentBuffer.clear();
      }
      this.renderNodeFn(root, this.currentBuffer, layoutMap, fullRender);
    }

    // Phase 4: Diff and output
    this.outputChanges(strategy, newContentHeight);

    // Phase 5: Swap buffers
    this.swapBuffers();

    // Phase 6: Clear dirty state
    this.dirtyTracker.clear();
    this.isFirstRender = false;
  }

  /**
   * Select rendering strategy based on dirty state.
   */
  private selectStrategy(newContentHeight?: number): RenderStrategy {
    // First render is always full
    if (this.isFirstRender) {
      return RenderStrategy.Full;
    }

    // Layout changes require full render
    if (this.dirtyTracker.layoutDirty) {
      return RenderStrategy.Full;
    }

    // Height change in inline mode requires full render
    if (
      this.mode === 'inline' &&
      newContentHeight !== undefined &&
      newContentHeight !== this.contentHeight
    ) {
      return RenderStrategy.Full;
    }

    // Check dirty ratio
    const ratio = this.dirtyTracker.getDirtyRatio();
    if (ratio > STRATEGY_THRESHOLDS.dirtyRatio) {
      return RenderStrategy.Full;
    }

    // Check number of regions
    const regions = this.dirtyTracker.getDirtyRegions();
    if (regions.length > STRATEGY_THRESHOLDS.maxRegions) {
      return RenderStrategy.Full;
    }

    // No dirty nodes means nothing to do, but we'll treat it as incremental
    if (!this.dirtyTracker.hasDirtyNodes) {
      return RenderStrategy.Incremental;
    }

    return RenderStrategy.Incremental;
  }

  /**
   * Output changes to terminal.
   */
  private outputChanges(strategy: RenderStrategy, newContentHeight?: number): void {
    this.output.beginSync();

    if (this.mode === 'fullscreen') {
      this.outputFullscreen(strategy);
    } else {
      this.outputInline(strategy, newContentHeight);
    }

    this.output.endSync();
    this.output.flush();
  }

  /**
   * Output for fullscreen mode using absolute positioning.
   */
  private outputFullscreen(strategy: RenderStrategy): void {
    if (strategy === RenderStrategy.Full) {
      // Diff entire buffer
      const changes = this.diffFullBuffer();

      // Early exit if no changes
      if (changes.length === 0) {
        return;
      }

      for (const change of changes) {
        this.output.updateLine(change.y + 1, change.content);
      }
    } else {
      // Diff only dirty regions
      const regions = this.dirtyTracker.getDirtyRegions();
      let hasChanges = false;

      for (const region of regions) {
        const changes = this.diffRegion(region);
        if (changes.length > 0) {
          hasChanges = true;
          for (const change of changes) {
            this.output.updateLine(change.y + 1, change.content);
          }
        }
      }

      // Early exit if no actual changes
      if (!hasChanges) {
        return;
      }
    }
  }

  /**
   * Output for inline mode using relative positioning.
   */
  private outputInline(strategy: RenderStrategy, newContentHeight?: number): void {
    const newHeight = newContentHeight ?? this.calculateContentHeight();
    const prevHeight = this.contentHeight;

    // Height change forces full refresh
    const effectiveStrategy = newHeight !== prevHeight ? RenderStrategy.Full : strategy;

    if (effectiveStrategy === RenderStrategy.Full) {
      if (!this.outputInlineFull(newHeight, prevHeight)) {
        return; // Skip render - content identical
      }
    } else {
      if (!this.outputInlineIncremental(newHeight, prevHeight)) {
        return; // Skip render - no changes
      }
    }

    this.contentHeight = newHeight;
  }

  /**
   * Full refresh for inline mode.
   * @returns true if rendered, false if skipped (identical content)
   */
  private outputInlineFull(newHeight: number, prevHeight: number): boolean {
    const content = this.renderBufferContent(newHeight);
    const contentHash = this.simpleHash(content);

    if (contentHash === this.lastOutputHash && prevHeight === newHeight) {
      return false; // Content identical, skip render
    }
    this.lastOutputHash = contentHash;

    this.clearInlineContent(prevHeight);
    this.output.write(content);

    if (newHeight > 1) {
      this.output.moveUp(newHeight - 1);
    }
    this.output.carriageReturn();
    this.cursorLine = 0;
    return true;
  }

  /**
   * Incremental update for inline mode.
   * @returns true if rendered, false if skipped (no changes)
   */
  private outputInlineIncremental(newHeight: number, prevHeight: number): boolean {
    const changes = this.diffBuffer(Math.max(newHeight, prevHeight));

    if (changes.length === 0) {
      return false; // No changes
    }

    for (const change of changes) {
      if (change.y < newHeight) {
        this.moveToLine(change.y);
        this.output.replaceLine(change.content);
      }
    }
    this.moveToLine(0);
    return true;
  }

  /**
   * Simple hash for content comparison (fast, not cryptographic).
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear inline content (for re-render).
   */
  private clearInlineContent(height: number): void {
    if (height === 0) return;

    // Ensure we're at the start
    this.output.carriageReturn();

    // Clear each line
    for (let i = 0; i < height; i++) {
      this.output.clearLine();
      if (i < height - 1) {
        this.output.moveDown(1);
        this.output.carriageReturn();
      }
    }

    // Move back to top
    if (height > 1) {
      this.output.moveUp(height - 1);
    }
    this.output.carriageReturn();
    this.cursorLine = 0;
  }

  /**
   * Move cursor to target line (relative positioning for inline mode).
   */
  private moveToLine(targetLine: number): void {
    if (targetLine > this.cursorLine) {
      this.output.moveDown(targetLine - this.cursorLine);
    } else if (targetLine < this.cursorLine) {
      this.output.moveUp(this.cursorLine - targetLine);
    }
    this.cursorLine = targetLine;
  }

  /**
   * Render buffer content as string (for inline mode).
   */
  private renderBufferContent(height: number): string {
    const lines: string[] = [];
    for (let y = 0; y < height; y++) {
      lines.push(this.currentBuffer.getLine(y));
    }
    return lines.join('\n');
  }

  /**
   * Calculate actual content height (for inline mode).
   */
  private calculateContentHeight(): number {
    // Find last non-empty line
    for (let y = this.height - 1; y >= 0; y--) {
      const line = this.currentBuffer.getRawLine(y);
      if (line.trim() !== '') {
        return y + 1;
      }
    }
    return 1; // Minimum height of 1
  }

  /**
   * Diff buffer up to specified height.
   * For inline mode, only diff up to contentHeight (not entire 1000-line buffer).
   */
  private diffBuffer(maxHeight: number): LineChange[] {
    const changes: LineChange[] = [];
    const limit = Math.min(maxHeight, this.height);

    for (let y = 0; y < limit; y++) {
      const currentLine = this.currentBuffer.getLine(y);
      const previousLine = this.previousBuffer.getLine(y);

      if (currentLine !== previousLine) {
        changes.push({ y, content: currentLine });
      }
    }

    return changes;
  }

  /**
   * Diff entire buffer (for fullscreen mode).
   */
  private diffFullBuffer(): LineChange[] {
    return this.diffBuffer(this.height);
  }

  /**
   * Diff a specific region only.
   */
  private diffRegion(region: Region): LineChange[] {
    const changes: LineChange[] = [];
    const clampedRegion = clampRegion(region, this.width, this.height);

    for (let y = clampedRegion.y; y < clampedRegion.y + clampedRegion.height; y++) {
      const currentLine = this.currentBuffer.getLine(y);
      const previousLine = this.previousBuffer.getLine(y);

      if (currentLine !== previousLine) {
        changes.push({ y, content: currentLine });
      }
    }

    return changes;
  }

  /**
   * Swap current and previous buffers.
   */
  private swapBuffers(): void {
    // Copy changed lines to previous buffer
    const changes = this.diffFullBuffer();
    for (const change of changes) {
      this.previousBuffer.setLine(change.y, change.content);
    }
  }

  /**
   * Cleanup on exit.
   */
  cleanup(): void {
    if (this.mode === 'inline' && this.contentHeight > 0) {
      // Move cursor to bottom of content
      if (this.contentHeight > 1) {
        process.stdout.write(ESC.cursorDown(this.contentHeight - 1));
      }
      process.stdout.write('\n');
    }
  }

  /**
   * Force a full refresh on next render.
   */
  forceFullRefresh(): void {
    this.dirtyTracker.markFullDirty();
    this.isFirstRender = true;
  }

  /**
   * Clear current inline content from screen.
   * Used before printing static content to prevent visual artifacts.
   */
  clearCurrentContent(): void {
    if (this.mode !== 'inline' || this.contentHeight === 0) return;

    this.output.beginSync();
    this.clearInlineContent(this.contentHeight);
    this.output.endSync();
    this.output.flush();
  }

  /**
   * Reset cursor position tracking after static content is printed.
   * Call this after printing static content to stdout - it tells the renderer
   * that the cursor is now at a "new" starting position and previous content
   * should not be cleared.
   */
  resetCursorForStaticContent(_linesPrinted: number): void {
    // Reset content height to 0 - the previous content is now in scrollback
    // and should not be cleared on next render
    this.contentHeight = 0;
    this.cursorLine = 0;
    // Clear previous buffer so we don't try to diff against old content
    this.previousBuffer.clear();
    // Mark as first render to ensure full render without trying to clear
    this.isFirstRender = true;
  }

  /**
   * Get current mode.
   */
  getMode(): RenderMode {
    return this.mode;
  }

  /**
   * Switch mode (e.g., inline to fullscreen).
   */
  switchMode(mode: RenderMode, height?: number): void {
    if (this.mode === mode) return;

    this.mode = mode;
    const bufferHeight = mode === 'fullscreen' ? (height ?? 24) : 1000;
    this.height = bufferHeight;

    this.currentBuffer.resize(this.width, bufferHeight);
    this.previousBuffer.resize(this.width, bufferHeight);
    this.previousBuffer.clear();

    this.contentHeight = 0;
    this.cursorLine = 0;
    this.isFirstRender = true;

    this.dirtyTracker.setDimensions(this.width, bufferHeight);
    this.dirtyTracker.markFullDirty();
  }
}

/**
 * Create a renderer with default configuration.
 */
export function createRenderer(config: RendererConfig): Renderer {
  return new Renderer(config);
}
