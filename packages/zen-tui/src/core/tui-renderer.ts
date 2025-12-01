/**
 * TUI Renderer
 *
 * Unified renderer for terminal UI applications.
 * Encapsulates all terminal-specific logic:
 * - Lifecycle management (mount/unmount)
 * - Input handling (keyboard, mouse)
 * - Terminal setup (raw mode, cursor, alternate screen)
 * - Layout computation (Yoga)
 * - Buffer management (double buffer + diff)
 * - Output (synchronized writes)
 *
 * Architecture mirrors @zen/web's simple render() API:
 * - Web: render(component, container) → appendChild to DOM
 * - TUI: render(component) → TUIRenderer manages everything
 *
 * @see docs/adr/003-final-renderer-architecture.md
 */

import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { createRoot, signal } from '@zen/signal';
import { dispatchInput } from '../hooks/useInput.js';
import { dispatchMouseEvent as dispatchGlobalMouseEvent } from '../hooks/useMouse.js';
import { terminalHeightSignal, terminalWidthSignal } from '../hooks/useTerminalSize.js';
import { isFullscreenActive } from '../layout/FullscreenLayout.js';
import type { MouseContextValue } from '../providers/MouseProvider.js';
import {
  type RenderSettings,
  RenderSettingsProvider,
  setGlobalRenderSettings,
} from '../providers/RenderContext.js';
import { clearHitTestLayout, hitTestAll, setHitTestLayout } from '../utils/hit-test.js';
import { parseMouseEvent } from '../utils/mouse-parser.js';
import { renderToBuffer } from './layout-renderer.js';
import { clearDirtyFlags, setRenderContext } from './render-context.js';
import {
  type Renderer as BufferRenderer,
  ESC,
  createRenderer as createBufferRenderer,
  setDirtyTracker,
} from './renderer/index.js';
import type { TUINode, TUIStyle } from './types.js';
import { type LayoutMap, computeLayout } from './yoga-layout.js';

// ============================================================================
// Static Component Helpers
// ============================================================================

/**
 * Find all Static nodes in the tree.
 * @internal Exported for testing
 */
export function findStaticNodes(node: TUINode): TUINode[] {
  const result: TUINode[] = [];

  if (node.tagName === 'static') {
    result.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null && 'type' in child) {
        result.push(...findStaticNodes(child as TUINode));
      }
    }
  }

  return result;
}

/**
 * Get ANSI color code
 */
function getColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    grey: '\x1b[90m',
  };
  return colorMap[color.toLowerCase()] || '\x1b[37m';
}

/**
 * Apply text styling for static output
 */
function applyStaticTextStyle(text: string, style: TUIStyle = {}): string {
  if (!text) return '';

  let codes = '';
  let resetCodes = '';

  if (style.color) {
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`;
  }
  if (style.bold) {
    const bold = typeof style.bold === 'function' ? style.bold() : style.bold;
    if (bold) {
      codes += '\x1b[1m';
      resetCodes = `\x1b[22m${resetCodes}`;
    }
  }
  if (style.dim) {
    codes += '\x1b[2m';
    resetCodes = `\x1b[22m${resetCodes}`;
  }

  return codes + text + resetCodes;
}

/**
 * Get border characters for a style
 */
function getBorderChars(borderStyle: string): {
  h: string;
  v: string;
  tl: string;
  tr: string;
  bl: string;
  br: string;
} {
  const borders: Record<
    string,
    { h: string; v: string; tl: string; tr: string; bl: string; br: string }
  > = {
    single: { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' },
    double: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
    round: { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' },
    bold: { h: '━', v: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' },
    classic: { h: '-', v: '|', tl: '+', tr: '+', bl: '+', br: '+' },
  };
  return borders[borderStyle] || borders.single;
}

/**
 * Render a TUINode to a string for static output.
 * @internal Exported for testing
 */
export function renderNodeToString(node: TUINode | string, parentStyle: TUIStyle = {}): string {
  if (typeof node === 'string') {
    return applyStaticTextStyle(node, parentStyle);
  }

  if (!node || typeof node !== 'object') {
    return '';
  }

  const style = typeof node.style === 'function' ? node.style() : node.style || {};
  const mergedStyle = { ...parentStyle, ...style };

  // Text node - render children as styled text
  if (node.type === 'text') {
    return node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join('');
  }

  // Box or other container - render children
  if (node.children) {
    // Check flex direction
    const flexDirection =
      typeof style.flexDirection === 'function' ? style.flexDirection() : style.flexDirection;
    const isColumn = flexDirection === 'column';
    const separator = isColumn ? '\n' : '';

    let content = node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join(separator);

    // Handle border
    const borderStyle =
      typeof style.borderStyle === 'function' ? style.borderStyle() : style.borderStyle;

    if (borderStyle) {
      const borderColor =
        typeof style.borderColor === 'function' ? style.borderColor() : style.borderColor;
      const chars = getBorderChars(borderStyle as string);
      const colorCode = borderColor ? getColorCode(borderColor as string) : '';
      const resetCode = borderColor ? '\x1b[39m' : '';

      // Split content into lines
      const lines = content.split('\n');
      const maxLen = Math.max(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length), 0);

      // Build bordered output
      const topBorder = `${colorCode}${chars.tl}${chars.h.repeat(maxLen + 2)}${chars.tr}${resetCode}`;
      const bottomBorder = `${colorCode}${chars.bl}${chars.h.repeat(maxLen + 2)}${chars.br}${resetCode}`;
      const borderedLines = lines.map((line) => {
        const visibleLen = line.replace(/\x1b\[[0-9;]*m/g, '').length;
        const padding = ' '.repeat(maxLen - visibleLen);
        return `${colorCode}${chars.v}${resetCode} ${line}${padding} ${colorCode}${chars.v}${resetCode}`;
      });

      content = [topBorder, ...borderedLines, bottomBorder].join('\n');
    }

    return content;
  }

  return '';
}

/**
 * Process static nodes and print new items to stdout.
 * Returns the number of lines printed.
 * @internal Exported for testing
 */
export function processStaticNodes(rootNode: TUINode, isInlineMode: boolean): number {
  if (!isInlineMode) {
    // Static output only works in inline mode (scrollback)
    return 0;
  }

  const staticNodes = findStaticNodes(rootNode);
  let linesPrinted = 0;

  for (const staticNode of staticNodes) {
    const itemsGetter = staticNode.props?.__itemsGetter as (() => unknown[]) | undefined;
    const renderChild = staticNode.props?.__renderChild as
      | ((item: unknown, index: number) => TUINode | string)
      | undefined;
    const lastCount = (staticNode.props?.__lastRenderedCount as number) || 0;

    if (!itemsGetter || !renderChild) continue;

    const items = itemsGetter();
    const newCount = items?.length || 0;

    // Check for new items
    if (newCount > lastCount) {
      const newItems = items.slice(lastCount);

      // Move cursor to start of current UI area (we'll print above it)
      // Actually, for scrollback, we just print directly - the dynamic UI
      // will be re-rendered below
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        const index = lastCount + i;
        let rendered = renderChild(item, index);
        // Execute descriptor if needed (JSX returns descriptors)
        if (isDescriptor(rendered)) {
          rendered = executeDescriptor(rendered);
        }
        const content = renderNodeToString(rendered as TUINode);
        // Print to stdout directly (goes to scrollback)
        process.stdout.write(`${content}\n`);
        // Count actual lines (content may have newlines from borders/column layout)
        linesPrinted += content.split('\n').length;
      }

      // Update the rendered count
      if (staticNode.props) {
        staticNode.props.__lastRenderedCount = newCount;
      }
    }
  }

  return linesPrinted;
}

// ============================================================================
// Types
// ============================================================================

export interface TUIRendererOptions {
  /**
   * Initial terminal width (defaults to process.stdout.columns)
   */
  width?: number;

  /**
   * Initial terminal height (defaults to process.stdout.rows)
   */
  height?: number;

  /**
   * Enable synchronized output to prevent tearing
   * @default true
   */
  syncEnabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const INLINE_MAX_HEIGHT = 1000;

/** Maximum FPS for render loop (33ms = ~30 FPS) */
const MIN_FRAME_TIME_MS = 33;

// ============================================================================
// Mouse Registration
// ============================================================================

const mouseConsumers = new Set<string>();
let mouseEnabled = false;

function enableTerminalMouse() {
  if (!mouseEnabled) {
    process.stdout.write(ESC.enableMouse);
    process.stdout.write(ESC.enableMouseSGR);
    mouseEnabled = true;
  }
}

function disableTerminalMouse() {
  process.stdout.write(ESC.disableMouseSGR);
  process.stdout.write(ESC.disableMouse);
  mouseEnabled = false;
}

/**
 * Register interest in mouse events.
 */
export function registerMouseInterest(consumerId: string): () => void {
  mouseConsumers.add(consumerId);

  if (mouseConsumers.size === 1) {
    enableTerminalMouse();
  }

  return () => {
    mouseConsumers.delete(consumerId);
    if (mouseConsumers.size === 0) {
      disableTerminalMouse();
    }
  };
}

function forceDisableMouse() {
  mouseConsumers.clear();
  disableTerminalMouse();
}

// ============================================================================
// TUIRenderer Class
// ============================================================================

/**
 * Main TUI Renderer class.
 *
 * Manages the complete lifecycle of a TUI application:
 * 1. Terminal setup (raw mode, cursor hiding)
 * 2. Component tree creation
 * 3. Layout computation
 * 4. Rendering loop
 * 5. Input handling
 * 6. Cleanup on exit
 */
export class TUIRenderer {
  // State
  private isRunning = false;
  private terminalWidth: number;
  private terminalHeight: number;

  // Component tree
  private rootNode: TUINode | null = null;
  private settings: RenderSettings | null = null;

  // Layout
  private layoutMap: LayoutMap | null = null;
  private layoutDirty = false;
  private dirtyNodes = new Set<TUINode>();

  // Rendering
  private bufferRenderer: BufferRenderer | null = null;
  private updatePending = false;
  private lastMode: 'inline' | 'fullscreen' = 'inline';

  // FPS throttling
  private lastRenderTime = 0;
  private throttledUpdatePending = false;

  // Event handlers (stored for cleanup)
  private keyHandler: ((data: Buffer | string) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  // Console interception (stored for cleanup)
  private originalConsoleLog: typeof console.log | null = null;
  private originalConsoleError: typeof console.error | null = null;
  private originalConsoleWarn: typeof console.warn | null = null;
  private originalStdoutWrite: typeof process.stdout.write | null = null;
  private originalStderrWrite: typeof process.stderr.write | null = null;

  constructor(options: TUIRendererOptions = {}) {
    this.terminalWidth = options.width ?? process.stdout.columns ?? 80;
    this.terminalHeight = options.height ?? process.stdout.rows ?? 24;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Mount and start rendering a component.
   */
  async mount(createApp: () => unknown): Promise<void> {
    if (this.isRunning) {
      throw new Error('TUIRenderer is already running. Call unmount() first.');
    }

    this.isRunning = true;

    // Setup render settings
    this.settings = { fullscreen: signal(false) };
    setGlobalRenderSettings(this.settings);

    // Create buffer renderer
    this.bufferRenderer = createBufferRenderer({
      width: this.terminalWidth,
      height: this.terminalHeight,
      mode: this.getMode(),
      syncEnabled: true,
    });

    this.bufferRenderer.setRenderNodeFn((root, buffer, layoutMap, fullRender) => {
      renderToBuffer(root, buffer, layoutMap, fullRender);
    });

    setDirtyTracker(this.bufferRenderer.getDirtyTracker());

    // Create component tree
    this.rootNode = createRoot(() => {
      const app = createApp();
      return RenderSettingsProvider({
        get children() {
          return app;
        },
      });
    }) as TUINode;

    // Initial layout
    this.layoutMap = await computeLayout(this.rootNode, this.terminalWidth, this.getLayoutHeight());
    setHitTestLayout(this.layoutMap, this.rootNode);

    // Setup render context
    this.setupRenderContext();

    // Setup terminal
    this.setupTerminal();

    // Setup event handlers
    this.setupEventHandlers();

    // Setup console interception (prints console.log above dynamic UI)
    this.setupConsoleInterception();

    // Initial render
    await this.flushUpdates();
  }

  /**
   * Unmount and cleanup.
   */
  unmount(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Cleanup global state
    setGlobalRenderSettings(null);
    setRenderContext(null);
    setDirtyTracker(null);
    clearHitTestLayout();

    // Remove event handlers
    this.cleanupEventHandlers();

    // Restore console methods
    this.restoreConsole();

    // Restore terminal
    this.cleanupTerminal();

    // Clear references
    this.rootNode = null;
    this.layoutMap = null;
    this.bufferRenderer = null;
    this.settings = null;
  }

  // ==========================================================================
  // Private - Mode & Layout
  // ==========================================================================

  private getMode(): 'inline' | 'fullscreen' {
    return isFullscreenActive() ? 'fullscreen' : 'inline';
  }

  private getLayoutHeight(): number {
    return isFullscreenActive() ? this.terminalHeight : INLINE_MAX_HEIGHT;
  }

  // ==========================================================================
  // Private - Render Context
  // ==========================================================================

  private setupRenderContext(): void {
    setRenderContext({
      // biome-ignore lint/style/noNonNullAssertion: layoutMap is set before this is called
      layoutMap: this.layoutMap!,
      dirtyNodes: this.dirtyNodes,
      layoutDirty: false,
      scheduleUpdate: () => this.scheduleUpdate(),
      invalidateLayout: () => this.invalidateLayout(),
    });
  }

  private scheduleUpdate(): void {
    if (!this.updatePending) {
      this.updatePending = true;
      queueMicrotask(() => {
        this.updatePending = false;
        if (this.isRunning) this.throttledFlush();
      });
    }
  }

  /**
   * FPS-throttled flush.
   * Ensures we don't render faster than 30 FPS.
   */
  private throttledFlush(): void {
    const now = performance.now();
    const timeSinceLastRender = now - this.lastRenderTime;

    if (timeSinceLastRender >= MIN_FRAME_TIME_MS) {
      // Enough time has passed, render immediately
      this.lastRenderTime = now;
      this.flushUpdates();
    } else if (!this.throttledUpdatePending) {
      // Schedule render for next frame
      this.throttledUpdatePending = true;
      const delay = MIN_FRAME_TIME_MS - timeSinceLastRender;
      setTimeout(() => {
        this.throttledUpdatePending = false;
        if (this.isRunning) {
          this.lastRenderTime = performance.now();
          this.flushUpdates();
        }
      }, delay);
    }
    // If throttledUpdatePending is true, a render is already scheduled
  }

  private invalidateLayout(): void {
    this.layoutDirty = true;
    this.scheduleUpdate();
  }

  // ==========================================================================
  // Private - Flush Updates
  // ==========================================================================

  private async flushUpdates(): Promise<void> {
    if (!this.isRunning || !this.rootNode || !this.bufferRenderer) return;

    const currentMode = this.getMode();
    const dirtyTracker = this.bufferRenderer.getDirtyTracker();

    // Handle mode change
    if (currentMode !== this.lastMode) {
      this.bufferRenderer.switchMode(currentMode, this.terminalHeight);
      this.layoutDirty = true;
      this.lastMode = currentMode;
      dirtyTracker.markFullDirty();
    }

    // Recompute layout if dirty
    if (this.layoutDirty) {
      this.layoutMap = await computeLayout(
        this.rootNode,
        this.terminalWidth,
        this.getLayoutHeight(),
      );
      setHitTestLayout(this.layoutMap, this.rootNode);

      dirtyTracker.updateNodeRegions(this.layoutMap);

      setRenderContext({
        layoutMap: this.layoutMap,
        dirtyNodes: this.dirtyNodes,
        layoutDirty: false,
        scheduleUpdate: () => this.scheduleUpdate(),
        invalidateLayout: () => this.invalidateLayout(),
      });

      this.layoutDirty = false;
      dirtyTracker.markFullDirty();
    }

    // Process Static nodes - print new items to scrollback (inline mode only)
    // This must happen BEFORE the main render so static content appears above dynamic UI
    const isInlineMode = !isFullscreenActive();

    // Check if there are new static items to print
    const staticItemCount = this.countNewStaticItems();
    if (staticItemCount > 0 && isInlineMode) {
      // Clear current UI first, then print static content
      // This ensures clean scrollback without visual artifacts
      this.bufferRenderer.clearCurrentContent();
    }

    const staticLinesPrinted = processStaticNodes(this.rootNode, isInlineMode);

    // If static content was printed, reset cursor tracking so we don't clear the static content
    if (staticLinesPrinted > 0) {
      this.bufferRenderer.resetCursorForStaticContent(staticLinesPrinted);
    }

    // Render
    // For inline mode, let renderer calculate content height from buffer (finds last non-empty line)
    // For fullscreen mode, use layout height
    const rootLayout = this.layoutMap?.get(this.rootNode);
    const contentHeight = isFullscreenActive()
      ? rootLayout
        ? Math.ceil(rootLayout.height)
        : undefined
      : undefined;
    // biome-ignore lint/style/noNonNullAssertion: layoutMap is guaranteed non-null after initial layout
    this.bufferRenderer.render(this.rootNode, this.layoutMap!, contentHeight);

    // Clear dirty flags
    clearDirtyFlags();
  }

  // ==========================================================================
  // Private - Static Content Helpers
  // ==========================================================================

  /**
   * Count new static items that need to be printed.
   */
  private countNewStaticItems(): number {
    if (!this.rootNode) return 0;

    const staticNodes = findStaticNodes(this.rootNode);
    let count = 0;

    for (const staticNode of staticNodes) {
      const itemsGetter = staticNode.props?.__itemsGetter as (() => unknown[]) | undefined;
      const lastCount = (staticNode.props?.__lastRenderedCount as number) || 0;

      if (!itemsGetter) continue;

      const items = itemsGetter();
      const newCount = items?.length || 0;

      if (newCount > lastCount) {
        count += newCount - lastCount;
      }
    }

    return count;
  }

  // ==========================================================================
  // Private - Console Interception
  // ==========================================================================

  /**
   * Intercept console.log/error/warn to print above dynamic UI.
   * This ensures all non-managed output goes to scrollback.
   */
  private setupConsoleInterception(): void {
    // Only intercept in inline mode
    if (isFullscreenActive()) return;

    // Store originals
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.originalStderrWrite = process.stderr.write.bind(process.stderr);

    // Helper to write above dynamic UI
    const writeAboveUI = (message: string) => {
      if (!this.isRunning || !this.bufferRenderer) {
        // Not running, use original
        this.originalStdoutWrite?.(message);
        return;
      }

      // Clear current UI, write message, re-render
      this.bufferRenderer.clearCurrentContent();
      this.originalStdoutWrite?.(`${message}\n`);
      this.bufferRenderer.resetCursorForStaticContent(1);
      this.scheduleUpdate();
    };

    // Intercept console.log
    console.log = (...args: unknown[]) => {
      const message = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      writeAboveUI(message);
    };

    // Intercept console.error
    console.error = (...args: unknown[]) => {
      const message = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      writeAboveUI(`\x1b[31m${message}\x1b[39m`); // Red color
    };

    // Intercept console.warn
    console.warn = (...args: unknown[]) => {
      const message = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      writeAboveUI(`\x1b[33m${message}\x1b[39m`); // Yellow color
    };
    process.stdout.write = ((
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
      callback?: (err?: Error) => void,
    ): boolean => {
      const str = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);

      // Check if this is from our renderer (contains escape sequences we use)
      // Skip interception for sync markers and cursor movements
      if (
        str.includes('\x1b[?2026') || // Sync markers
        str.includes('\x1b[?25') || // Cursor show/hide
        (str.includes('\x1b[') &&
          (str.includes('H') || str.includes('K') || str.includes('A') || str.includes('B'))) // Cursor movement/clear
      ) {
        return this.originalStdoutWrite?.(chunk, encodingOrCallback as BufferEncoding, callback);
      }

      // External stdout write - print above UI
      if (this.isRunning && this.bufferRenderer && str.trim()) {
        this.bufferRenderer.clearCurrentContent();
        this.originalStdoutWrite?.(chunk, encodingOrCallback as BufferEncoding, callback);
        this.bufferRenderer.resetCursorForStaticContent(str.split('\n').length);
        this.scheduleUpdate();
        return true;
      }

      return this.originalStdoutWrite?.(chunk, encodingOrCallback as BufferEncoding, callback);
    }) as typeof process.stdout.write;
  }

  /**
   * Restore original console methods.
   */
  private restoreConsole(): void {
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
      this.originalConsoleLog = null;
    }
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
      this.originalConsoleWarn = null;
    }
    if (this.originalStdoutWrite) {
      process.stdout.write = this.originalStdoutWrite;
      this.originalStdoutWrite = null;
    }
    if (this.originalStderrWrite) {
      process.stderr.write = this.originalStderrWrite;
      this.originalStderrWrite = null;
    }
  }

  // ==========================================================================
  // Private - Terminal Setup
  // ==========================================================================

  private setupTerminal(): void {
    // Enable raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    // Always resume and set encoding to keep process alive
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    // Ensure stdin keeps the process alive (ref() is default, but explicit is safer)
    if (typeof process.stdin.ref === 'function') {
      process.stdin.ref();
    }

    // Hide cursor
    process.stdout.write(ESC.hideCursor);
  }

  private cleanupTerminal(): void {
    // Exit alternate screen if in fullscreen
    if (isFullscreenActive()) {
      process.stdout.write(ESC.exitAltScreen);
    }

    // Disable mouse
    forceDisableMouse();

    // Show cursor
    process.stdout.write(ESC.showCursor);

    // Renderer cleanup (cursor positioning for inline mode)
    this.bufferRenderer?.cleanup();

    // Restore stdin
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  // ==========================================================================
  // Private - Event Handlers
  // ==========================================================================

  private setupEventHandlers(): void {
    // Keyboard/Mouse input
    this.keyHandler = (data: Buffer | string) => {
      if (!this.isRunning) return;

      const key = typeof data === 'string' ? data : data.toString('utf8');

      // Mouse events
      const mouseEvent = parseMouseEvent(key);
      if (mouseEvent) {
        this.handleMouseEvent(mouseEvent);
        return;
      }

      // Ctrl+C / q to exit
      if (key === '\u0003' || key === 'q' || key === 'Q') {
        this.emergencyCleanup();
        this.unmount();
        process.exit(key === '\u0003' ? 130 : 0);
      }

      // Dispatch to useInput handlers
      dispatchInput(key);
      this.scheduleUpdate();
    };

    process.stdin.on('data', this.keyHandler);

    // Resize
    this.resizeHandler = () => {
      const newWidth = process.stdout.columns || 80;
      const newHeight = process.stdout.rows || 24;

      if (newWidth === this.terminalWidth && newHeight === this.terminalHeight) return;

      this.terminalWidth = newWidth;
      this.terminalHeight = newHeight;

      terminalWidthSignal.value = newWidth;
      terminalHeightSignal.value = newHeight;

      this.bufferRenderer?.resize(newWidth, newHeight);

      if (isFullscreenActive()) {
        process.stdout.write(ESC.clearScreen);
        process.stdout.write(ESC.cursorHome);
      }

      this.layoutDirty = true;
      this.scheduleUpdate();
    };

    if (process.stdout.isTTY) {
      process.stdout.on('resize', this.resizeHandler);
    }

    // Process exit handlers
    process.on('exit', () => this.handleExit());
    process.on('SIGINT', () => this.handleSignal(130));
    process.on('SIGTERM', () => this.handleSignal(143));
    process.on('uncaughtException', () => {
      this.emergencyCleanup();
      this.unmount();
      process.exit(1);
    });

    // Keepalive interval - ensures process doesn't exit when stdin closes
    // This is needed because stdin may close in non-TTY environments
    this.keepaliveInterval = setInterval(
      () => {
        // Empty interval just to keep the event loop alive
      },
      1000 * 60 * 60,
    ); // 1 hour (effectively infinite)
  }

  private cleanupEventHandlers(): void {
    if (this.keyHandler) {
      process.stdin.removeListener('data', this.keyHandler);
      this.keyHandler = null;
    }

    if (this.resizeHandler && process.stdout.isTTY) {
      process.stdout.removeListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  // ==========================================================================
  // Private - Mouse Handling
  // ==========================================================================

  private handleMouseEvent(mouseEvent: ReturnType<typeof parseMouseEvent>): void {
    if (!mouseEvent || !this.rootNode) return;

    const hits = hitTestAll(mouseEvent.x, mouseEvent.y);
    const mouseContext = this.findMouseContext(hits);

    if (mouseContext) {
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i];
        const mouseId = hit.node.props?.__mouseId as string | undefined;
        if (mouseId) {
          mouseContext.dispatchMouseEvent(mouseEvent, hit.node, hit.localX, hit.localY);
        }
      }
    }

    dispatchGlobalMouseEvent(mouseEvent);

    const hit = hits.length > 0 ? hits[hits.length - 1] : null;
    if (mouseEvent.type === 'mouseup' && hit?.node.props?.onClick) {
      hit.node.props.onClick({
        x: mouseEvent.x,
        y: mouseEvent.y,
        localX: hit.localX,
        localY: hit.localY,
        button: mouseEvent.button,
        ctrl: mouseEvent.ctrl,
        shift: mouseEvent.shift,
        meta: mouseEvent.meta,
      });
    }

    this.scheduleUpdate();
  }

  private findMouseContext(hits: Array<{ node: TUINode }>): MouseContextValue | null {
    for (const hit of hits) {
      const ctx = hit.node.props?.__mouseContext as MouseContextValue | undefined;
      if (ctx) return ctx;
    }
    return null;
  }

  // ==========================================================================
  // Private - Exit Handling
  // ==========================================================================

  private emergencyCleanup(): void {
    // Only exit alternate screen if in fullscreen mode
    const exitAlt = isFullscreenActive() ? ESC.exitAltScreen : '';
    process.stdout.write(ESC.disableMouseSGR + ESC.disableMouse + ESC.showCursor + exitAlt);
  }

  private handleExit(): void {
    this.emergencyCleanup();
    this.unmount();
  }

  private handleSignal(exitCode: number): void {
    this.emergencyCleanup();
    this.unmount();
    process.exit(exitCode);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a TUI renderer instance.
 */
export function createTUIRenderer(options?: TUIRendererOptions): TUIRenderer {
  return new TUIRenderer(options);
}

// ============================================================================
// Simple render() API - mirrors @zen/web
// ============================================================================

/**
 * Render a TUI application.
 *
 * This is the main entry point for TUI apps, mirroring @zen/web's API:
 * - Web: render(component, container)
 * - TUI: render(component)
 *
 * @example
 * ```tsx
 * import { render } from '@zen/tui';
 *
 * // Simple inline app
 * const cleanup = await render(() => <App />);
 *
 * // Fullscreen app
 * const cleanup = await render(() => (
 *   <FullscreenLayout>
 *     <App />
 *   </FullscreenLayout>
 * ));
 *
 * // Cleanup when done
 * cleanup();
 * ```
 */
export async function render(
  createApp: () => unknown,
  options?: TUIRendererOptions,
): Promise<() => void> {
  const renderer = new TUIRenderer(options);
  await renderer.mount(createApp);
  return () => renderer.unmount();
}
