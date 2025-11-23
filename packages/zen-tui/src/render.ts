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
import { parseMouseEvent } from './mouse-parser.js';
import { setRenderContext } from './render-context.js';
import { TerminalBuffer } from './terminal-buffer.js';
import type { RenderOutput, TUINode, TUIStyle } from './types.js';
import { dispatchInput } from './useInput.js';
import { dispatchMouseEvent } from './useMouse.js';
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
  let actualWidth = width; // Track actual width used (may differ for auto-sized row layouts)

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
            for (let i = 0; i < childLines.length; i++) {
              if (currentY < lines.length) {
                insertContent(lines, childLines[i], paddingLeft, currentY, width);
              }
              currentY++;
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

    // For auto-sized boxes without borders in row layout, calculate actual content width
    if (!hasBorder && flexDirection === 'row' && childrenLines.length > 0) {
      // Calculate max content width from childrenLines
      const maxContentWidth = Math.max(
        ...childrenLines.map((line) => stringWidth(stripAnsi(line))),
      );
      // Add padding to get total width
      actualWidth = Math.min(width, maxContentWidth + paddingLeft + paddingX);
    }

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
        let line = ' '.repeat(actualWidth);
        if (node.style?.backgroundColor) {
          line = getBgColorFn(node.style.backgroundColor)(line);
        }
        lines.push(line);
      }
    }

    // Insert children (offset by 1 if border for top border line)
    let currentY = (hasBorder ? 1 : 0) + paddingTop;
    for (let i = 0; i < childrenLines.length; i++) {
      if (currentY < lines.length) {
        insertContent(lines, childrenLines[i], paddingLeft, currentY, actualWidth);
      }
      currentY++;
    }
  }

  return {
    text: lines.join('\n'),
    width: actualWidth,
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
    fullscreen?: boolean;
    mouse?: boolean;
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

  // Enter full-screen mode if requested
  if (options.fullscreen) {
    // Enter alternate screen buffer
    process.stdout.write('\x1b[?1049h');
    // Clear screen
    process.stdout.write('\x1b[2J');
    // Move cursor to top-left
    process.stdout.write('\x1b[H');
  }

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor during rendering
  process.stdout.write('\x1b[?25l');

  // Enable mouse tracking if requested
  if (options.mouse) {
    // Enable mouse click tracking
    process.stdout.write('\x1b[?1000h');
    // Enable SGR extended mouse mode (better coordinates)
    process.stdout.write('\x1b[?1006h');
  }

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
  // Handle descriptor pattern (ADR-011): createNode() may return a descriptor
  let node = createRoot(() => {
    const result = createNode();

    // If result is a descriptor, execute it
    // This happens when root component is a function component
    if (result && typeof result === 'object' && '_jsx' in result && (result as any)._jsx === true) {
      // Import executeDescriptor dynamically to avoid circular dependency
      const { executeDescriptor } = require('@zen/runtime');
      const executed = executeDescriptor(result);
      return executed;
    }

    return result;
  });

  // Handle fragments (arrays) by wrapping in a fragment node
  if (Array.isArray(node)) {
    const fragmentNode: TUINode = {
      type: 'box',
      tagName: 'fragment',
      props: {},
      children: node,
      style: {
        flex: 1,
        flexDirection: 'column',
      },
    };
    node = fragmentNode;
  }

  // Compute initial layout
  let layoutMap = await computeLayout(node, terminalWidth, terminalHeight);

  // Terminal buffers for diff-based updates
  let currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  let previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Static content buffer - collects all static content to print above app
  let staticContentBuffer: string[] = [];
  let staticItemsCount = 0;

  // Helper: Collect new Static items into buffer
  function collectNewStaticItems(node: TUINode | TUINode[]): void {
    const staticNode = findStaticNode(node);
    if (!staticNode) return;

    const itemsGetter = staticNode.props?.__itemsGetter;
    const renderChild = staticNode.props?.__renderChild;

    if (itemsGetter && renderChild && typeof itemsGetter === 'function') {
      const items = itemsGetter();
      const currentCount = items?.length || 0;

      // Render new items and add to buffer
      for (let i = staticItemsCount; i < currentCount; i++) {
        const item = items[i];
        const child = renderChild(item, i);
        const itemOutput = render(child);
        staticContentBuffer.push(itemOutput);
      }

      staticItemsCount = currentCount;
    }
  }

  // Helper: Find Static node in tree
  function findStaticNode(node: TUINode | TUINode[]): TUINode | null {
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = findStaticNode(n);
        if (found) return found;
      }
      return null;
    }

    if (node.tagName === 'static') {
      return node;
    }

    if (node.children) {
      return findStaticNode(node.children);
    }

    return null;
  }

  // Helper: Remove Static nodes from tree (for rendering dynamic content only)
  function removeStaticNodes(node: TUINode | TUINode[]): TUINode | TUINode[] | null {
    if (Array.isArray(node)) {
      const filtered: TUINode[] = [];
      let changed = false;

      for (const n of node) {
        const result = removeStaticNodes(n);
        if (result !== null) {
          filtered.push(result as TUINode);
          if (result !== n) changed = true;
        } else {
          changed = true; // Removed a node
        }
      }

      // Only create new array if something changed
      return changed ? (filtered.length > 0 ? filtered : null) : node;
    }

    if (node.tagName === 'static') {
      return null; // Remove Static nodes
    }

    if (node.children) {
      const filteredChildren = removeStaticNodes(node.children);

      // Only create new object if children actually changed
      if (filteredChildren === node.children) {
        return node; // No change, return original
      }

      return {
        ...node,
        children: Array.isArray(filteredChildren)
          ? filteredChildren
          : filteredChildren
            ? [filteredChildren]
            : [],
      };
    }

    return node;
  }

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

  // Intercept console methods - add to static buffer
  let isOurOutput = false;
  const originalConsoleLog = console.log.bind(console);
  const originalConsoleError = console.error.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleInfo = console.info.bind(console);

  // Helper: Format console args to string
  function formatConsoleArgs(...args: any[]): string {
    return args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' ');
  }

  // Wrap console methods - collect into static buffer (don't call original to avoid duplication)
  console.log = (...args: any[]) => {
    if (!isOurOutput) {
      staticContentBuffer.push(formatConsoleArgs(...args));
      // Don't call originalConsoleLog - content will be printed from buffer
    }
  };

  console.error = (...args: any[]) => {
    if (!isOurOutput) {
      staticContentBuffer.push(formatConsoleArgs(...args));
    }
  };

  console.warn = (...args: any[]) => {
    if (!isOurOutput) {
      staticContentBuffer.push(formatConsoleArgs(...args));
    }
  };

  console.info = (...args: any[]) => {
    if (!isOurOutput) {
      staticContentBuffer.push(formatConsoleArgs(...args));
    }
  };

  const flushUpdates = async () => {
    if (!isRunning) return;

    // Step 1: Collect all static changes
    collectNewStaticItems(node);

    // Step 2: If any static content collected, print above app and clear buffer
    if (staticContentBuffer.length > 0) {
      isOurOutput = true;

      // Clear current app (cursor is at TOP of app)
      for (let i = 0; i < lastOutputHeight; i++) {
        if (i > 0) {
          process.stdout.write('\x1b[1B'); // Move down
        }
        process.stdout.write('\r');
        process.stdout.write('\x1b[2K'); // Clear line
      }

      // Move back to top
      for (let i = 0; i < lastOutputHeight - 1; i++) {
        process.stdout.write('\x1b[1A'); // Move up
      }
      process.stdout.write('\r');

      // Print all static content in order (permanently to scrollback)
      for (const staticLine of staticContentBuffer) {
        process.stdout.write(staticLine);
        process.stdout.write('\n');
      }

      // Clear buffer (don't manage history)
      staticContentBuffer = [];

      // Step 3: Re-render entire app below static content
      const dynamicNode = removeStaticNodes(node);

      // Recompute layout for the node to render
      // If removeStaticNodes didn't change anything, dynamicNode === node (same reference)
      layoutMap = await computeLayout(dynamicNode || node, terminalWidth, terminalHeight);

      // Use layout-renderer for proper scroll offset handling
      currentBuffer.clear();
      if (dynamicNode) {
        renderToBuffer(dynamicNode, currentBuffer, layoutMap);
      }
      const appOutput = currentBuffer.renderFull();
      const appLines = appOutput.split('\n');
      const appHeight = appLines.length;

      process.stdout.write(appOutput);

      // Move cursor to TOP of app
      const newlineCount = (appOutput.match(/\n/g) || []).length;
      for (let i = 0; i < newlineCount; i++) {
        process.stdout.write('\x1b[1A');
      }
      process.stdout.write('\r');

      // Update tracking
      lastOutputHeight = appHeight;

      // Update buffers - currentBuffer already has content from renderToBuffer
      // Just swap buffers for next diff
      const temp = previousBuffer;
      previousBuffer = currentBuffer;
      currentBuffer = temp;

      isOurOutput = false;
      pendingUpdates.clear();
      return;
    }

    // No static content - do fine-grained diff update
    const dynamicNode = removeStaticNodes(node);

    // Recompute layout for the node to render
    // If removeStaticNodes didn't change anything, dynamicNode === node (same reference)
    // This optimization avoids creating new objects when there are no static nodes
    layoutMap = await computeLayout(dynamicNode || node, terminalWidth, terminalHeight);

    // Use layout-renderer for proper scroll offset handling
    currentBuffer.clear();
    if (dynamicNode) {
      renderToBuffer(dynamicNode, currentBuffer, layoutMap);
    }
    const output = currentBuffer.renderFull();
    const newLines = output.split('\n');
    const newOutputHeight = newLines.length;

    // Diff and update only changed lines
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0) {
      isOurOutput = true;

      // Clear entire display area first for clean update
      if (lastOutputHeight > 0) {
        // Move to top
        process.stdout.write('\r');
        // Clear all previous lines
        for (let i = 0; i < lastOutputHeight; i++) {
          process.stdout.write('\x1b[2K'); // Clear entire line
          if (i < lastOutputHeight - 1) {
            process.stdout.write('\x1b[1B'); // Move down
            process.stdout.write('\r'); // Return to start of line
          }
        }
        // Move back to top
        for (let i = 0; i < lastOutputHeight - 1; i++) {
          process.stdout.write('\x1b[1A');
        }
        process.stdout.write('\r');
      }

      // Render full new content
      const fullOutput = output;
      process.stdout.write(fullOutput);

      // Move cursor back to top
      const lines = fullOutput.split('\n');
      if (lines.length > 1) {
        for (let i = 0; i < lines.length - 1; i++) {
          process.stdout.write('\x1b[1A');
        }
      }
      process.stdout.write('\r');
      lastOutputHeight = newOutputHeight;
      isOurOutput = false;
    }

    // Swap buffers
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
  // Use layout-renderer for proper scroll offset handling
  renderToBuffer(node, currentBuffer, layoutMap);
  const initialOutput = currentBuffer.renderFull();

  // Strategy: render app at current position, move cursor to TOP of app
  // Console.log will write at cursor (top of app), overwriting first line
  // We then re-render below the console.log
  isOurOutput = true;
  process.stdout.write(initialOutput);

  // Track how many lines we rendered
  let lastOutputHeight = initialOutput.split('\n').length;

  // Move cursor to TOP of app (so console.log writes there)
  const newlineCount = (initialOutput.match(/\n/g) || []).length;
  for (let i = 0; i < newlineCount; i++) {
    process.stdout.write('\x1b[1A'); // Move up
  }
  process.stdout.write('\r'); // Column 0

  isOurOutput = false;

  // currentBuffer already has content from renderToBuffer in initial render
  // No need to write again

  // Set up keyboard and mouse handler
  const keyHandler = (key: string) => {
    // Try to parse as mouse event first (if mouse enabled)
    if (options.mouse) {
      const mouseEvent = parseMouseEvent(key);
      if (mouseEvent) {
        dispatchMouseEvent(mouseEvent);
        return; // Don't process as keyboard input
      }
    }

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
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;

    // Exit full-screen mode if enabled
    if (options.fullscreen) {
      // Restore normal screen buffer
      process.stdout.write('\x1b[?1049l');
    } else {
      // Cursor is at TOP of app, move to BOTTOM for clean terminal prompt
      // Move down by number of newlines in app
      const finalNewlineCount = (render(node).match(/\n/g) || []).length;
      for (let i = 0; i < finalNewlineCount; i++) {
        process.stdout.write('\x1b[1B'); // Move down
      }
      process.stdout.write('\n');
    }

    // Disable mouse tracking if enabled
    if (options.mouse) {
      process.stdout.write('\x1b[?1006l'); // Disable SGR extended mode
      process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
    }

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
