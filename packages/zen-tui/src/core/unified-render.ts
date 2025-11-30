/**
 * Unified Render API
 *
 * Single entry point for rendering TUI apps with dual renderer architecture.
 * Supports both inline mode (unlimited height) and fullscreen mode (terminal-constrained).
 *
 * @example
 * ```tsx
 * import { render } from '@zen/tui';
 *
 * // Inline mode (default) - unlimited content height
 * render(() => <App />);
 *
 * // Fullscreen mode - uses alternate screen buffer
 * render(() => (
 *   <FullscreenLayout>
 *     <App />
 *   </FullscreenLayout>
 * ));
 * ```
 *
 * @see ADR-001 for architecture details
 */

import { createRoot, signal } from '@zen/signal';
import stripAnsi from 'strip-ansi';
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
import { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode } from './types.js';
import { type LayoutMap, computeLayout } from './yoga-layout.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum height for inline mode.
 * This allows inline apps to render content of any practical size.
 * Terminal will naturally scroll to accommodate.
 */
const INLINE_MAX_HEIGHT = 1000;

// ============================================================================
// Mouse Registration (Reference Counting)
// ============================================================================

const mouseConsumers = new Set<string>();
let mouseEnabled = false;

function enableTerminalMouse() {
  if (!mouseEnabled) {
    process.stdout.write('\x1b[?1000h'); // Enable mouse tracking
    process.stdout.write('\x1b[?1006h'); // Enable SGR extended mode
    mouseEnabled = true;
  }
}

function disableTerminalMouse() {
  // Always write disable sequences - terminal ignores if not enabled
  // This ensures cleanup even if state tracking is wrong
  process.stdout.write('\x1b[?1006l'); // Disable SGR extended mode
  process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
  mouseEnabled = false;
}

/**
 * Register interest in mouse events.
 * Mouse tracking is enabled when first consumer registers,
 * and disabled when last consumer unregisters.
 *
 * @param consumerId - Unique identifier for this consumer
 * @returns Cleanup function to unregister
 */
export function registerMouseInterest(consumerId: string): () => void {
  mouseConsumers.add(consumerId);

  // Enable mouse if this is the first consumer
  if (mouseConsumers.size === 1) {
    enableTerminalMouse();
  }

  // Return cleanup function
  return () => {
    mouseConsumers.delete(consumerId);

    // Disable mouse if no more consumers
    if (mouseConsumers.size === 0) {
      disableTerminalMouse();
    }
  };
}

/**
 * Force disable mouse tracking (used by renderer cleanup)
 */
function forceDisableMouse() {
  mouseConsumers.clear();
  disableTerminalMouse();
}

/**
 * Find MouseProvider context by walking up from hit results
 */
function findMouseContext(hits: Array<{ node: TUINode }>): MouseContextValue | null {
  for (const hit of hits) {
    const ctx = hit.node.props?.__mouseContext as MouseContextValue | undefined;
    if (ctx) {
      return ctx;
    }
  }
  return null;
}

/**
 * Render a TUI app to the terminal
 *
 * Uses dual renderer architecture:
 * - Inline mode (default): Unlimited content height, clear+rewrite updates
 * - Fullscreen mode: Terminal-constrained, fine-grained diff updates
 *
 * @param createApp - Function that returns the root component
 * @returns Cleanup function
 */
export async function render(createApp: () => unknown): Promise<() => void> {
  // Create render settings that components will update
  const settings: RenderSettings = {
    fullscreen: signal(false),
  };

  setGlobalRenderSettings(settings);

  let isRunning = true;
  let terminalWidth = process.stdout.columns || 80;
  let terminalHeight = process.stdout.rows || 24;

  // ============================================================================
  // Buffer Setup
  // ============================================================================
  // We use different buffer heights for inline vs fullscreen mode:
  // - Inline: Large buffer (INLINE_MAX_HEIGHT) to support unlimited content
  // - Fullscreen: Buffer sized to terminal (terminalHeight)
  //
  // The actual buffer height is determined by checking isFullscreenActive()
  // which is set by FullscreenLayout component.

  const getBufferHeight = () => (isFullscreenActive() ? terminalHeight : INLINE_MAX_HEIGHT);

  let currentBuffer = new TerminalBuffer(terminalWidth, getBufferHeight());
  let previousBuffer = new TerminalBuffer(terminalWidth, getBufferHeight());

  // Track actual content height for inline mode cursor management
  let actualContentHeight = 0;

  // Create component tree with settings provider
  const node = createRoot(() => {
    const app = createApp();

    // Wrap with settings provider
    return RenderSettingsProvider({
      get children() {
        return app;
      },
    });
  }) as TUINode;

  // ============================================================================
  // Layout State
  // ============================================================================

  // Layout height constraint depends on mode
  const getLayoutHeight = () => (isFullscreenActive() ? terminalHeight : INLINE_MAX_HEIGHT);

  let layoutMap = await computeLayout(node, terminalWidth, getLayoutHeight());
  setHitTestLayout(layoutMap, node);

  const dirtyNodes = new Set<TUINode>();
  let layoutDirty = false;
  let isFirstRender = true;
  let updatePending = false;
  let lastMode: 'inline' | 'fullscreen' = 'inline';

  /**
   * Schedule an update flush.
   */
  const scheduleUpdate = () => {
    if (!updatePending) {
      updatePending = true;
      queueMicrotask(() => {
        updatePending = false;
        if (isRunning) flushUpdates();
      });
    }
  };

  /**
   * Invalidate layout - triggers full Yoga recomputation on next flush.
   */
  const invalidateLayout = () => {
    layoutDirty = true;
    scheduleUpdate();
  };

  // Set up render context
  setRenderContext({
    layoutMap,
    dirtyNodes,
    layoutDirty,
    scheduleUpdate,
    invalidateLayout,
  });

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor
  process.stdout.write('\x1b[?25l');

  // ============================================================================
  // Flush Updates
  // ============================================================================

  const flushUpdates = async () => {
    if (!isRunning) return;

    const inFullscreen = isFullscreenActive();
    const currentMode = inFullscreen ? 'fullscreen' : 'inline';

    // Check for mode change
    if (currentMode !== lastMode) {
      // Mode changed - resize buffers and force full re-render
      const newBufferHeight = getBufferHeight();
      currentBuffer = new TerminalBuffer(terminalWidth, newBufferHeight);
      previousBuffer = new TerminalBuffer(terminalWidth, newBufferHeight);
      layoutDirty = true;
      isFirstRender = true;
      lastMode = currentMode;
    }

    // Phase 1: Layout (recompute if dirty)
    const needsLayoutRecompute = layoutDirty;

    if (needsLayoutRecompute) {
      layoutMap = await computeLayout(node, terminalWidth, getLayoutHeight());
      setHitTestLayout(layoutMap, node);

      setRenderContext({
        layoutMap,
        dirtyNodes,
        layoutDirty: false,
        scheduleUpdate,
        invalidateLayout,
      });

      layoutDirty = false;
    }

    // Phase 2: Render to buffer
    // For inline mode: ALWAYS do full render (clear buffer) because we use clear+rewrite strategy
    // The incremental rendering optimization only benefits fullscreen mode with fine-grained updates
    // For fullscreen mode: Use incremental render when possible for better performance
    const fullRender = isFirstRender || needsLayoutRecompute || !inFullscreen;
    renderToBuffer(node, currentBuffer, layoutMap, fullRender);

    if (isFirstRender) {
      isFirstRender = false;
    }

    // Phase 3: Generate output
    let output = currentBuffer.renderFull();
    let newLines = output.split('\n');

    // For inline mode, trim trailing empty lines
    // Save previous height for clearing BEFORE updating actualContentHeight
    const previousContentHeight = actualContentHeight;

    if (!inFullscreen) {
      let lastContentLine = newLines.length - 1;
      while (lastContentLine >= 0) {
        const stripped = stripAnsi(newLines[lastContentLine]);
        if (stripped.trim() !== '') break;
        lastContentLine--;
      }
      const contentHeight = Math.max(1, lastContentLine + 1);
      newLines = newLines.slice(0, contentHeight);
      output = newLines.join('\n');
    }

    const newOutputHeight = newLines.length;

    // Phase 4: Output to terminal
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0 || previousContentHeight !== newOutputHeight) {
      if (inFullscreen) {
        // ====================================================================
        // FULLSCREEN MODE: Fine-grained line updates
        // ====================================================================
        for (const change of changes) {
          const row = change.y + 1; // Convert to 1-indexed
          process.stdout.write(`\x1b[${row};1H\x1b[2K${change.line}`);
        }
      } else {
        // ====================================================================
        // INLINE MODE: Clear and rewrite
        // ====================================================================
        // Clear previous content using PREVIOUS height (not new height)
        // This ensures we clear all old content when content shrinks
        if (previousContentHeight > 0) {
          process.stdout.write('\r');
          for (let i = 0; i < previousContentHeight; i++) {
            process.stdout.write('\x1b[2K');
            if (i < previousContentHeight - 1) {
              process.stdout.write('\x1b[1B\r');
            }
          }
          // Move back to top
          if (previousContentHeight > 1) {
            process.stdout.write(`\x1b[${previousContentHeight - 1}A`);
          }
          process.stdout.write('\r');
        }

        // Write new output
        process.stdout.write(output);

        // Move cursor back to top for next render
        if (newLines.length > 1) {
          process.stdout.write(`\x1b[${newLines.length - 1}A`);
        }
        process.stdout.write('\r');
      }
    }

    // Always update actualContentHeight for inline mode
    // This ensures cleanup uses the correct current height, not a stale value
    if (!inFullscreen) {
      actualContentHeight = newOutputHeight;
    }

    // Phase 5: Update diff buffer
    for (const change of changes) {
      previousBuffer.setLine(change.y, change.line);
    }

    // Phase 6: Clear dirty flags
    clearDirtyFlags();
  };

  // Initial render
  await flushUpdates();

  // ============================================================================
  // Terminal Resize Handler
  // ============================================================================

  const handleResize = () => {
    const newWidth = process.stdout.columns || 80;
    const newHeight = process.stdout.rows || 24;

    if (newWidth === terminalWidth && newHeight === terminalHeight) return;

    terminalWidth = newWidth;
    terminalHeight = newHeight;

    terminalWidthSignal.value = newWidth;
    terminalHeightSignal.value = newHeight;

    // Resize buffers
    const newBufferHeight = getBufferHeight();
    currentBuffer.resize(terminalWidth, newBufferHeight);
    previousBuffer.resize(terminalWidth, newBufferHeight);
    previousBuffer.clear();

    // Clear screen in fullscreen mode
    if (isFullscreenActive()) {
      process.stdout.write('\x1b[2J');
      process.stdout.write('\x1b[H');
    }

    layoutDirty = true;

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  if (process.stdout.isTTY) {
    process.stdout.on('resize', handleResize);
  }

  // ============================================================================
  // Input Handler
  // ============================================================================

  const keyHandler = (data: Buffer | string) => {
    const key = typeof data === 'string' ? data : data.toString('utf8');

    // Mouse events
    const mouseEvent = parseMouseEvent(key);
    if (mouseEvent) {
      const hits = hitTestAll(mouseEvent.x, mouseEvent.y);
      const mouseContext = findMouseContext(hits);

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

      queueMicrotask(() => {
        if (isRunning) flushUpdates();
      });
      return;
    }

    // Ctrl+C to exit
    if (key === '\u0003') {
      process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h');
      cleanup();
      process.exit(0);
    }

    // q to quit
    if (key === 'q' || key === 'Q') {
      process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h');
      cleanup();
      process.exit(0);
    }

    dispatchInput(key);

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  process.stdin.on('data', keyHandler);

  // ============================================================================
  // Cleanup
  // ============================================================================

  const cleanup = () => {
    if (!isRunning) return;
    isRunning = false;
    setGlobalRenderSettings(null);
    setRenderContext(null);
    clearHitTestLayout();

    if (process.stdout.isTTY) {
      process.stdout.off('resize', handleResize);
    }

    // Exit alternate screen if in fullscreen
    if (isFullscreenActive()) {
      process.stdout.write('\x1b[?1049l');
    }

    forceDisableMouse();
    process.stdout.write('\x1b[?25h');

    // Move cursor below content (inline mode only)
    if (!isFullscreenActive() && actualContentHeight > 0) {
      // Move to bottom of content
      if (actualContentHeight > 1) {
        process.stdout.write(`\x1b[${actualContentHeight - 1}B`);
      }
      process.stdout.write('\n');
    }

    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  // ============================================================================
  // Exit Handlers
  // ============================================================================

  const handleExit = () => {
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
  };

  const handleSignal = (sig: string) => () => {
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
    process.exit(sig === 'SIGINT' ? 130 : 143);
  };

  process.on('exit', handleExit);
  process.on('SIGINT', handleSignal('SIGINT'));
  process.on('SIGTERM', handleSignal('SIGTERM'));
  process.on('uncaughtException', (_err) => {
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
    process.exit(1);
  });

  return cleanup;
}
