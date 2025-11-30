/**
 * Unified Render API
 *
 * Single entry point for rendering TUI apps.
 * Behavior controlled by components (FullscreenLayout, MouseProvider),
 * not render options.
 *
 * @example
 * ```tsx
 * import { render } from '@zen/tui';
 *
 * // Inline mode (default)
 * render(() => <App />);
 *
 * // Fullscreen with mouse - controlled by components
 * render(() => (
 *   <FullscreenLayout>
 *     <MouseProvider>
 *       <App />
 *     </MouseProvider>
 *   </FullscreenLayout>
 * ));
 * ```
 */

import { createRoot, effect, signal } from '@zen/signal';
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
 *
 * @example
 * ```tsx
 * onMount(() => {
 *   const cleanup = registerMouseInterest('my-component');
 *   onCleanup(cleanup);
 * });
 * ```
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
  // hits are in root-to-leaf order, check from root first
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
 * @param createApp - Function that returns the root component
 * @returns Cleanup function
 *
 * @example
 * ```tsx
 * const cleanup = render(() => <App />);
 * // Later: cleanup() to exit
 * ```
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

  // Terminal buffers for diff-based updates
  const currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  const previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Track output height for cursor management (inline mode)
  let lastOutputHeight = 0;

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
  // Layout is computed once and cached. Only recomputed when:
  // - Terminal resizes
  // - Structure changes (nodes added/removed)
  // - Size-affecting style changes
  //
  // This is the key to fine-grained updates: layout is expensive,
  // so we skip it when only content changes.
  let layoutMap = await computeLayout(node, terminalWidth, terminalHeight);
  setHitTestLayout(layoutMap, node);

  // ============================================================================
  // Fine-Grained Update State
  // ============================================================================
  // These track what needs updating between flushes:
  // - dirtyNodes: nodes whose content changed (need buffer update)
  // - layoutDirty: whether layout needs recomputing
  // - updatePending: whether a flush is already scheduled
  // - isFirstRender: track first render to avoid double layout computation
  //
  // NOTE: layoutDirty starts FALSE because we already computed layout above.
  // isFirstRender tracks that we need a full render (clear buffer) on first flush.
  const dirtyNodes = new Set<TUINode>();
  let layoutDirty = false; // Start false - layout already computed above
  let isFirstRender = true; // Track first render for full buffer clear
  let updatePending = false;

  /**
   * Schedule an update flush.
   * Uses queueMicrotask to batch multiple signal changes into one flush.
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
   * Called when structure changes or size-affecting styles change.
   */
  const invalidateLayout = () => {
    layoutDirty = true;
    scheduleUpdate();
  };

  // Set up render context for fine-grained updates
  // This context is accessed by jsx-runtime when effects run
  setRenderContext({
    layoutMap,
    dirtyNodes,
    layoutDirty,
    scheduleUpdate,
    invalidateLayout,
  });

  // NOTE: Fullscreen mode is managed by FullscreenLayout component directly
  // via onMount/onCleanup. No need for settings-based tracking here.
  // Use isFullscreenActive() to check the current fullscreen state.

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor
  process.stdout.write('\x1b[?25l');

  // ============================================================================
  // Flush Updates - Fine-Grained Rendering
  // ============================================================================
  // This is where fine-grained reactivity pays off:
  //
  // 1. Layout only recomputed if layoutDirty (structural changes)
  // 2. Buffer rendering skips non-dirty nodes (incremental mode)
  // 3. Terminal diff outputs only changed lines
  // 4. Diff buffer updated line-by-line (not full swap)
  //
  // Result: Signal changes update only affected terminal cells.
  const flushUpdates = async () => {
    if (!isRunning) return;

    // ========================================================================
    // Phase 1: Layout (skip if only content changed)
    // ========================================================================
    // Layout computation is expensive (Yoga flexbox algorithm).
    // We skip it when only content changed (not structure/size).
    //
    // When layout IS dirty:
    // - Recompute Yoga layout
    // - Update layoutMap
    // - Mark all nodes as needing re-render (positions may have changed)
    //
    // NOTE: On first render, layout is already computed (line 177), so we
    // skip recomputation but still do a full render.
    const needsLayoutRecompute = layoutDirty;

    if (needsLayoutRecompute) {
      // Recompute layout
      layoutMap = await computeLayout(node, terminalWidth, terminalHeight);
      setHitTestLayout(layoutMap, node);

      // Update render context with new layoutMap
      setRenderContext({
        layoutMap,
        dirtyNodes,
        layoutDirty: false, // Reset after recompute
        scheduleUpdate,
        invalidateLayout,
      });

      // Reset layout dirty flag
      layoutDirty = false;
    }

    // ========================================================================
    // Phase 2: Render to buffer
    // ========================================================================
    // Full render mode (clear buffer, render all):
    // - First render (isFirstRender)
    // - Layout changed (needsLayoutRecompute)
    //
    // Incremental render mode (preserve buffer, render dirty only):
    // - Content-only changes (no layout change, not first render)
    const fullRender = isFirstRender || needsLayoutRecompute;
    renderToBuffer(node, currentBuffer, layoutMap, fullRender);

    // Clear first render flag after first render
    if (isFirstRender) {
      isFirstRender = false;
    }

    // ========================================================================
    // Phase 3: Terminal diff and output
    // ========================================================================
    // Compare current buffer with previous buffer.
    // Only output lines that actually changed.
    let output = currentBuffer.renderFull();
    let newLines = output.split('\n');

    // In inline mode, trim trailing empty lines to avoid filling the terminal
    // This is the key difference between inline and fullscreen mode:
    // - Fullscreen: Uses full terminal height (alternate screen buffer)
    // - Inline: Only uses lines with actual content
    const inFullscreen = isFullscreenActive();
    if (!inFullscreen) {
      // Find the last non-empty line (use stripAnsi to ignore ANSI codes)
      let lastContentLine = newLines.length - 1;
      while (lastContentLine >= 0) {
        const stripped = stripAnsi(newLines[lastContentLine]);
        if (stripped.trim() !== '') break;
        lastContentLine--;
      }
      // Keep at least one line
      const contentHeight = Math.max(1, lastContentLine + 1);
      newLines = newLines.slice(0, contentHeight);
      output = newLines.join('\n');
    }

    const newOutputHeight = newLines.length;

    // Diff buffers to find changed lines
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0 || lastOutputHeight !== newOutputHeight) {
      if (inFullscreen) {
        // ========================================================================
        // FULLSCREEN MODE: Fine-grained line updates
        // ========================================================================
        // In fullscreen mode (alternate screen buffer), we can use ANSI cursor
        // positioning to update ONLY the changed lines. This is the key to
        // fine-grained reactivity - a signal change that affects one line only
        // outputs that one line to the terminal.
        //
        // ANSI escape codes:
        // - \x1b[{row};1H = move cursor to row (1-indexed), column 1
        // - \x1b[2K = clear entire line
        //
        // NOTE: Terminal rows are 1-indexed, buffer rows are 0-indexed
        for (const change of changes) {
          const row = change.y + 1; // Convert to 1-indexed
          process.stdout.write(`\x1b[${row};1H\x1b[2K${change.line}`);
        }
      } else {
        // ========================================================================
        // INLINE MODE: Full redraw (legacy behavior)
        // ========================================================================
        // In inline mode, we don't have the alternate screen buffer, so we
        // need to clear and redraw. This is less efficient but necessary for
        // apps that render within the normal terminal flow.
        if (lastOutputHeight > 0) {
          process.stdout.write('\r');
          for (let i = 0; i < lastOutputHeight; i++) {
            process.stdout.write('\x1b[2K');
            if (i < lastOutputHeight - 1) {
              process.stdout.write('\x1b[1B\r');
            }
          }
          for (let i = 0; i < lastOutputHeight - 1; i++) {
            process.stdout.write('\x1b[1A');
          }
          process.stdout.write('\r');
        }

        // Write new output
        process.stdout.write(output);

        // Move cursor back to top (inline mode)
        const lines = output.split('\n');
        if (lines.length > 1) {
          for (let i = 0; i < lines.length - 1; i++) {
            process.stdout.write('\x1b[1A');
          }
        }
        process.stdout.write('\r');
      }

      lastOutputHeight = newOutputHeight;
    }

    // ========================================================================
    // Phase 4: Update diff buffer with changed lines only
    // ========================================================================
    // Instead of swapping entire buffers, we copy only changed lines.
    // This is more efficient and maintains buffer identity.
    for (const change of changes) {
      previousBuffer.setLine(change.y, change.line);
    }

    // ========================================================================
    // Phase 5: Clear dirty flags
    // ========================================================================
    // Reset dirty state for next frame
    clearDirtyFlags();
  };

  // Initial render
  await flushUpdates();

  // ============================================================================
  // Terminal Resize Handler
  // ============================================================================
  // On resize, we need to:
  // 1. Update terminal dimensions
  // 2. Resize buffers
  // 3. Mark layout as dirty (positions need recalculation)
  // 4. Clear previous buffer (content positions changed)
  // 5. Trigger full re-render
  const handleResize = () => {
    const newWidth = process.stdout.columns || 80;
    const newHeight = process.stdout.rows || 24;

    // Skip if dimensions unchanged
    if (newWidth === terminalWidth && newHeight === terminalHeight) return;

    // Update local dimensions
    terminalWidth = newWidth;
    terminalHeight = newHeight;

    // CRITICAL: Also update global signals so components using useTerminalSize get updated
    // This ensures consistency between render system and component hooks
    terminalWidthSignal.value = newWidth;
    terminalHeightSignal.value = newHeight;

    // Resize buffers
    currentBuffer.resize(terminalWidth, terminalHeight);
    previousBuffer.resize(terminalWidth, terminalHeight);
    previousBuffer.clear(); // Clear diff buffer - all positions changed

    // Clear screen in fullscreen mode
    if (isFullscreenActive()) {
      process.stdout.write('\x1b[2J');
      process.stdout.write('\x1b[H');
    }

    // Mark layout as dirty - this triggers full Yoga recompute
    // and full buffer re-render on next flush
    layoutDirty = true;

    // Schedule update
    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  if (process.stdout.isTTY) {
    process.stdout.on('resize', handleResize);
  }

  // Input handler
  const keyHandler = (data: Buffer | string) => {
    // Convert Buffer to string if needed (stdin emits Buffer by default)
    const key = typeof data === 'string' ? data : data.toString('utf8');

    // Try mouse event first - always try to parse, as MouseProvider may enable mouse independently
    const mouseEvent = parseMouseEvent(key);
    if (mouseEvent) {
      // Hit test - get all nodes from root to deepest hit
      const hits = hitTestAll(mouseEvent.x, mouseEvent.y);

      // Find MouseProvider context and dispatch to composable system
      const mouseContext = findMouseContext(hits);

      if (mouseContext) {
        // Find ALL nodes with __mouseId in the hit chain (from deepest to root)
        // and dispatch to each - this allows nested Pressable/Hoverable to work
        for (let i = hits.length - 1; i >= 0; i--) {
          const hit = hits[i];
          const mouseId = hit.node.props?.__mouseId as string | undefined;
          if (mouseId) {
            mouseContext.dispatchMouseEvent(mouseEvent, hit.node, hit.localX, hit.localY);
          }
        }
      }

      // Legacy: dispatch to global useMouse handlers
      dispatchGlobalMouseEvent(mouseEvent);

      // Legacy: auto-dispatch onClick for backward compatibility
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
      // Write escape sequences directly first
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

    // Dispatch to useInput handlers
    dispatchInput(key);

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  // Always register input handler (isTTY may be undefined in some environments)
  process.stdin.on('data', keyHandler);

  // Cleanup function
  const cleanup = () => {
    if (!isRunning) return; // Prevent double cleanup
    isRunning = false;
    setGlobalRenderSettings(null);
    setRenderContext(null);
    clearHitTestLayout();

    if (process.stdout.isTTY) {
      process.stdout.off('resize', handleResize);
    }

    // Restore terminal modes
    // NOTE: FullscreenLayout handles exiting alternate screen via onCleanup,
    // so we don't need to do it here. This check is for safety in case
    // the render is stopped without proper component cleanup.
    if (isFullscreenActive()) {
      process.stdout.write('\x1b[?1049l');
    }

    // Force disable mouse (clears all registrations)
    forceDisableMouse();

    // Show cursor
    process.stdout.write('\x1b[?25h');

    // Move cursor below content (inline mode)
    // Cursor is at row 1 after rendering. We need to position it below content
    // so the shell prompt appears after the app output.
    //
    // For apps smaller than terminal height: move down content height + newline
    // For apps larger than terminal height: just output newlines to scroll past
    //
    // Using terminal height as fallback ensures we don't corrupt multi-screen content
    if (!isFullscreenActive()) {
      const moveLines = Math.max(lastOutputHeight, terminalHeight);
      for (let i = 0; i < moveLines; i++) {
        process.stdout.write('\x1b[1B');
      }
      process.stdout.write('\n');
    }

    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  // Register process exit handlers for proper cleanup
  const handleExit = () => {
    // Emergency cleanup - write directly to ensure terminal is restored
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
  };

  const handleSignal = (signal: string) => () => {
    // Emergency cleanup - write directly to ensure terminal is restored
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
    process.exit(signal === 'SIGINT' ? 130 : 143); // Standard exit codes
  };

  process.on('exit', handleExit);
  process.on('SIGINT', handleSignal('SIGINT'));
  process.on('SIGTERM', handleSignal('SIGTERM'));
  process.on('uncaughtException', (_err) => {
    // Emergency cleanup
    process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l');
    cleanup();
    process.exit(1);
  });

  return cleanup;
}
