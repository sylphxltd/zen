/**
 * TUI Renderer - Simplified
 *
 * Renders virtual TUI tree to terminal output.
 * Uses simple vertical stacking layout (MVP implementation).
 */

import { createRoot, effect } from '@zen/signal';
// MUST set environment before importing chalk!
process.env.FORCE_COLOR = '3';
import fs from 'node:fs';
import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
import sliceAnsi from 'slice-ansi';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import { renderToBuffer } from './layout-renderer.js';
import { setRenderContext } from './render-context.js';
import { TerminalBuffer } from './terminal-buffer.js';
import type { RenderOutput, TUINode, TUIStyle } from './types.js';
import { dispatchInput } from './useInput.js';
import { type LayoutMap, computeLayout } from './yoga-layout.js';

// Force chalk color level (Bun workaround - must be after chalk import)
(chalk as any).level = 3;
// Also ensure stdout is treated as TTY for color support
if (!process.stdout.isTTY) {
  Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: false });
}

// Debug logging to file
const DEBUG_LOG = '/tmp/tui-debug.log';

/**
 * Get ANSI color code - using raw ANSI instead of chalk for reliability
 */
function getColorCode(color: string): string {
  // Map common color names to ANSI codes
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

  return colorMap[color.toLowerCase()] || '\x1b[37m'; // default to white
}

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

function getColorFn(color: string) {
  const code = getColorCode(color);
  return (text: string) => `${code + text}\x1b[39m`; // reset to default color
}

function getBgColorFn(color: string) {
  const code = getBgColorCode(color);
  return (text: string) => `${code + text}\x1b[49m`; // reset to default bg
}

/**
 * Apply text styling with raw ANSI codes
 */
function applyTextStyle(text: string, style: TUIStyle = {}): string {
  let codes = '';
  let resetCodes = '';

  if (style.color) {
    // Resolve reactive color values
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`; // reset color
  }
  if (style.backgroundColor) {
    // Resolve reactive background color values
    const bgColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;
    codes += getBgColorCode(bgColor);
    resetCodes = `\x1b[49m${resetCodes}`; // reset bg
  }
  if (style.bold) {
    codes += '\x1b[1m';
    resetCodes = `\x1b[22m${resetCodes}`; // reset bold
  }
  if (style.italic) {
    codes += '\x1b[3m';
    resetCodes = `\x1b[23m${resetCodes}`; // reset italic
  }
  if (style.underline) {
    codes += '\x1b[4m';
    resetCodes = `\x1b[24m${resetCodes}`; // reset underline
  }
  if (style.strikethrough) {
    codes += '\x1b[9m';
    resetCodes = `\x1b[29m${resetCodes}`; // reset strikethrough
  }
  if (style.dim) {
    codes += '\x1b[2m';
    resetCodes = `\x1b[22m${resetCodes}`; // reset dim
  }

  return codes + text + resetCodes;
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
 * Insert content into box lines
 * Uses ANSI-aware slicing to avoid breaking escape sequences
 */
function insertContent(
  boxLines: string[],
  content: string,
  x: number,
  y: number,
  width: number,
): void {
  if (y < 0 || y >= boxLines.length || x < 0 || x >= width) {
    return;
  }

  const line = boxLines[y];
  // Use slice-ansi to avoid cutting through ANSI escape sequences
  const before = sliceAnsi(line, 0, x);
  const contentWidth = stringWidth(content);
  const after = sliceAnsi(line, x + contentWidth);

  boxLines[y] = before + content + after;
}

/**
 * Merge multiple boxes side-by-side for row layout
 * Handles boxes of different heights by padding shorter ones
 */
function mergeBoxesSideBySide(boxes: string[], gap = 0): string[] {
  if (boxes.length === 0) return [];
  if (boxes.length === 1) return boxes[0].split('\n');

  // Split each box into lines
  const boxLines = boxes.map((box) => box.split('\n'));

  // Find max height
  const maxHeight = Math.max(...boxLines.map((lines) => lines.length));

  // Pad shorter boxes to match height
  const paddedBoxLines = boxLines.map((lines) => {
    const padding = maxHeight - lines.length;
    if (padding > 0) {
      // Get width of first line (or 0 if no lines)
      const boxWidth = lines.length > 0 ? stringWidth(stripAnsi(lines[0])) : 0;
      const emptyLine = ' '.repeat(boxWidth);
      return [...lines, ...Array(padding).fill(emptyLine)];
    }
    return lines;
  });

  // Merge lines horizontally
  const mergedLines: string[] = [];
  const gapStr = ' '.repeat(gap);

  for (let i = 0; i < maxHeight; i++) {
    let line = '';
    for (let j = 0; j < paddedBoxLines.length; j++) {
      line += paddedBoxLines[j][i] || '';
      if (j < paddedBoxLines.length - 1) {
        line += gapStr;
      }
    }
    mergedLines.push(line);
  }

  return mergedLines;
}

/**
 * Render TUI node to string - simplified version
 */
function renderNode(node: TUINode, parentWidth: number): RenderOutput {
  // Get dimensions from style or use defaults
  const width = typeof node.style?.width === 'number' ? node.style.width : parentWidth || 80;
  const padding = node.style?.padding || 0;
  const paddingX = node.style?.paddingX ?? padding;
  const paddingY = node.style?.paddingY ?? padding;
  const paddingLeft = paddingX;
  const paddingTop = paddingY;

  const lines: string[] = [];

  // Check if this is a fixed-height box or auto-sizing box
  const hasBorder = node.style?.borderStyle && node.style.borderStyle !== 'none';
  const hasExplicitHeight = typeof node.style?.height === 'number';

  if (hasExplicitHeight) {
    // Fixed-height box: pre-allocate lines
    const height = node.style.height;

    if (hasBorder) {
      // Resolve reactive values
      const borderStyle =
        typeof node.style.borderStyle === 'function'
          ? node.style.borderStyle()
          : node.style.borderStyle;
      const borderColor =
        typeof node.style.borderColor === 'function'
          ? node.style.borderColor()
          : node.style.borderColor;

      const borderLines = renderBorder(width, height, borderStyle, borderColor);
      lines.push(...borderLines);
    } else {
      for (let i = 0; i < height; i++) {
        let line = ' '.repeat(width);
        if (node.style?.backgroundColor) {
          line = getBgColorFn(node.style.backgroundColor)(line);
        }
        lines.push(line);
      }
    }

    // Insert children into fixed space
    const flexDirection = node.style?.flexDirection || 'column';
    let currentY = paddingTop;

    if (flexDirection === 'row') {
      // Horizontal layout: render children side-by-side
      const childBoxes: string[] = [];
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (typeof child === 'string') {
            const textContent = applyTextStyle(child, node.style);
            childBoxes.push(textContent);
          } else if ('_type' in child && child._type === 'marker') {
            // Render marker children
            if ('children' in child && Array.isArray(child.children)) {
              for (const markerChild of child.children) {
                if (typeof markerChild === 'string') {
                  childBoxes.push(applyTextStyle(markerChild, node.style));
                } else if (
                  markerChild &&
                  typeof markerChild === 'object' &&
                  'type' in markerChild
                ) {
                  const childOutput = renderNode(markerChild, width - paddingLeft * 2);
                  childBoxes.push(childOutput.text);
                }
              }
            }
          } else {
            // Render child node
            const childOutput = renderNode(child, width - paddingLeft * 2);
            childBoxes.push(childOutput.text);
          }
        }
      }

      // Merge boxes side-by-side with gap
      const gap = node.style?.gap || 0;
      const mergedLines = mergeBoxesSideBySide(childBoxes, gap);

      // Insert merged lines
      for (let i = 0; i < mergedLines.length && currentY < lines.length; i++) {
        insertContent(lines, mergedLines[i], paddingLeft, currentY, width);
        currentY++;
      }
    } else {
      // Vertical layout (default): stack children
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (typeof child === 'string') {
            const textContent = applyTextStyle(child, node.style);
            insertContent(lines, textContent, paddingLeft, currentY, width);
            currentY += 1;
          } else if ('_type' in child && child._type === 'marker') {
            // Render marker children
            if ('children' in child && Array.isArray(child.children)) {
              for (const markerChild of child.children) {
                if (typeof markerChild === 'string') {
                  const textContent = applyTextStyle(markerChild, node.style);
                  insertContent(lines, textContent, paddingLeft, currentY, width);
                  currentY += 1;
                } else if (
                  markerChild &&
                  typeof markerChild === 'object' &&
                  'type' in markerChild
                ) {
                  const childOutput = renderNode(markerChild, width - paddingLeft * 2);
                  const childLines = childOutput.text.split('\n');
                  for (const childLine of childLines) {
                    if (currentY < lines.length) {
                      insertContent(lines, childLine, paddingLeft, currentY, width);
                    }
                    currentY += 1;
                  }
                }
              }
            }
          } else {
            const childOutput = renderNode(child, width - paddingLeft * 2);
            const childLines = childOutput.text.split('\n');
            for (const childLine of childLines) {
              if (currentY < lines.length) {
                insertContent(lines, childLine, paddingLeft, currentY, width);
                currentY += 1;
              }
            }
          }
        }
      }
    }
  } else {
    // Auto-sizing box: render children first, then create box
    const childrenLines: string[] = [];
    const flexDirection = node.style?.flexDirection || 'column';

    if (flexDirection === 'row') {
      // Horizontal layout: render children side-by-side
      const childBoxes: string[] = [];
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (typeof child === 'string') {
            const textContent = applyTextStyle(child, node.style);
            childBoxes.push(textContent);
          } else if ('_type' in child && child._type === 'marker') {
            // Render marker children
            if ('children' in child && Array.isArray(child.children)) {
              for (const markerChild of child.children) {
                if (typeof markerChild === 'string') {
                  childBoxes.push(applyTextStyle(markerChild, node.style));
                } else if (
                  markerChild &&
                  typeof markerChild === 'object' &&
                  'type' in markerChild
                ) {
                  const childOutput = renderNode(markerChild, width - paddingLeft * 2);
                  childBoxes.push(childOutput.text);
                }
              }
            }
          } else {
            // Render child node
            const childOutput = renderNode(child, width - paddingLeft * 2);
            childBoxes.push(childOutput.text);
          }
        }
      }

      // Merge boxes side-by-side with gap
      const gap = node.style?.gap || 0;
      const mergedLines = mergeBoxesSideBySide(childBoxes, gap);
      childrenLines.push(...mergedLines);
    } else {
      // Vertical layout (default): stack children
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (typeof child === 'string') {
            const textContent = applyTextStyle(child, node.style);
            childrenLines.push(textContent);
          } else if ('_type' in child && child._type === 'marker') {
            // Render marker children
            if ('children' in child && Array.isArray(child.children)) {
              for (const markerChild of child.children) {
                if (typeof markerChild === 'string') {
                  const textContent = applyTextStyle(markerChild, node.style);
                  childrenLines.push(textContent);
                } else if (
                  markerChild &&
                  typeof markerChild === 'object' &&
                  'type' in markerChild
                ) {
                  const childOutput = renderNode(markerChild, width - paddingLeft * 2);
                  childrenLines.push(...childOutput.text.split('\n'));
                }
              }
            }
          } else {
            const childOutput = renderNode(child, width - paddingLeft * 2);
            childrenLines.push(...childOutput.text.split('\n'));
          }
        }
      }
    }

    // Calculate height: padding + content + padding (+ borders if applicable)
    const contentHeight = childrenLines.length;
    const innerHeight = paddingTop + contentHeight + paddingY;
    const totalHeight = hasBorder ? innerHeight + 2 : innerHeight; // +2 for top and bottom borders

    // Create box with calculated height
    if (hasBorder) {
      // Resolve reactive values
      const borderStyle =
        typeof node.style.borderStyle === 'function'
          ? node.style.borderStyle()
          : node.style.borderStyle;
      const borderColor =
        typeof node.style.borderColor === 'function'
          ? node.style.borderColor()
          : node.style.borderColor;

      const borderLines = renderBorder(width, totalHeight, borderStyle, borderColor);
      lines.push(...borderLines);
    } else {
      for (let i = 0; i < totalHeight; i++) {
        let line = ' '.repeat(width);
        if (node.style?.backgroundColor) {
          line = getBgColorFn(node.style.backgroundColor)(line);
        }
        lines.push(line);
      }
    }

    // Insert children (offset by 1 if border for top border line)
    let currentY = (hasBorder ? 1 : 0) + paddingTop;
    for (const childLine of childrenLines) {
      if (currentY < lines.length) {
        insertContent(lines, childLine, paddingLeft, currentY, width);
        currentY += 1;
      }
    }
  }

  return {
    text: lines.join('\n'),
    width,
    height: lines.length,
  };
}

/**
 * Render TUI tree to terminal
 */
export function render(node: TUINode | TUINode[], options: { width?: number } = {}): string {
  const terminalWidth = options.width || process.stdout.columns || 80;

  // Handle fragments (arrays) by wrapping in a fragment node
  if (Array.isArray(node)) {
    const fragmentNode: TUINode = {
      type: 'box',
      tagName: 'fragment',
      props: {},
      children: node,
      style: {},
    };
    const output = renderNode(fragmentNode, terminalWidth);
    return output.text;
  }

  const output = renderNode(node, terminalWidth);
  return output.text;
}

/**
 * Render and display in terminal
 */
export async function renderToTerminal(node: TUINode | TUINode[]): Promise<void> {
  // Wait for microtasks (For/Show/Switch effects) to complete
  await Promise.resolve();
  await Promise.resolve();

  const output = render(node);
  process.stdout.write(output);
  process.stdout.write('\n');
}

/**
 * Render to terminal with reactive updates
 * Clears screen and re-renders when signals change
 */
export async function renderToTerminalReactive(
  createNode: () => TUINode,
  options: {
    onKeyPress?: (key: string) => void;
    fps?: number;
  } = {},
): Promise<() => void> {
  const { onKeyPress } = options;
  try {
    fs.writeFileSync(DEBUG_LOG, `=== TUI Debug Log - ${new Date().toISOString()} ===\n`);
  } catch (_err) {}

  // Keep original console methods (React Ink style - console.log is static)
  const _originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  // Console.log is treated as static content - just let it print naturally
  // No interception needed! React Ink doesn't manage console output.

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

  // Save current cursor position (React Ink style - render at current position)
  let _startRow = 0;
  if (process.stdout.isTTY && process.stdout.getWindowSize) {
    // Get cursor position - we'll render starting from current line
    // For simplicity, we'll track the starting row ourselves
    _startRow = 0; // Will be set after initial render
  }

  // Create component tree once (fine-grained reactivity - components render only once)
  const node = createRoot(() => createNode());

  // Compute initial layout
  let layoutMap = await computeLayout(node, terminalWidth, terminalHeight);

  // Terminal buffers for diff-based updates
  let currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  let previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Batched updates - collect all scheduled updates and apply them together
  let updateScheduled = false;
  const pendingUpdates = new Map<any, string>();

  const scheduleUpdate = (targetNode: any, content: string) => {
    pendingUpdates.set(targetNode, content);

    if (!updateScheduled) {
      updateScheduled = true;
      queueMicrotask(() => {
        updateScheduled = false;
        flushUpdates();
      });
    }
  };

  const flushUpdates = async () => {
    if (!isRunning) return;

    // Recompute layout with updated tree
    layoutMap = await computeLayout(node, terminalWidth, terminalHeight);

    // Render using existing render function
    const output = render(node);
    const newLines = output.split('\n');
    const newOutputHeight = newLines.length;

    // Update buffer from render output
    currentBuffer.clear();
    for (let i = 0; i < newLines.length && i < terminalHeight; i++) {
      currentBuffer.writeAt(0, i, newLines[i], terminalWidth);
    }

    // Diff and update only changed lines
    const changes = currentBuffer.diff(previousBuffer);

    // React Ink style: Fine-grained update of only changed lines
    // Console.log is static content, we preserve it by not clearing before writing
    if (changes.length > 0) {
      let updateSequence = '';

      // Update only changed lines
      for (const change of changes) {
        // Move cursor to the line (from top-left of app region)
        if (change.y > 0) {
          updateSequence += `\x1b[${change.y}B`; // Move down change.y lines
        }
        updateSequence += '\r'; // Return to start of line
        updateSequence += change.line; // Write new content
        updateSequence += '\x1b[K'; // Clear to end of line

        // Move cursor back to top-left for next change
        if (change.y > 0) {
          updateSequence += `\x1b[${change.y}A`; // Move back up
        }
        updateSequence += '\r'; // Return to start
      }

      // If app got smaller, clear remaining old lines
      if (newOutputHeight < lastOutputHeight) {
        for (let i = newOutputHeight; i < lastOutputHeight; i++) {
          updateSequence += `\x1b[${i}B\r`; // Move to line i
          updateSequence += '\x1b[2K'; // Clear line
          updateSequence += `\x1b[${i}A\r`; // Move back to top
        }
      }

      process.stdout.write(updateSequence);
      lastOutputHeight = newOutputHeight;

      // Move cursor back to the start of app region (top-left)
      // This allows console.log to print here and push the app down
      for (let i = 0; i < newOutputHeight; i++) {
        process.stdout.write('\x1b[1A'); // Move up one line
      }
      process.stdout.write('\x1b[G'); // Move to column 0
    }

    // Swap buffers for next update
    const temp = previousBuffer;
    previousBuffer = currentBuffer;
    currentBuffer = temp;

    pendingUpdates.clear();
  };

  // Set render context for fine-grained updates
  setRenderContext({
    layoutMap,
    scheduleUpdate,
  });

  // Initial render (React Ink style - don't clear screen, render at current position)
  const initialOutput = render(node);

  // Just write output at current cursor position (don't clear screen)
  process.stdout.write(initialOutput);

  // Track how many lines we rendered (updated on each render)
  let lastOutputHeight = initialOutput.split('\n').length;

  // Move cursor to the start of app region (top-left of our output)
  // This allows console.log to print here and push the app down
  for (let i = 0; i < lastOutputHeight; i++) {
    process.stdout.write('\x1b[1A'); // Move up one line
  }
  process.stdout.write('\x1b[G'); // Move to column 0

  // Initialize current buffer with initial output
  const initialLines = initialOutput.split('\n');
  for (let i = 0; i < initialLines.length && i < terminalHeight; i++) {
    currentBuffer.writeAt(0, i, initialLines[i], terminalWidth);
  }

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
  };

  if (process.stdin.isTTY) {
    process.stdin.on('data', keyHandler);
  }

  // Cleanup function
  const cleanup = () => {
    isRunning = false;
    // Clear render context
    setRenderContext(null);
    // Show cursor again
    process.stdout.write('\x1b[?25h');
    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  return cleanup;
}
