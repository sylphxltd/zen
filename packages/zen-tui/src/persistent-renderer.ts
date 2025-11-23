/**
 * Persistent Renderer - Fine-Grained TUI Rendering
 *
 * Uses persistent virtual nodes with incremental updates.
 * No reconciler needed - effects handle updates directly.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { createRoot } from '@zen/signal';
import cliBoxes from 'cli-boxes';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import initYoga, { type Yoga } from 'yoga-wasm-web';
import { TUIElement, TUITextNode } from './element.js';
import { TerminalBuffer } from './terminal-buffer.js';
import { buildPersistentTree } from './tree-builder.js';
import type { TUINode } from './types.js';
import { dispatchInput } from './useInput.js';

// Yoga WASM instance
let yogaInstance: Yoga | null = null;
let yogaInitPromise: Promise<Yoga> | null = null;

async function getYoga(): Promise<Yoga> {
  if (yogaInstance) return yogaInstance;
  if (yogaInitPromise) return yogaInitPromise;

  yogaInitPromise = (async () => {
    let wasmPath: string;
    try {
      const yogaModulePath = dirname(fileURLToPath(import.meta.resolve('yoga-wasm-web')));
      wasmPath = join(yogaModulePath, 'yoga.wasm');
    } catch {
      const currentDir = dirname(fileURLToPath(import.meta.url));
      wasmPath = join(currentDir, '../node_modules/yoga-wasm-web/dist/yoga.wasm');
    }

    const wasmBuffer = readFileSync(wasmPath);
    const arrayBuffer = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength,
    );
    const yoga = await initYoga(arrayBuffer);
    yogaInstance = yoga;
    return yoga;
  })();

  return yogaInitPromise;
}

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
 * Build or update Yoga node tree from TUIElement tree
 */
async function buildYogaTreeFromElements(
  element: TUIElement | TUITextNode,
  Yoga: Yoga,
): Promise<any> {
  if (element instanceof TUITextNode) {
    // Text node - create sized Yoga node
    const textYogaNode = Yoga.Node.create();
    textYogaNode.setWidth(element.content.length);
    textYogaNode.setHeight(1);
    return textYogaNode;
  }

  // Create or use existing Yoga node
  if (!element.yogaNode) {
    element.createYogaNode(Yoga);
  }

  // Update Yoga node with current styles
  element.updateYogaNode(Yoga);

  // Build children
  const yogaNode = element.yogaNode;

  // Clear existing children
  while (yogaNode.getChildCount() > 0) {
    yogaNode.removeChild(yogaNode.getChild(0));
  }

  // Add children
  for (const child of element.children) {
    const childYogaNode = await buildYogaTreeFromElements(child, Yoga);
    yogaNode.insertChild(childYogaNode, yogaNode.getChildCount());
  }

  return yogaNode;
}

/**
 * Layout result for elements
 */
interface ElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract layout from computed Yoga tree
 */
function extractElementLayout(
  element: TUIElement | TUITextNode,
  layoutMap: Map<TUIElement | TUITextNode, ElementLayout>,
  offsetX = 0,
  offsetY = 0,
): void {
  if (element instanceof TUITextNode) {
    // Text nodes don't have layout info
    return;
  }

  const yogaNode = element.yogaNode;
  if (!yogaNode) return;

  const layout: ElementLayout = {
    x: offsetX + yogaNode.getComputedLeft(),
    y: offsetY + yogaNode.getComputedTop(),
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight(),
  };

  layoutMap.set(element, layout);

  // Process children
  for (const child of element.children) {
    if (child instanceof TUIElement) {
      extractElementLayout(child, layoutMap, layout.x, layout.y);
    }
  }
}

/**
 * Render element to buffer using Yoga layout
 */
function renderElementToBuffer(
  element: TUIElement | TUITextNode,
  buffer: TerminalBuffer,
  layoutMap: Map<TUIElement | TUITextNode, ElementLayout>,
): void {
  if (element instanceof TUITextNode) {
    // Text nodes are rendered by their parents
    return;
  }

  const layout = layoutMap.get(element);
  if (!layout) return;

  const x = Math.floor(layout.x);
  const y = Math.floor(layout.y);
  const width = Math.floor(layout.width);
  const height = Math.floor(layout.height);

  // Render border if specified
  const borderStyle = element.props.borderStyle;
  const borderColor = element.props.borderColor;

  if (borderStyle && borderStyle !== 'none') {
    const box = cliBoxes[borderStyle as keyof typeof cliBoxes] || cliBoxes.single;
    const colorFn = borderColor ? getColorFn(borderColor) : (s: string) => s;

    // Top border
    const topBorder = colorFn(box.topLeft + box.top.repeat(Math.max(0, width - 2)) + box.topRight);
    buffer.writeAt(x, y, topBorder, width);

    // Side borders
    for (let i = 1; i < height - 1; i++) {
      buffer.writeAt(x, y + i, colorFn(box.left), 1);
      buffer.writeAt(x + width - 1, y + i, colorFn(box.right), 1);
    }

    // Bottom border
    const bottomBorder = colorFn(
      box.bottomLeft + box.bottom.repeat(Math.max(0, width - 2)) + box.bottomRight,
    );
    buffer.writeAt(x, y + height - 1, bottomBorder, width);
  }

  // Calculate content area
  const hasBorder = borderStyle && borderStyle !== 'none';
  const borderOffset = hasBorder ? 1 : 0;
  const padding = element.style.padding ?? 0;
  const paddingX = element.style.paddingX ?? padding;
  const paddingY = element.style.paddingY ?? padding;

  const contentX = x + borderOffset + paddingX;
  const contentY = y + borderOffset + paddingY;
  const contentWidth = width - 2 * borderOffset - 2 * paddingX;

  // Render text content (TUITextNode children)
  let currentY = contentY;
  for (const child of element.children) {
    if (child instanceof TUITextNode) {
      const styledText = applyTextStyle(child.content, element.style);
      buffer.writeAt(contentX, currentY, styledText, contentWidth);
      currentY++;
    } else if (child instanceof TUIElement) {
      // Recursive render for child elements
      renderElementToBuffer(child, buffer, layoutMap);
    }
  }
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

  // Initialize Yoga for layout
  const Yoga = await getYoga();

  // Flush updates - render dirty nodes with Yoga layout
  const flushUpdates = async () => {
    if (!isRunning || !rootElement) return;

    // Collect dirty elements
    const dirtyElements = collectDirtyElements(rootElement);

    if (dirtyElements.size === 0) {
      return; // Nothing to update
    }

    // Build/update Yoga tree from TUIElement tree
    const rootYogaNode = await buildYogaTreeFromElements(rootElement, Yoga);

    // Compute layout
    rootYogaNode.calculateLayout(terminalWidth, terminalHeight, Yoga.DIRECTION_LTR);

    // Extract layout results
    const layoutMap = new Map<TUIElement | TUITextNode, ElementLayout>();
    extractElementLayout(rootElement, layoutMap);

    // Render to buffer using layout
    currentBuffer.clear();
    renderElementToBuffer(rootElement, currentBuffer, layoutMap);

    // Calculate output height from buffer
    const bufferOutput = currentBuffer.toString();
    const newOutputHeight = bufferOutput.split('\n').length;

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

  // Initial render with Yoga layout
  const initialYogaNode = await buildYogaTreeFromElements(rootElement, Yoga);
  initialYogaNode.calculateLayout(terminalWidth, terminalHeight, Yoga.DIRECTION_LTR);

  const initialLayoutMap = new Map<TUIElement | TUITextNode, ElementLayout>();
  extractElementLayout(rootElement, initialLayoutMap);

  currentBuffer.clear();
  renderElementToBuffer(rootElement, currentBuffer, initialLayoutMap);

  // Render buffer to terminal
  const initialOutput = currentBuffer.toString();
  process.stdout.write(initialOutput);

  // Track how many lines we rendered
  lastOutputHeight = initialOutput.split('\n').length;

  // Move cursor to TOP of app
  const newlineCount = (initialOutput.match(/\n/g) || []).length;
  for (let i = 0; i < newlineCount; i++) {
    process.stdout.write('\x1b[1A'); // Move up
  }
  process.stdout.write('\r');

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
