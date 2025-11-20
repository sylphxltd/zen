/**
 * TUI Renderer - Simplified
 *
 * Renders virtual TUI tree to terminal output.
 * Uses simple vertical stacking layout (MVP implementation).
 */

import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
import sliceAnsi from 'slice-ansi';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import type { RenderOutput, TUINode, TUIStyle } from './types.js';

/**
 * Get chalk color function
 */
function getColorFn(color: string) {
  // Map common color names to chalk functions
  const colorMap: Record<string, any> = {
    black: chalk.black,
    red: chalk.red,
    green: chalk.green,
    yellow: chalk.yellow,
    blue: chalk.blue,
    magenta: chalk.magenta,
    cyan: chalk.cyan,
    white: chalk.white,
    gray: chalk.gray,
    grey: chalk.grey,
  };

  return colorMap[color.toLowerCase()] || chalk.hex(color);
}

function getBgColorFn(color: string) {
  const bgColorMap: Record<string, any> = {
    black: chalk.bgBlack,
    red: chalk.bgRed,
    green: chalk.bgGreen,
    yellow: chalk.bgYellow,
    blue: chalk.bgBlue,
    magenta: chalk.bgMagenta,
    cyan: chalk.bgCyan,
    white: chalk.bgWhite,
    gray: chalk.bgGray,
    grey: chalk.bgGrey,
  };

  return bgColorMap[color.toLowerCase()] || chalk.bgHex(color);
}

/**
 * Apply text styling with chalk
 */
function applyTextStyle(text: string, style: TUIStyle = {}): string {
  let styled = text;

  if (style.color) {
    // Resolve reactive color values
    const color = typeof style.color === 'function' ? style.color() : style.color;
    styled = getColorFn(color)(styled);
  }
  if (style.backgroundColor) {
    // Resolve reactive background color values
    const bgColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;
    styled = getBgColorFn(bgColor)(styled);
  }
  if (style.bold) {
    styled = chalk.bold(styled);
  }
  if (style.italic) {
    styled = chalk.italic(styled);
  }
  if (style.underline) {
    styled = chalk.underline(styled);
  }
  if (style.strikethrough) {
    styled = chalk.strikethrough(styled);
  }
  if (style.dim) {
    styled = chalk.dim(styled);
  }

  return styled;
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
      style: {}
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
  const { onKeyPress, fps = 10 } = options;

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor during rendering
  process.stdout.write('\x1b[?25l');

  let isRunning = true;
  let needsRender = true;
  let previousLines: string[] = [];

  // Render function with diff-based updates
  const doRender = async () => {
    if (!needsRender || !isRunning) return;
    needsRender = false;

    const node = createNode();
    await Promise.resolve();
    await Promise.resolve();

    const output = render(node);
    const newLines = output.split('\n');

    // First render: clear screen and draw everything
    if (previousLines.length === 0) {
      // Clear screen properly
      process.stdout.write('\x1b[2J\x1b[H');
      process.stdout.write(output);
      process.stdout.write('\n');
    } else {
      // Diff-based update: only redraw changed lines
      const maxLines = Math.max(previousLines.length, newLines.length);

      for (let i = 0; i < maxLines; i++) {
        const oldLine = previousLines[i] || '';
        const newLine = newLines[i] || '';

        if (oldLine !== newLine) {
          // Move cursor to line i (1-indexed)
          process.stdout.write(`\x1b[${i + 1};1H`);
          // Clear line and write new content
          process.stdout.write('\x1b[2K');
          process.stdout.write(newLine);
        }
      }

      // If new output is shorter, clear remaining lines
      if (previousLines.length > newLines.length) {
        for (let i = newLines.length; i < previousLines.length; i++) {
          process.stdout.write(`\x1b[${i + 1};1H`);
          process.stdout.write('\x1b[2K');
        }
      }
    }

    previousLines = newLines;
  };

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

    // Dispatch to useInput handlers
    const { dispatchInput } = require('./useInput.js');
    dispatchInput(key);

    // Custom key handler
    if (onKeyPress) {
      onKeyPress(key);
    }

    needsRender = true;
  };

  if (process.stdin.isTTY) {
    process.stdin.on('data', keyHandler);
  }

  // Render loop
  const renderInterval = setInterval(() => {
    if (isRunning) {
      needsRender = true;
      doRender();
    }
  }, 1000 / fps);

  // Initial render
  await doRender();

  // Cleanup function
  const cleanup = () => {
    isRunning = false;
    clearInterval(renderInterval);
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
