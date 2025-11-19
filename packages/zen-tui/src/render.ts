/**
 * TUI Renderer - Simplified
 *
 * Renders virtual TUI tree to terminal output.
 * Uses simple vertical stacking layout (MVP implementation).
 */

import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
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
    styled = getColorFn(style.color)(styled);
  }
  if (style.backgroundColor) {
    styled = getBgColorFn(style.backgroundColor)(styled);
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
  borderStyle: string = 'single',
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
  const before = line.slice(0, x);
  const contentWidth = stringWidth(stripAnsi(content));
  const after = line.slice(x + contentWidth);

  boxLines[y] = before + content + after;
}

/**
 * Render TUI node to string - simplified version
 */
function renderNode(node: TUINode, parentWidth: number): RenderOutput {
  // Get dimensions from style or use defaults
  const width = typeof node.style?.width === 'number' ? node.style.width : parentWidth || 80;
  const padding = node.style?.padding || 1;
  const paddingLeft = node.style?.paddingLeft || padding;
  const paddingTop = node.style?.paddingTop || padding;

  const lines: string[] = [];

  // Render border or plain box
  if (node.style?.borderStyle && node.style.borderStyle !== 'none') {
    const height = typeof node.style?.height === 'number' ? node.style.height : 10;
    const borderLines = renderBorder(width, height, node.style.borderStyle, node.style.borderColor);
    lines.push(...borderLines);
  } else {
    // No border - create empty lines
    const height = typeof node.style?.height === 'number' ? node.style.height : 10;
    for (let i = 0; i < height; i++) {
      let line = ' '.repeat(width);
      if (node.style?.backgroundColor) {
        line = getBgColorFn(node.style.backgroundColor)(line);
      }
      lines.push(line);
    }
  }

  // Render children
  let currentY = paddingTop;

  for (const child of node.children) {
    if (typeof child === 'string') {
      // Text content
      const textContent = applyTextStyle(child, node.style);
      insertContent(lines, textContent, paddingLeft, currentY, width);
      currentY += 1;
    } else {
      // Child node - render recursively
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

  return {
    text: lines.join('\n'),
    width,
    height: lines.length,
  };
}

/**
 * Render TUI tree to terminal
 */
export function render(node: TUINode, options: { width?: number } = {}): string {
  const terminalWidth = options.width || process.stdout.columns || 80;
  const output = renderNode(node, terminalWidth);
  return output.text;
}

/**
 * Render and display in terminal
 */
export function renderToTerminal(node: TUINode): void {
  const output = render(node);

  // Clear terminal
  console.clear();

  // Output to terminal
  console.log(output);
}
