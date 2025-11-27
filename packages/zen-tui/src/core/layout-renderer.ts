/**
 * Layout-based Renderer
 *
 * Renders TUI nodes to TerminalBuffer using Yoga layout positions.
 */

import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
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
  // Skip empty strings - no need for escape codes
  if (!text) return '';

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
  if (style.inverse) {
    const inverse = typeof style.inverse === 'function' ? style.inverse() : style.inverse;
    if (inverse) {
      codes += '\x1b[7m';
      resetCodes = `\x1b[27m${resetCodes}`; // reset inverse
    }
  }

  return codes + text + resetCodes;
}

/**
 * Fill a rectangular area with spaces (clear background)
 */
function fillArea(
  buffer: TerminalBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor?: string,
): void {
  const bgCode = bgColor ? getBgColorCode(bgColor) : '';
  // Add background reset at end to prevent bleeding to adjacent content
  const fillLine = bgColor ? `${bgCode + ' '.repeat(width)}\x1b[49m` : ' '.repeat(width);

  for (let row = 0; row < height; row++) {
    buffer.writeAt(x, y + row, fillLine, width, false); // replace=false to preserve borders
  }
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
  backgroundColor?: string,
): void {
  const box = cliBoxes[borderStyle as keyof typeof cliBoxes] || cliBoxes.single;

  const colorFn = borderColor ? getColorFn(borderColor) : (s: string) => s;

  // Top border
  const topBorder = colorFn(box.topLeft + box.top.repeat(Math.max(0, width - 2)) + box.topRight);
  buffer.writeAt(x, y, topBorder, width);

  // Side borders and fill content area with background
  for (let i = 1; i < height - 1; i++) {
    buffer.writeAt(x, y + i, colorFn(box.left), 1);
    // Fill content area (between left and right borders) with background
    if (backgroundColor && width > 2) {
      const bgCode = getBgColorCode(backgroundColor);
      // Add background reset at end to prevent bleeding to right border
      const fillLine = `${bgCode + ' '.repeat(width - 2)}\x1b[49m`;
      buffer.writeAt(x + 1, y + i, fillLine, width - 2, true);
    }
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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: rendering logic requires handling many cases
function renderNodeToBuffer(
  node: TUINode,
  buffer: TerminalBuffer,
  layoutMap: LayoutMap,
  offsetX = 0,
  offsetY = 0,
  clipMinY?: number, // Optional viewport clipping (min Y)
  clipMaxY?: number, // Optional viewport clipping (max Y)
  skipAbsolute = false, // Skip absolute positioned nodes (rendered separately for zIndex)
): void {
  // Get style (resolve functions)
  const preStyle = typeof node.style === 'function' ? node.style() : node.style || {};
  const positionType =
    typeof preStyle.position === 'function' ? preStyle.position() : preStyle.position;

  // Skip absolute positioned nodes if requested (they're rendered separately for zIndex ordering)
  if (skipAbsolute && positionType === 'absolute') {
    return;
  }
  const layout = layoutMap.get(node);
  if (!layout) {
    return;
  }

  const x = Math.floor(layout.x + offsetX);
  const y = Math.floor(layout.y + offsetY);
  const width = Math.floor(layout.width);
  const height = Math.floor(layout.height);

  // Get style (resolve functions)
  const style = typeof node.style === 'function' ? node.style() : node.style || {};

  // Render border if specified (also fills background to clear previous content)
  if (style.borderStyle && style.borderStyle !== 'none') {
    const borderStyle =
      typeof style.borderStyle === 'function' ? style.borderStyle() : style.borderStyle;
    const borderColor =
      typeof style.borderColor === 'function' ? style.borderColor() : style.borderColor;
    const backgroundColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;

    if (borderStyle && borderStyle !== 'none') {
      renderBorder(buffer, x, y, width, height, borderStyle, borderColor, backgroundColor);
    }
  } else if (style.backgroundColor) {
    // Fill background even without border
    const backgroundColor =
      typeof style.backgroundColor === 'function' ? style.backgroundColor() : style.backgroundColor;
    if (backgroundColor) {
      fillArea(buffer, x, y, width, height, backgroundColor);
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

  // Set viewport clipping bounds for children
  // Apply clipping for: ScrollBox, bordered boxes, or overflow: 'hidden'
  const hasOverflowHidden = style.overflow === 'hidden';
  let childClipMinY = clipMinY;
  let childClipMaxY = clipMaxY;
  let childClipMinX = undefined as number | undefined;
  let childClipMaxX = undefined as number | undefined;
  if (isScrollBox || hasBorder || hasOverflowHidden) {
    // Clip children to content area
    childClipMinY = clipMinY !== undefined ? Math.max(clipMinY, contentY) : contentY;
    childClipMaxY =
      clipMaxY !== undefined
        ? Math.min(clipMaxY, contentY + contentHeight)
        : contentY + contentHeight;
    // Also clip X for overflow: hidden
    if (hasOverflowHidden) {
      childClipMinX = contentX;
      childClipMaxX = contentX + contentWidth;
    }
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
    // Skip if text would be rendered outside clip bounds
    if (clipMinY !== undefined && clipMaxY !== undefined) {
      if (contentY < clipMinY || contentY >= clipMaxY) {
        return; // Text line is outside visible area
      }
    }

    // Collect styled text from all children including nested Text nodes
    // Each segment has its own style that may override parent style
    const collectStyledText = (
      children: (string | TUINode)[],
      parentStyle: TUIStyle,
    ): string => {
      return children
        .map((child) => {
          if (typeof child === 'string') {
            // Skip empty strings entirely
            if (!child) return '';
            return applyTextStyle(child, parentStyle);
          }
          if (typeof child === 'object' && child !== null && 'type' in child) {
            const childNode = child as TUINode;
            // Nested Text node - merge styles (child overrides parent)
            if (childNode.type === 'text') {
              const childStyle =
                typeof childNode.style === 'function' ? childNode.style() : childNode.style || {};
              const mergedStyle = { ...parentStyle, ...childStyle };
              return collectStyledText(childNode.children, mergedStyle);
            }
            // Fragment nodes - inherit parent style
            if (childNode.type === 'fragment' && Array.isArray(childNode.children)) {
              return collectStyledText(childNode.children, parentStyle);
            }
          }
          return '';
        })
        .join('');
    };

    const styledText = collectStyledText(node.children, node.style);
    buffer.writeAt(contentX, contentY, styledText, contentWidth);
    return;
  }

  // Render fragment node - transparent container, just render children
  if (node.type === 'fragment') {
    for (const child of node.children) {
      if (typeof child === 'string') {
        const styledText = applyTextStyle(child, style);
        buffer.writeAt(contentX, contentY, styledText, contentWidth);
      } else if (typeof child === 'object' && child !== null && 'type' in child) {
        renderNodeToBuffer(
          child as TUINode,
          buffer,
          layoutMap,
          offsetX,
          offsetY,
          clipMinY,
          clipMaxY,
          skipAbsolute,
        );
      }
    }
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
        // Calculate child offset (ScrollBox needs special handling)
        const contentOffsetX = isScrollBox ? paddingX : 0;
        const contentOffsetY = isScrollBox ? paddingY : 0;
        const childOffsetX = offsetX + contentOffsetX;
        const childOffsetY = isScrollBox
          ? offsetY - scrollOffset + contentOffsetY
          : offsetY + contentOffsetY;

        if ('type' in child) {
          const childNode = child as TUINode;

          // Fragment nodes are transparent - render their children directly
          if (childNode.type === 'fragment') {
            for (const fragmentChild of childNode.children) {
              if (typeof fragmentChild === 'string') {
                const styledText = applyTextStyle(fragmentChild, style);
                buffer.writeAt(contentX, contentY, styledText, contentWidth);
              } else if (
                typeof fragmentChild === 'object' &&
                fragmentChild !== null &&
                'type' in fragmentChild
              ) {
                renderNodeToBuffer(
                  fragmentChild as TUINode,
                  buffer,
                  layoutMap,
                  childOffsetX,
                  childOffsetY,
                  childClipMinY,
                  childClipMaxY,
                  skipAbsolute,
                );
              }
            }
          } else {
            // Regular TUINode
            renderNodeToBuffer(
              childNode,
              buffer,
              layoutMap,
              childOffsetX,
              childOffsetY,
              childClipMinY,
              childClipMaxY,
              skipAbsolute,
            );
          }
        }
      }
    }
  }
}

/**
 * Render TUI tree to TerminalBuffer using layout
 * Handles zIndex ordering for absolute positioned elements
 */
export function renderToBuffer(node: TUINode, buffer: TerminalBuffer, layoutMap: LayoutMap): void {
  buffer.clear();

  // First pass: render all nodes without zIndex awareness (for relative elements)
  // Then sort absolute-positioned elements by zIndex

  // For simplicity and correctness, we collect all absolute positioned nodes,
  // render normal flow first, then render absolute positioned in zIndex order
  const absoluteNodes: Array<{
    node: TUINode;
    parentLayout: { x: number; y: number };
    zIndex: number;
  }> = [];

  // Recursive function to find absolute nodes
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Recursive tree traversal requires complex conditionals
  function findAbsoluteNodes(
    n: TUINode,
    parentLayout: { x: number; y: number } = { x: 0, y: 0 },
  ): void {
    const style = typeof n.style === 'function' ? n.style() : n.style || {};
    const layout = layoutMap.get(n);

    const positionValue = typeof style.position === 'function' ? style.position() : style.position;
    if (positionValue === 'absolute' && layout) {
      const zIndexValue = typeof style.zIndex === 'function' ? style.zIndex() : style.zIndex;
      const zIndex = typeof zIndexValue === 'number' ? zIndexValue : 0;
      absoluteNodes.push({ node: n, parentLayout, zIndex });
    }

    // Continue searching children
    if (n.children && layout) {
      for (const child of n.children) {
        if (typeof child === 'object' && child !== null && 'type' in child) {
          findAbsoluteNodes(child as TUINode, { x: layout.x, y: layout.y });
        }
      }
    }
  }

  // Collect all absolute positioned nodes
  findAbsoluteNodes(node);

  // Render normal flow first
  renderNodeToBuffer(node, buffer, layoutMap, 0, 0, undefined, undefined, true);

  // Sort absolute nodes by zIndex and render them
  absoluteNodes.sort((a, b) => a.zIndex - b.zIndex);
  for (const { node: absNode } of absoluteNodes) {
    renderNodeToBuffer(absNode, buffer, layoutMap, 0, 0, undefined, undefined, false);
  }
}
