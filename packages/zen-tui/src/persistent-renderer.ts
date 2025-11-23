/**
 * Persistent Renderer - Fine-Grained TUI Rendering
 *
 * Uses persistent virtual nodes with incremental updates.
 * No reconciler needed - effects handle updates directly.
 */

import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { createRoot } from '@zen/signal';
import cliBoxes from 'cli-boxes';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import { TUIElement, TUITextNode } from './element.js';
import { TerminalBuffer } from './terminal-buffer.js';
import { buildPersistentTree } from './tree-builder.js';
import type { TUINode } from './types.js';
import { dispatchInput } from './useInput.js';

// Global dirty elements set
globalThis.__tuiDirtyElements = new Set<TUIElement>();

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
 * Get ANSI background color code
 */
function getBgColorCode(color: string): string {
  const bgColorMap: Record<string, string> = {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    gray: '\x1b[100m',
    grey: '\x1b[100m',
  };
  return bgColorMap[color.toLowerCase()] || '';
}

/**
 * Get color function that wraps text with ANSI codes
 */
function getColorFn(color: string) {
  const code = getColorCode(color);
  return (text: string) => `${code + text}\x1b[39m`; // reset to default color
}

/**
 * Render box border
 */
function renderBorder(
  width: number,
  height: number,
  borderStyle = 'single',
  borderColor?: string,
): string[] {
  const box = cliBoxes[borderStyle as keyof typeof cliBoxes] || cliBoxes.single;
  const lines: string[] = [];

  // Top border
  let topLine = box.topLeft + box.top.repeat(Math.max(0, width - 2)) + box.topRight;
  if (borderColor) {
    topLine = getColorFn(borderColor)(topLine);
  }
  lines.push(topLine);

  // Middle lines (will be filled with content)
  for (let i = 0; i < height - 2; i++) {
    let middleLine = box.left + ' '.repeat(Math.max(0, width - 2)) + box.right;
    if (borderColor) {
      const colorFn = getColorFn(borderColor);
      const leftBorder = colorFn(box.left);
      const rightBorder = colorFn(box.right);
      middleLine = leftBorder + ' '.repeat(Math.max(0, width - 2)) + rightBorder;
    }
    lines.push(middleLine);
  }

  // Bottom border
  let bottomLine = box.bottomLeft + box.bottom.repeat(Math.max(0, width - 2)) + box.bottomRight;
  if (borderColor) {
    bottomLine = getColorFn(borderColor)(bottomLine);
  }
  lines.push(bottomLine);

  return lines;
}

/**
 * Apply text styling with ANSI codes
 */
function applyTextStyle(text: string, style: any = {}): string {
  let codes = '';
  let resetCodes = '';

  if (style.color) {
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`;
  }
  if (style.backgroundColor) {
    const bgColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;
    codes += getBgColorCode(bgColor);
    resetCodes = `\x1b[49m${resetCodes}`;
  }
  if (style.bold) {
    codes += '\x1b[1m';
    resetCodes = `\x1b[22m${resetCodes}`;
  }
  if (style.italic) {
    codes += '\x1b[3m';
    resetCodes = `\x1b[23m${resetCodes}`;
  }
  if (style.underline) {
    codes += '\x1b[4m';
    resetCodes = `\x1b[24m${resetCodes}`;
  }
  if (style.strikethrough) {
    codes += '\x1b[9m';
    resetCodes = `\x1b[29m${resetCodes}`;
  }
  if (style.dim) {
    codes += '\x1b[2m';
    resetCodes = `\x1b[22m${resetCodes}`;
  }

  return codes + text + resetCodes;
}

/**
 * Render element to string (like current renderNode but for TUIElement)
 */
function renderElementToString(element: TUIElement | TUITextNode): string {
  if (element instanceof TUITextNode) {
    return element.content;
  }

  // Render children
  const childrenStrings = element.children.map(renderElementToString);
  let content = childrenStrings.join('\n');

  // Apply text styling
  if (element.style && Object.keys(element.style).length > 0) {
    content = applyTextStyle(content, element.style);
  }

  // Apply borders if borderStyle is set
  const borderStyle = element.props.borderStyle;
  const borderColor = element.props.borderColor;

  if (borderStyle) {
    const contentLines = content.split('\n');
    const contentWidth = Math.max(...contentLines.map((line) => stringWidth(stripAnsi(line))), 10);
    const contentHeight = contentLines.length;

    // Create border with appropriate dimensions (add 2 for left/right borders)
    const borderLines = renderBorder(
      contentWidth + 2,
      contentHeight + 2,
      borderStyle,
      borderColor,
    );

    // Insert content lines into border
    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];
      const lineWidth = stringWidth(stripAnsi(line));
      const padding = ' '.repeat(Math.max(0, contentWidth - lineWidth));

      // Replace the empty space in the middle line with content
      if (borderColor) {
        const box = cliBoxes[borderStyle as keyof typeof cliBoxes] || cliBoxes.single;
        const colorFn = getColorFn(borderColor);
        const leftBorder = colorFn(box.left);
        const rightBorder = colorFn(box.right);
        borderLines[i + 1] = leftBorder + line + padding + rightBorder;
      } else {
        const box = cliBoxes[borderStyle as keyof typeof cliBoxes] || cliBoxes.single;
        borderLines[i + 1] = box.left + line + padding + box.right;
      }
    }

    content = borderLines.join('\n');
  }

  return content;
}

/**
 * Collect all dirty elements in tree
 */
function collectDirtyElements(root: TUIElement): Set<TUIElement> {
  const dirty = new Set<TUIElement>();

  function traverse(element: TUIElement) {
    if (element.isDirty()) {
      dirty.add(element);
    }
    for (const child of element.children) {
      if (child instanceof TUIElement) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return dirty;
}

/**
 * Render to terminal with persistent tree (new architecture)
 */
export async function renderToTerminalPersistent(
  createNode: () => TUINode,
  options: {
    onKeyPress?: (key: string) => void;
    fps?: number;
  } = {},
): Promise<() => void> {
  const { onKeyPress } = options;

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor during rendering
  process.stdout.write('\x1b[?25l');

  let isRunning = true;
  const terminalWidth = process.stdout.columns || 80;
  const terminalHeight = process.stdout.rows || 24;

  // Build persistent tree ONCE
  let rootElement: TUIElement | null = null;

  createRoot(() => {
    // Execute component to get node descriptor
    const node = createNode();

    // Handle descriptor if needed
    const resolvedNode = isDescriptor(node) ? executeDescriptor(node) : node;

    // Build persistent tree
    rootElement = buildPersistentTree(resolvedNode) as TUIElement;
  });

  if (!rootElement) {
    return () => {};
  }

  // Terminal buffers for diff-based updates
  let currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  let previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Track last output height
  let lastOutputHeight = 0;

  // Flush updates - render dirty nodes only
  const flushUpdates = async () => {
    if (!isRunning || !rootElement) return;

    // Collect dirty elements
    const dirtyElements = collectDirtyElements(rootElement);

    if (dirtyElements.size === 0) {
      return; // Nothing to update
    }

    // For MVP: Re-render entire tree (Phase 3 will optimize this)
    // TODO: Incremental rendering of only dirty subtrees
    const output = renderElementToString(rootElement);
    const newLines = output.split('\n');
    const newOutputHeight = newLines.length;

    // Update buffer
    currentBuffer.clear();
    for (let i = 0; i < newLines.length && i < terminalHeight; i++) {
      currentBuffer.writeAt(0, i, newLines[i], terminalWidth);
    }

    // Diff and update only changed lines
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0) {
      // Update only changed lines
      for (const change of changes) {
        // Move to line
        if (change.y > 0) {
          for (let i = 0; i < change.y; i++) {
            process.stdout.write('\x1b[1B');
          }
        }
        process.stdout.write('\r');
        process.stdout.write(change.line);
        process.stdout.write('\x1b[K');

        // Move back to top
        if (change.y > 0) {
          for (let i = 0; i < change.y; i++) {
            process.stdout.write('\x1b[1A');
          }
        }
        process.stdout.write('\r');
      }

      // Clear extra lines if app got smaller
      if (newOutputHeight < lastOutputHeight) {
        for (let i = newOutputHeight; i < lastOutputHeight; i++) {
          for (let j = 0; j < i; j++) {
            process.stdout.write('\x1b[1B');
          }
          process.stdout.write('\r');
          process.stdout.write('\x1b[2K');
          for (let j = 0; j < i; j++) {
            process.stdout.write('\x1b[1A');
          }
          process.stdout.write('\r');
        }
      }

      process.stdout.write('\r');
      lastOutputHeight = newOutputHeight;
    }

    // Swap buffers
    const temp = previousBuffer;
    previousBuffer = currentBuffer;
    currentBuffer = temp;

    // Clear dirty flags
    for (const element of dirtyElements) {
      element.clearDirty();
    }

    // Clear global dirty set
    globalThis.__tuiDirtyElements?.clear();
  };

  // Initial render
  const initialOutput = renderElementToString(rootElement);
  process.stdout.write(initialOutput);

  // Track how many lines we rendered
  lastOutputHeight = initialOutput.split('\n').length;

  // Move cursor to TOP of app
  const newlineCount = (initialOutput.match(/\n/g) || []).length;
  for (let i = 0; i < newlineCount; i++) {
    process.stdout.write('\x1b[1A'); // Move up
  }
  process.stdout.write('\r');

  // Initialize current buffer with initial output
  const initialLines = initialOutput.split('\n');
  for (let i = 0; i < initialLines.length && i < terminalHeight; i++) {
    currentBuffer.writeAt(0, i, initialLines[i], terminalWidth);
  }

  // Set up reactive update scheduler
  // When signals change → effects mark elements dirty → schedule flush
  let updateScheduled = false;
  const scheduleUpdate = () => {
    if (!updateScheduled) {
      updateScheduled = true;
      queueMicrotask(() => {
        updateScheduled = false;
        flushUpdates();
      });
    }
  };

  // Watch for dirty elements
  const checkDirtyInterval = setInterval(
    () => {
      if (globalThis.__tuiDirtyElements && globalThis.__tuiDirtyElements.size > 0) {
        scheduleUpdate();
      }
    },
    1000 / (options.fps || 10),
  );

  // Set up keyboard handler
  const keyHandler = (key: string) => {
    // Ctrl+C to exit
    if (key === '\u0003') {
      cleanup();
      process.exit(0);
    }

    // 'q' to quit
    if (key === 'q' || key === 'Q') {
      cleanup();
      process.exit(0);
    }

    dispatchInput(key);

    // Custom key handler
    if (onKeyPress) {
      onKeyPress(key);
    }

    // Schedule update after input
    scheduleUpdate();
  };

  if (process.stdin.isTTY) {
    process.stdin.on('data', keyHandler);
  }

  // Cleanup function
  const cleanup = () => {
    isRunning = false;
    clearInterval(checkDirtyInterval);

    // Dispose root element
    if (rootElement) {
      rootElement.dispose();
    }

    // Move cursor to bottom
    const finalNewlineCount = lastOutputHeight;
    for (let i = 0; i < finalNewlineCount; i++) {
      process.stdout.write('\x1b[1B');
    }
    process.stdout.write('\n');

    // Show cursor
    process.stdout.write('\x1b[?25h');

    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  return cleanup;
}
