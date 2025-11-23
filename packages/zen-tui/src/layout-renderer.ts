/**
 * Layout-based Renderer
 *
 * Renders TUI nodes to TerminalBuffer using Yoga layout positions.
 */

import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
import stringWidth from 'string-width';
import type { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode, TUIStyle } from './types.js';
import type { LayoutMap } from './yoga-layout.js';

/**
 * Get ANSI color code - using raw ANSI instead of chalk for reliability
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

function getBgColorCode(color: string): string {
  const colorMap: Record<string, string> = {
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
  return colorMap[color.toLowerCase()] || '\x1b[47m';
}

function getColorFn(color: string) {
  const code = getColorCode(color);
  return (text: string) => `${code + text}\x1b[39m`; // reset to default color
}

/**
 * Apply text styling using raw ANSI codes
 */
function applyTextStyle(text: string, style: TUIStyle = {}): string {
  let codes = '';
  let resetCodes = '';

  if (style.color) {
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`; // reset color
  }
  if (style.backgroundColor) {
    const bgColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;
    codes += getBgColorCode(bgColor);
    resetCodes = `\x1b[49m${resetCodes}`; // reset bg
  }
  if (style.bold) {
    const bold = typeof style.bold === 'function' ? style.bold() : style.bold;
    if (bold) {
      codes += '\x1b[1m';
      resetCodes = `\x1b[22m${resetCodes}`; // reset bold
    }
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
  buffer: TerminalBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  borderStyle: string,
  borderColor?: string,
): void {
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

/**
 * Render a single node to buffer using layout position
 */
function renderNodeToBuffer(
  node: TUINode,
  buffer: TerminalBuffer,
  layoutMap: LayoutMap,
  offsetX = 0,
  offsetY = 0,
  clipMinY?: number, // Optional viewport clipping (min Y)
  clipMaxY?: number, // Optional viewport clipping (max Y)
): void {
  const layout = layoutMap.get(node);
  if (!layout) return;

  const x = Math.floor(layout.x + offsetX);
  const y = Math.floor(layout.y + offsetY);
  const width = Math.floor(layout.width);
  const height = Math.floor(layout.height);

  // Get style (resolve functions)
  const style = typeof node.style === 'function' ? node.style() : node.style || {};

  // Render border if specified
  if (style.borderStyle && style.borderStyle !== 'none') {
    const borderStyle =
      typeof style.borderStyle === 'function' ? style.borderStyle() : style.borderStyle;
    const borderColor =
      typeof style.borderColor === 'function' ? style.borderColor() : style.borderColor;

    if (borderStyle && borderStyle !== 'none') {
      renderBorder(buffer, x, y, width, height, borderStyle, borderColor);
    }
  }

  // Calculate content area (inside border and padding)
  const hasBorder = style.borderStyle && style.borderStyle !== 'none';
  const borderOffset = hasBorder ? 1 : 0;
  const padding = style.padding ?? 0;
  const paddingX = style.paddingX ?? padding;
  const paddingY = style.paddingY ?? padding;

  const contentX = x + borderOffset + paddingX;
  const contentY = y + borderOffset + paddingY;
  const contentWidth = width - 2 * borderOffset - 2 * paddingX;
  const contentHeight = height - 2 * borderOffset - 2 * paddingY;

  // Handle ScrollBox - apply scroll offset and set viewport clipping
  const isScrollBox = node.tagName === 'scrollbox';
  const scrollOffset = isScrollBox && node.props?.scrollOffset ? node.props.scrollOffset.value : 0;

  // Set viewport clipping bounds for ScrollBox children
  let childClipMinY = clipMinY;
  let childClipMaxY = clipMaxY;
  if (isScrollBox) {
    childClipMinY = contentY;
    childClipMaxY = contentY + contentHeight;
  }

  // Check if this node is completely outside the clipping region
  if (clipMinY !== undefined && clipMaxY !== undefined) {
    const nodeBottom = y + height;
    if (nodeBottom <= clipMinY || y >= clipMaxY) {
      return; // Skip rendering entirely
    }
  }

  // Render text node
  if (node.type === 'text') {
    const textContent = node.children
      .map((child) => (typeof child === 'string' ? child : ''))
      .join('');

    const styledText = applyTextStyle(textContent, node.style);
    buffer.writeAt(contentX, contentY, styledText, contentWidth);
    return;
  }

  // Render children
  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'string') {
        // Plain text child
        const styledText = applyTextStyle(child, style);
        buffer.writeAt(contentX, contentY, styledText, contentWidth);
      } else if (typeof child === 'object' && child !== null) {
        if ('_type' in child && child._type === 'marker') {
          // Reactive marker - render its children
          const marker = child as any;
          if (marker.children && Array.isArray(marker.children)) {
            for (const markerChild of marker.children) {
              if (typeof markerChild === 'string') {
                const styledText = applyTextStyle(markerChild, style);
                buffer.writeAt(contentX, contentY, styledText, contentWidth);
              } else if (
                typeof markerChild === 'object' &&
                markerChild !== null &&
                'type' in markerChild
              ) {
                // Apply scroll offset for ScrollBox children
                const childOffsetY = isScrollBox ? offsetY - scrollOffset : offsetY;

                renderNodeToBuffer(
                  markerChild as TUINode,
                  buffer,
                  layoutMap,
                  offsetX,
                  childOffsetY,
                  childClipMinY,
                  childClipMaxY,
                );
              }
            }
          }
        } else if ('type' in child) {
          // Regular TUINode
          // Apply scroll offset for ScrollBox children
          const childOffsetY = isScrollBox ? offsetY - scrollOffset : offsetY;

          renderNodeToBuffer(
            child as TUINode,
            buffer,
            layoutMap,
            offsetX,
            childOffsetY,
            childClipMinY,
            childClipMaxY,
          );
        }
      }
    }
  }
}

/**
 * Render TUI tree to TerminalBuffer using layout
 */
export function renderToBuffer(node: TUINode, buffer: TerminalBuffer, layoutMap: LayoutMap): void {
  buffer.clear();
  renderNodeToBuffer(node, buffer, layoutMap);
}
