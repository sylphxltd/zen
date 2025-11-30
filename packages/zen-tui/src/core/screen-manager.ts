/**
 * Screen Manager
 *
 * Coordinates between InlineRenderer and FullscreenRenderer.
 * Handles mode switching and provides a unified rendering interface.
 *
 * Mode Switching Flow:
 * ```
 * [Inline Mode]
 *     │
 *     ├─ enterFullscreen()
 *     │      │
 *     │      ├─ inlineRenderer.pause()
 *     │      └─ fullscreenRenderer.enter()
 *     │
 *     ▼
 * [Fullscreen Mode]
 *     │
 *     ├─ exitFullscreen()
 *     │      │
 *     │      ├─ fullscreenRenderer.exit()
 *     │      └─ inlineRenderer.resume()
 *     │
 *     ▼
 * [Inline Mode]
 * ```
 *
 * @see ADR-001 for architecture details
 */

import { FullscreenRenderer } from './fullscreen-renderer.js';
import { InlineRenderer } from './inline-renderer.js';
import type { TUINode } from './types.js';
import type { LayoutMap } from './yoga-layout.js';

/**
 * Current rendering mode
 */
export type RenderMode = 'inline' | 'fullscreen';

/**
 * Callback for mode changes
 */
export type ModeChangeCallback = (mode: RenderMode) => void;

/**
 * ScreenManager class
 *
 * Manages the lifecycle of inline and fullscreen renderers.
 * Provides a unified interface for rendering regardless of mode.
 */
export class ScreenManager {
  /** Inline renderer instance */
  private inlineRenderer: InlineRenderer;

  /** Fullscreen renderer instance */
  private fullscreenRenderer: FullscreenRenderer;

  /** Current rendering mode */
  private currentMode: RenderMode = 'inline';

  /** Terminal width */
  private terminalWidth: number;

  /** Terminal height */
  private terminalHeight: number;

  /** Mode change callbacks */
  private modeChangeCallbacks: Set<ModeChangeCallback> = new Set();

  /** Whether the manager has been started */
  private started = false;

  constructor(terminalWidth: number, terminalHeight: number) {
    this.terminalWidth = terminalWidth;
    this.terminalHeight = terminalHeight;
    this.inlineRenderer = new InlineRenderer();
    this.fullscreenRenderer = new FullscreenRenderer();
  }

  /**
   * Start the screen manager
   * Initializes in inline mode by default
   */
  start(): void {
    if (this.started) {
      throw new Error('ScreenManager already started');
    }

    this.inlineRenderer.start();
    this.currentMode = 'inline';
    this.started = true;
  }

  /**
   * Get current rendering mode
   */
  getMode(): RenderMode {
    return this.currentMode;
  }

  /**
   * Check if in fullscreen mode
   */
  isFullscreen(): boolean {
    return this.currentMode === 'fullscreen';
  }

  /**
   * Enter fullscreen mode
   * Called by FullscreenLayout when it mounts
   */
  enterFullscreen(): void {
    if (!this.started) {
      throw new Error('ScreenManager not started');
    }

    if (this.currentMode === 'fullscreen') {
      // Already in fullscreen, nothing to do
      return;
    }

    // Pause inline renderer (saves state, positions cursor at bottom)
    this.inlineRenderer.pause();

    // Enter fullscreen (switches to alternate screen)
    this.fullscreenRenderer.enter(this.terminalWidth, this.terminalHeight);

    this.currentMode = 'fullscreen';
    this.notifyModeChange();
  }

  /**
   * Exit fullscreen mode
   * Called by FullscreenLayout when it unmounts
   */
  exitFullscreen(): void {
    if (!this.started) {
      throw new Error('ScreenManager not started');
    }

    if (this.currentMode === 'inline') {
      // Already in inline, nothing to do
      return;
    }

    // Exit fullscreen (returns to main screen)
    this.fullscreenRenderer.exit();

    // Resume inline renderer (ready for new content)
    this.inlineRenderer.resume();

    this.currentMode = 'inline';
    this.notifyModeChange();
  }

  /**
   * Render content based on current mode
   *
   * For inline mode: renders string content
   * For fullscreen mode: renders node tree with layout
   *
   * @param content - String content for inline mode
   * @param node - Node tree for fullscreen mode
   * @param layoutMap - Layout map for fullscreen mode
   * @param fullRender - Force full render (no diffing)
   */
  render(content: string, node?: TUINode, layoutMap?: LayoutMap, fullRender = false): void {
    if (!this.started) {
      throw new Error('ScreenManager not started');
    }

    if (this.currentMode === 'inline') {
      this.inlineRenderer.render(content);
    } else {
      if (node && layoutMap) {
        this.fullscreenRenderer.render(node, layoutMap, fullRender);
      } else {
        // Fallback to string rendering
        this.fullscreenRenderer.renderString(content);
      }
    }
  }

  /**
   * Render string content (works in both modes)
   *
   * @param content - String content to render
   */
  renderString(content: string): void {
    if (!this.started) {
      throw new Error('ScreenManager not started');
    }

    if (this.currentMode === 'inline') {
      this.inlineRenderer.render(content);
    } else {
      this.fullscreenRenderer.renderString(content);
    }
  }

  /**
   * Render node tree (fullscreen mode only, falls back to string in inline)
   *
   * @param node - Root node
   * @param layoutMap - Layout information
   * @param content - Fallback string content for inline mode
   * @param fullRender - Force full render
   */
  renderNode(node: TUINode, layoutMap: LayoutMap, content: string, fullRender = false): void {
    if (!this.started) {
      throw new Error('ScreenManager not started');
    }

    if (this.currentMode === 'inline') {
      this.inlineRenderer.render(content);
    } else {
      this.fullscreenRenderer.render(node, layoutMap, fullRender);
    }
  }

  /**
   * Handle terminal resize
   *
   * @param width - New terminal width
   * @param height - New terminal height
   */
  resize(width: number, height: number): void {
    this.terminalWidth = width;
    this.terminalHeight = height;

    if (this.currentMode === 'fullscreen') {
      this.fullscreenRenderer.resize(width, height);
    }
    // Inline mode doesn't need resize handling - content is dynamic
  }

  /**
   * Clean up and stop the screen manager
   */
  cleanup(): void {
    if (!this.started) {
      return;
    }

    // Exit fullscreen if active
    if (this.currentMode === 'fullscreen') {
      this.fullscreenRenderer.exit();
    }

    // Clean up inline renderer
    if (this.inlineRenderer.getState() === 'active') {
      this.inlineRenderer.cleanup();
    }

    this.started = false;
    this.modeChangeCallbacks.clear();
  }

  /**
   * Subscribe to mode changes
   *
   * @param callback - Function to call when mode changes
   * @returns Unsubscribe function
   */
  onModeChange(callback: ModeChangeCallback): () => void {
    this.modeChangeCallbacks.add(callback);
    return () => {
      this.modeChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of mode change
   */
  private notifyModeChange(): void {
    for (const callback of this.modeChangeCallbacks) {
      callback(this.currentMode);
    }
  }

  /**
   * Get terminal dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.terminalWidth,
      height: this.terminalHeight,
    };
  }

  /**
   * Get current content height (inline mode only)
   */
  getContentHeight(): number {
    return this.inlineRenderer.getContentHeight();
  }

  /**
   * Get fullscreen buffer (fullscreen mode only)
   */
  getFullscreenBuffer() {
    return this.fullscreenRenderer.getCurrentBuffer();
  }
}

// ============================================================================
// Global Screen Manager Instance
// ============================================================================

let globalScreenManager: ScreenManager | null = null;

/**
 * Get the global screen manager instance
 * @throws Error if screen manager not initialized
 */
export function getScreenManager(): ScreenManager {
  if (!globalScreenManager) {
    throw new Error('ScreenManager not initialized. Call render() first.');
  }
  return globalScreenManager;
}

/**
 * Set the global screen manager instance
 * Called by render() when starting
 */
export function setScreenManager(manager: ScreenManager | null): void {
  globalScreenManager = manager;
}

/**
 * Check if screen manager is initialized
 */
export function hasScreenManager(): boolean {
  return globalScreenManager !== null;
}
