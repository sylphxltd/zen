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
import { parseMouseEvent } from '../utils/mouse-parser.js';
import { dispatchInput } from '../hooks/useInput.js';
import { dispatchMouseEvent as dispatchGlobalMouseEvent } from '../hooks/useMouse.js';
import { setHitTestLayout, clearHitTestLayout, hitTest } from '../utils/hit-test.js';
import { renderToBuffer } from './layout-renderer.js';
import { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode } from './types.js';
import { computeLayout, type LayoutMap } from './yoga-layout.js';
import {
  RenderSettingsProvider,
  setGlobalRenderSettings,
  type RenderSettings,
} from '../providers/RenderContext.js';

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
export async function renderApp(createApp: () => unknown): Promise<() => void> {
  // Create render settings that components will update
  const settings: RenderSettings = {
    fullscreen: signal(false),
    mouse: signal(false),
  };

  setGlobalRenderSettings(settings);

  let isRunning = true;
  let terminalWidth = process.stdout.columns || 80;
  let terminalHeight = process.stdout.rows || 24;

  // Terminal buffers for diff-based updates
  let currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  let previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Track output height for cursor management
  let lastOutputHeight = 0;
  let fullscreenActive = false;
  let mouseActive = false;

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

  // Compute initial layout
  let layoutMap = await computeLayout(node, terminalWidth, terminalHeight);
  setHitTestLayout(layoutMap, node);

  // Apply terminal modes based on settings
  const applyTerminalModes = () => {
    const shouldFullscreen = settings.fullscreen.value;
    const shouldMouse = settings.mouse.value;

    // Fullscreen mode
    if (shouldFullscreen && !fullscreenActive) {
      process.stdout.write('\x1b[?1049h'); // Enter alternate screen
      process.stdout.write('\x1b[2J');     // Clear screen
      process.stdout.write('\x1b[H');      // Move to top-left
      fullscreenActive = true;
    } else if (!shouldFullscreen && fullscreenActive) {
      process.stdout.write('\x1b[?1049l'); // Exit alternate screen
      fullscreenActive = false;
    }

    // Mouse mode
    if (shouldMouse && !mouseActive) {
      process.stdout.write('\x1b[?1000h'); // Enable mouse tracking
      process.stdout.write('\x1b[?1006h'); // Enable SGR extended mode
      mouseActive = true;
    } else if (!shouldMouse && mouseActive) {
      process.stdout.write('\x1b[?1006l'); // Disable SGR extended mode
      process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
      mouseActive = false;
    }
  };

  // Watch settings and apply modes
  effect(() => {
    settings.fullscreen.value; // Subscribe
    settings.mouse.value;      // Subscribe
    applyTerminalModes();
  });

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor
  process.stdout.write('\x1b[?25l');

  // Render function
  const flushUpdates = async () => {
    if (!isRunning) return;

    // Recompute layout
    layoutMap = await computeLayout(node, terminalWidth, terminalHeight);
    setHitTestLayout(layoutMap, node);

    // Render to buffer
    currentBuffer.clear();
    renderToBuffer(node, currentBuffer, layoutMap);
    const output = currentBuffer.renderFull();
    const newLines = output.split('\n');
    const newOutputHeight = newLines.length;

    // Diff and update
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0 || lastOutputHeight !== newOutputHeight) {
      // Clear previous output
      if (lastOutputHeight > 0 && !fullscreenActive) {
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

      // Move cursor back to top (for inline mode)
      if (!fullscreenActive) {
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

    // Swap buffers
    const temp = previousBuffer;
    previousBuffer = currentBuffer;
    currentBuffer = temp;
  };

  // Initial render
  await flushUpdates();

  // Terminal resize handler
  const handleResize = () => {
    const newWidth = process.stdout.columns || 80;
    const newHeight = process.stdout.rows || 24;

    if (newWidth === terminalWidth && newHeight === terminalHeight) return;

    terminalWidth = newWidth;
    terminalHeight = newHeight;

    currentBuffer.resize(terminalWidth, terminalHeight);
    previousBuffer.resize(terminalWidth, terminalHeight);
    previousBuffer.clear();

    if (fullscreenActive) {
      process.stdout.write('\x1b[2J');
      process.stdout.write('\x1b[H');
    }

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  if (process.stdout.isTTY) {
    process.stdout.on('resize', handleResize);
  }

  // Input handler
  const keyHandler = (key: string) => {
    // Try mouse event first
    if (mouseActive) {
      const mouseEvent = parseMouseEvent(key);
      if (mouseEvent) {
        // Hit test and dispatch
        const hit = hitTest(mouseEvent.x, mouseEvent.y);

        // Find MouseProvider context and dispatch
        // For now, use global dispatch (will improve later)
        dispatchGlobalMouseEvent(mouseEvent);

        // Auto-dispatch onClick for backward compatibility
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
    }

    // Ctrl+C to exit
    if (key === '\u0003') {
      cleanup();
      process.exit(0);
    }

    // q to quit
    if (key === 'q' || key === 'Q') {
      cleanup();
      process.exit(0);
    }

    // Dispatch to useInput handlers
    dispatchInput(key);

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  if (process.stdin.isTTY) {
    process.stdin.on('data', keyHandler);
  }

  // Cleanup function
  const cleanup = () => {
    isRunning = false;
    setGlobalRenderSettings(null);
    clearHitTestLayout();

    if (process.stdout.isTTY) {
      process.stdout.off('resize', handleResize);
    }

    // Restore terminal modes
    if (fullscreenActive) {
      process.stdout.write('\x1b[?1049l');
    }
    if (mouseActive) {
      process.stdout.write('\x1b[?1006l');
      process.stdout.write('\x1b[?1000l');
    }

    // Show cursor
    process.stdout.write('\x1b[?25h');

    // Move cursor to bottom (inline mode)
    if (!fullscreenActive && lastOutputHeight > 0) {
      for (let i = 0; i < lastOutputHeight; i++) {
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

  return cleanup;
}
