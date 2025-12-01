/**
 * Layout-based Renderer (ADR-014 Fine-Grained Reactivity)
 *
 * Renders TUI nodes to TerminalBuffer using Yoga layout positions.
 *
 * ## Fine-Grained Rendering
 *
 * This renderer supports two modes:
 *
 * 1. **Full Render** (fullRender=true, default):
 *    - Clears buffer and renders entire tree
 *    - Used for initial render and after layout changes
 *
 * 2. **Incremental Render** (fullRender=false):
 *    - Does NOT clear buffer (preserves unchanged content)
 *    - Only renders nodes with _dirty flag set
 *    - Skips non-dirty subtrees entirely (big performance win)
 *    - Used for signal/content updates
 *
 * ## How Incremental Render Works
 *
 * ```
 * renderToBuffer(root, buffer, layoutMap, false)  // incremental
 *   │
 *   ├─ Don't clear buffer (previous frame preserved)
 *   │
 *   └─ renderNodeToBuffer() for each node:
 *       ├─ If node._dirty: render this node to buffer, clear flag
 *       └─ If not dirty: recurse into children (they might be dirty)
 *                        but skip this node's own buffer writes
 * ```
 *
 * ## Why This Works
 *
 * - Buffer positions are stable (from cached layout)
 * - Non-dirty content hasn't changed
 * - Only dirty nodes need buffer updates
 * - Terminal diff handles the rest
 */

import cliBoxes from 'cli-boxes';
import stripAnsi from 'strip-ansi';
import { terminalWidth } from '../utils/terminal-width.js';
import type { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode, TUIStyle } from './types.js';
import type { LayoutMap } from './yoga-layout.js';

/**
 * Resolve a potentially reactive value to a string.
 * Handles: string, function, Signal (object with .value), or undefined.
 */
function resolveColor(color: unknown): string | undefined {
  if (color === undefined || color === null) return undefined;
  if (typeof color === 'string') return color;
  if (typeof color === 'function') return resolveColor(color());
  if (typeof color === 'object' && 'value' in color)
    return resolveColor((color as { value: unknown }).value);
  return undefined;
}

/**
 * Get ANSI color code - using raw ANSI instead of chalk for reliability
 */
function getColorCode(color: string): string {
  const resolved = resolveColor(color);
  if (!resolved) return '\x1b[37m'; // default white

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
  return colorMap[resolved.toLowerCase()] || '\x1b[37m';
}

function getBgColorCode(color: string): string {
  const resolved = resolveColor(color);
  if (!resolved) return '\x1b[47m'; // default white

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
  return colorMap[resolved.toLowerCase()] || '\x1b[47m';
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
      // Use replace=false to preserve content after the filled area (e.g., parent border)
      const fillLine = `${bgCode + ' '.repeat(width - 2)}\x1b[49m`;
      buffer.writeAt(x + 1, y + i, fillLine, width - 2, false);
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
 *
 * ## Fine-Grained Rendering
 *
 * When fullRender=false (incremental mode):
 * - Skip buffer writes for non-dirty nodes
 * - Still recurse into children (they might be dirty)
 * - Clear _dirty flag after rendering
 *
 * This allows us to update only changed content while preserving
 * unchanged content in the buffer.
 *
 * @param node - The TUINode to render
 * @param buffer - Target buffer
 * @param layoutMap - Precomputed layout positions
 * @param offsetX - X offset (for scroll)
 * @param offsetY - Y offset (for scroll)
 * @param clipMinY - Viewport clipping min Y
 * @param clipMaxY - Viewport clipping max Y
 * @param skipAbsolute - Skip absolute positioned nodes
 * @param clipMinX - Viewport clipping min X
 * @param clipMaxX - Viewport clipping max X
 * @param fullRender - If false, skip non-dirty nodes (incremental mode)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: rendering logic requires handling many cases
function renderNodeToBuffer(
  node: TUINode,
  buffer: TerminalBuffer,
  layoutMap: LayoutMap,
  offsetX = 0,
  offsetY = 0,
  clipMinY?: number,
  clipMaxY?: number,
  skipAbsolute = false,
  clipMinX?: number,
  clipMaxX?: number,
  fullRender = true,
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

  // ============================================================================
  // Fine-Grained Rendering: Check if node is dirty
  // ============================================================================
  // In incremental mode (fullRender=false), we only render dirty nodes.
  // Non-dirty nodes keep their previous buffer content (it hasn't changed).
  //
  // IMPORTANT: We still recurse into children even if this node is not dirty,
  // because children might be dirty (e.g., a Box containing a dirty Text).
  //
  // The dirty flag is checked BEFORE rendering and cleared AFTER.
  const isDirty = node._dirty === true;
  const shouldRenderThisNode = fullRender || isDirty;

  // Clear dirty flag now (before any early returns)
  // This ensures it's cleared even if we return early due to clipping
  if (isDirty) {
    node._dirty = false;
  }

  // Render border if specified (also fills background to clear previous content)
  // Only render if this node is dirty or in full render mode
  if (shouldRenderThisNode) {
    if (style.borderStyle && style.borderStyle !== 'none') {
      const borderStyle =
        typeof style.borderStyle === 'function' ? style.borderStyle() : style.borderStyle;
      const borderColor =
        typeof style.borderColor === 'function' ? style.borderColor() : style.borderColor;
      const backgroundColor =
        typeof style.backgroundColor === 'function'
          ? style.backgroundColor()
          : style.backgroundColor;

      if (borderStyle && borderStyle !== 'none') {
        renderBorder(buffer, x, y, width, height, borderStyle, borderColor, backgroundColor);
      }
    } else if (style.backgroundColor) {
      // Fill background even without border
      const backgroundColor =
        typeof style.backgroundColor === 'function'
          ? style.backgroundColor()
          : style.backgroundColor;
      if (backgroundColor) {
        fillArea(buffer, x, y, width, height, backgroundColor);
      }
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
  let childClipMinX = clipMinX;
  let childClipMaxX = clipMaxX;
  if (isScrollBox || hasBorder || hasOverflowHidden) {
    // Clip children to content area (Y axis)
    childClipMinY = clipMinY !== undefined ? Math.max(clipMinY, contentY) : contentY;
    childClipMaxY =
      clipMaxY !== undefined
        ? Math.min(clipMaxY, contentY + contentHeight)
        : contentY + contentHeight;
    // Clip children to content area (X axis)
    childClipMinX = clipMinX !== undefined ? Math.max(clipMinX, contentX) : contentX;
    childClipMaxX =
      clipMaxX !== undefined
        ? Math.min(clipMaxX, contentX + contentWidth)
        : contentX + contentWidth;
  }

  // Check if this node is completely outside the clipping region
  if (clipMinY !== undefined && clipMaxY !== undefined) {
    const nodeBottom = y + height;
    if (nodeBottom <= clipMinY || y >= clipMaxY) {
      return; // Skip rendering entirely - outside Y clip bounds
    }
  }
  if (clipMinX !== undefined && clipMaxX !== undefined) {
    const nodeRight = x + width;
    if (nodeRight <= clipMinX || x >= clipMaxX) {
      return; // Skip rendering entirely - outside X clip bounds
    }
  }

  // ============================================================================
  // Render text node
  // ============================================================================
  // Text nodes are leaf nodes - they write styled text to the buffer.
  // In incremental mode, skip buffer writes if not dirty.
  if (node.type === 'text') {
    // Skip if text would be rendered outside clip bounds (Y axis)
    if (clipMinY !== undefined && clipMaxY !== undefined) {
      if (contentY < clipMinY || contentY >= clipMaxY) {
        return; // Text line is outside visible area
      }
    }

    // ========================================================================
    // Fine-Grained Rendering: Skip text write if not dirty
    // ========================================================================
    // In incremental mode, if this text node hasn't changed, its previous
    // content is still in the buffer. Skip the write to avoid unnecessary work.
    if (!shouldRenderThisNode) {
      return; // Text unchanged, buffer already has correct content
    }

    // Collect styled text from all children including nested Text nodes
    // Each segment has its own style that may override parent style
    const collectStyledText = (children: (string | TUINode)[], parentStyle: TUIStyle): string => {
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

    // Calculate effective X position and width for clipping
    const effectiveX = contentX;
    let effectiveWidth = contentWidth;

    // Apply X clip bounds if set
    if (clipMinX !== undefined && clipMaxX !== undefined) {
      // Skip if text would be completely outside X clip bounds
      if (contentX >= clipMaxX) {
        return; // Text starts after clip region
      }

      // Constrain effective width to clip bounds
      effectiveWidth = Math.min(contentWidth, clipMaxX - contentX);
    }

    // ========================================================================
    // CRITICAL: Pad text with spaces to clear old content
    // ========================================================================
    // In incremental render mode, if text shrinks (e.g., "Hello World" → "Hi"),
    // we need to clear the old characters. We do this by padding the text with
    // spaces to fill the entire effectiveWidth.
    //
    // This ensures that when content shrinks, old characters are overwritten
    // with spaces rather than remaining in the buffer.
    const textVisualWidth = terminalWidth(stripAnsi(styledText));
    const paddingNeeded = Math.max(0, effectiveWidth - textVisualWidth);
    const paddedText = paddingNeeded > 0 ? styledText + ' '.repeat(paddingNeeded) : styledText;

    buffer.writeAt(effectiveX, contentY, paddedText, effectiveWidth);
    return;
  }

  // ============================================================================
  // Render fragment node - transparent container
  // ============================================================================
  // Fragments are like React.Fragment - they group children without adding
  // a container element. We render their children directly.
  //
  // Fine-Grained: Fragment itself doesn't write to buffer, but we still
  // need to check shouldRenderThisNode for direct text children.
  // Child nodes will check their own dirty flags.
  if (node.type === 'fragment') {
    for (const child of node.children) {
      if (typeof child === 'string') {
        // Direct text child of fragment - only render if fragment is dirty
        if (shouldRenderThisNode) {
          const styledText = applyTextStyle(child, style);
          // Pad with spaces to clear old content (same as text nodes)
          const textVisualWidth = terminalWidth(stripAnsi(styledText));
          const paddingNeeded = Math.max(0, contentWidth - textVisualWidth);
          const paddedText =
            paddingNeeded > 0 ? styledText + ' '.repeat(paddingNeeded) : styledText;
          buffer.writeAt(contentX, contentY, paddedText, contentWidth);
        }
      } else if (typeof child === 'object' && child !== null && 'type' in child) {
        // Recurse into child node - it will check its own dirty flag
        renderNodeToBuffer(
          child as TUINode,
          buffer,
          layoutMap,
          offsetX,
          offsetY,
          clipMinY,
          clipMaxY,
          skipAbsolute,
          clipMinX,
          clipMaxX,
          fullRender, // Pass through full render mode
        );
      }
    }
    return;
  }

  // ============================================================================
  // Skip Static node children - they go to terminal scrollback, not buffer
  // ============================================================================
  // Static nodes (tagName: 'static') are special: their children are printed
  // directly to stdout and persist in terminal scrollback. They are NOT
  // rendered to the managed buffer. The TUIRenderer handles printing new
  // static items before each render cycle.
  if (node.tagName === 'static') {
    return; // Don't render children - handled by TUIRenderer static output
  }

  // ============================================================================
  // Render children
  // ============================================================================
  // Iterate through all children and render them.
  //
  // Fine-Grained Rendering:
  // - Plain text children: only render if THIS node is dirty
  // - Child nodes: recurse and let them check their own dirty flags
  // - Always recurse into children even if this node is not dirty,
  //   because descendants might be dirty
  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'string') {
        // Plain text child - only render if this node is dirty
        // In incremental mode, unchanged text is already in the buffer
        if (shouldRenderThisNode) {
          const styledText = applyTextStyle(child, style);
          // Pad with spaces to clear old content when text shrinks
          const textVisualWidth = terminalWidth(stripAnsi(styledText));
          const paddingNeeded = Math.max(0, contentWidth - textVisualWidth);
          const paddedText =
            paddingNeeded > 0 ? styledText + ' '.repeat(paddingNeeded) : styledText;
          buffer.writeAt(contentX, contentY, paddedText, contentWidth);
        }
      } else if (typeof child === 'object' && child !== null) {
        // Calculate child offset
        // Yoga's getComputedLeft() already includes parent's border/padding
        // So extractLayout stores correct absolute positions - no additional offset needed
        // Exception: ScrollBox needs to apply scroll offset to shift content
        const childOffsetX = 0;
        const childOffsetY = isScrollBox ? -scrollOffset : 0;

        if ('type' in child) {
          const childNode = child as TUINode;

          // Fragment nodes are transparent - render their children directly
          if (childNode.type === 'fragment') {
            // Check if fragment itself is dirty (for its text children)
            const fragmentIsDirty = childNode._dirty === true;
            const shouldRenderFragment = fullRender || fragmentIsDirty;

            // Clear fragment's dirty flag
            if (fragmentIsDirty) {
              childNode._dirty = false;
            }

            for (const fragmentChild of childNode.children) {
              if (typeof fragmentChild === 'string') {
                // Fragment's direct text child - only render if fragment is dirty
                if (shouldRenderFragment) {
                  const styledText = applyTextStyle(fragmentChild, style);
                  // Pad with spaces to clear old content when text shrinks
                  const textVisualWidth = terminalWidth(stripAnsi(styledText));
                  const paddingNeeded = Math.max(0, contentWidth - textVisualWidth);
                  const paddedText =
                    paddingNeeded > 0 ? styledText + ' '.repeat(paddingNeeded) : styledText;
                  buffer.writeAt(contentX, contentY, paddedText, contentWidth);
                }
              } else if (
                typeof fragmentChild === 'object' &&
                fragmentChild !== null &&
                'type' in fragmentChild
              ) {
                // Fragment's node child - recurse and let it check its dirty flag
                renderNodeToBuffer(
                  fragmentChild as TUINode,
                  buffer,
                  layoutMap,
                  childOffsetX,
                  childOffsetY,
                  childClipMinY,
                  childClipMaxY,
                  skipAbsolute,
                  childClipMinX,
                  childClipMaxX,
                  fullRender, // Pass through full render mode
                );
              }
            }
          } else {
            // Regular TUINode - recurse and let it check its own dirty flag
            renderNodeToBuffer(
              childNode,
              buffer,
              layoutMap,
              childOffsetX,
              childOffsetY,
              childClipMinY,
              childClipMaxY,
              skipAbsolute,
              childClipMinX,
              childClipMaxX,
              fullRender, // Pass through full render mode
            );
          }
        }
      }
    }
  }
}

/**
 * Render TUI tree to TerminalBuffer using layout
 *
 * ## Fine-Grained Rendering Modes
 *
 * This function supports two rendering modes controlled by the `fullRender` parameter:
 *
 * **fullRender=true (default)**: Full render mode
 * - Clears the entire buffer first
 * - Renders all nodes regardless of dirty state
 * - Used for: initial render, terminal resize, layout changes
 *
 * **fullRender=false**: Incremental render mode
 * - Does NOT clear the buffer (preserves unchanged content)
 * - Only renders nodes with _dirty flag set
 * - Skips buffer writes for non-dirty nodes
 * - Used for: signal updates, content changes without layout change
 *
 * ## Performance Benefits
 *
 * In incremental mode:
 * - Buffer writes are O(dirty nodes) instead of O(all nodes)
 * - Combined with terminal diff, only changed lines are output
 * - Yoga layout is skipped (cached positions reused)
 *
 * @param node - Root TUINode to render
 * @param buffer - Target TerminalBuffer
 * @param layoutMap - Precomputed layout positions from Yoga
 * @param fullRender - If true, clear buffer and render all; if false, render only dirty nodes
 */
export function renderToBuffer(
  node: TUINode,
  buffer: TerminalBuffer,
  layoutMap: LayoutMap,
  fullRender = true,
): void {
  // ============================================================================
  // Buffer Clear: Only in full render mode
  // ============================================================================
  // In incremental mode, we preserve existing buffer content.
  // Non-dirty nodes haven't changed, so their previous buffer content is still valid.
  if (fullRender) {
    buffer.clear();
  }

  // ============================================================================
  // First pass: Collect absolute positioned nodes
  // ============================================================================
  // We need to handle zIndex ordering for absolute positioned elements.
  // These are rendered after normal flow to ensure correct layering.
  const absoluteNodes: Array<{
    node: TUINode;
    parentLayout: { x: number; y: number };
    zIndex: number;
  }> = [];

  // Recursive function to find absolute nodes in the tree
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

  // ============================================================================
  // Second pass: Render normal flow
  // ============================================================================
  // Render all nodes in normal document flow (position: relative/static).
  // In incremental mode, only dirty nodes will actually write to buffer.
  renderNodeToBuffer(
    node,
    buffer,
    layoutMap,
    0, // offsetX
    0, // offsetY
    undefined, // clipMinY
    undefined, // clipMaxY
    true, // skipAbsolute - don't render absolute nodes in this pass
    undefined, // clipMinX
    undefined, // clipMaxX
    fullRender, // Pass through render mode
  );

  // ============================================================================
  // Third pass: Render absolute positioned nodes by zIndex
  // ============================================================================
  // Absolute nodes are rendered in zIndex order to ensure correct layering.
  // In incremental mode, only dirty absolute nodes will write to buffer.
  absoluteNodes.sort((a, b) => a.zIndex - b.zIndex);
  for (const { node: absNode } of absoluteNodes) {
    renderNodeToBuffer(
      absNode,
      buffer,
      layoutMap,
      0, // offsetX
      0, // offsetY
      undefined, // clipMinY
      undefined, // clipMaxY
      false, // skipAbsolute - render this absolute node
      undefined, // clipMinX
      undefined, // clipMaxX
      fullRender, // Pass through render mode
    );
  }
}
