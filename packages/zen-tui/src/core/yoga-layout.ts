/**
 * Yoga Layout Integration for TUI
 *
 * Computes flexbox layout for TUI nodes, enabling fine-grained updates.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initYoga, { type Yoga } from 'yoga-wasm-web';
import { terminalWidth } from '../utils/terminal-width.js';
import type { TUINode, TUIStyle } from './types.js';

// Initialize Yoga WASM once
let yogaInstance: Yoga | null = null;
let yogaInitPromise: Promise<Yoga> | null = null;

async function getYoga(): Promise<Yoga> {
  if (yogaInstance) return yogaInstance;
  if (yogaInitPromise) return yogaInitPromise;

  yogaInitPromise = (async () => {
    // Load WASM file manually for Bun compatibility
    // In monorepo workspace, node_modules is at root level
    let wasmPath: string;
    try {
      // Try to resolve from node_modules (works in both dev and production)
      const yogaModulePath = dirname(fileURLToPath(import.meta.resolve('yoga-wasm-web')));
      wasmPath = join(yogaModulePath, 'yoga.wasm');
    } catch {
      // Fallback to relative path from package
      const currentDir = dirname(fileURLToPath(import.meta.url));
      wasmPath = join(currentDir, '../node_modules/yoga-wasm-web/dist/yoga.wasm');
    }

    const wasmBuffer = readFileSync(wasmPath);
    // Convert Node.js Buffer to ArrayBuffer for WASM
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

export interface LayoutResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutMap = Map<TUINode, LayoutResult>;

/**
 * Convert TUIStyle to Yoga node configuration
 */
// biome-ignore lint/suspicious/noExplicitAny: yoga-wasm-web doesn't provide types
function applyStylesToYogaNode(yogaNode: any, style: TUIStyle, Yoga: any) {
  // FlexDirection
  if (style.flexDirection === 'row') {
    yogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
  } else if (style.flexDirection === 'column') {
    yogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
  }

  // JustifyContent
  if (style.justifyContent === 'center') {
    yogaNode.setJustifyContent(Yoga.JUSTIFY_CENTER);
  } else if (style.justifyContent === 'flex-start') {
    yogaNode.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
  } else if (style.justifyContent === 'flex-end') {
    yogaNode.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
  } else if (style.justifyContent === 'space-between') {
    yogaNode.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
  } else if (style.justifyContent === 'space-around') {
    yogaNode.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
  }

  // AlignItems
  if (style.alignItems === 'center') {
    yogaNode.setAlignItems(Yoga.ALIGN_CENTER);
  } else if (style.alignItems === 'flex-start') {
    yogaNode.setAlignItems(Yoga.ALIGN_FLEX_START);
  } else if (style.alignItems === 'flex-end') {
    yogaNode.setAlignItems(Yoga.ALIGN_FLEX_END);
  }

  // Width - resolve functions
  const widthValue = typeof style.width === 'function' ? style.width() : style.width;
  if (typeof widthValue === 'number') {
    yogaNode.setWidth(widthValue);
  } else if (widthValue === 'auto') {
    yogaNode.setWidthAuto();
  } else if (typeof widthValue === 'string' && widthValue.endsWith('%')) {
    yogaNode.setWidthPercent(Number.parseFloat(widthValue));
  }

  // Height - resolve functions
  const heightValue = typeof style.height === 'function' ? style.height() : style.height;
  if (typeof heightValue === 'number') {
    yogaNode.setHeight(heightValue);
  } else if (heightValue === 'auto') {
    yogaNode.setHeightAuto();
  } else if (typeof heightValue === 'string' && heightValue.endsWith('%')) {
    yogaNode.setHeightPercent(Number.parseFloat(heightValue));
  }

  // MinWidth / MaxWidth
  if (typeof style.minWidth === 'number') {
    yogaNode.setMinWidth(style.minWidth);
  }
  if (typeof style.maxWidth === 'number') {
    yogaNode.setMaxWidth(style.maxWidth);
  }

  // MinHeight / MaxHeight
  if (typeof style.minHeight === 'number') {
    yogaNode.setMinHeight(style.minHeight);
  }
  if (typeof style.maxHeight === 'number') {
    yogaNode.setMaxHeight(style.maxHeight);
  }

  // Border - Yoga has border support!
  // Check if border exists
  let hasBorder = false;
  if (style.borderStyle) {
    if (typeof style.borderStyle === 'function') {
      const resolved = style.borderStyle();
      hasBorder = resolved && resolved !== 'none';
    } else {
      hasBorder = style.borderStyle !== 'none';
    }
  }

  // Set border width in Yoga (1px on all sides if border exists)
  if (hasBorder) {
    yogaNode.setBorder(Yoga.EDGE_TOP, 1);
    yogaNode.setBorder(Yoga.EDGE_BOTTOM, 1);
    yogaNode.setBorder(Yoga.EDGE_LEFT, 1);
    yogaNode.setBorder(Yoga.EDGE_RIGHT, 1);
  }

  // Padding
  const padding = style.padding ?? 0;
  const paddingX = style.paddingX ?? padding;
  const paddingY = style.paddingY ?? padding;
  yogaNode.setPadding(Yoga.EDGE_TOP, paddingY);
  yogaNode.setPadding(Yoga.EDGE_BOTTOM, paddingY);
  yogaNode.setPadding(Yoga.EDGE_LEFT, paddingX);
  yogaNode.setPadding(Yoga.EDGE_RIGHT, paddingX);

  // Margin
  if (typeof style.margin === 'number') {
    yogaNode.setMargin(Yoga.EDGE_ALL, style.margin);
  }
  if (typeof style.marginX === 'number') {
    yogaNode.setMargin(Yoga.EDGE_LEFT, style.marginX);
    yogaNode.setMargin(Yoga.EDGE_RIGHT, style.marginX);
  }
  if (typeof style.marginY === 'number') {
    yogaNode.setMargin(Yoga.EDGE_TOP, style.marginY);
    yogaNode.setMargin(Yoga.EDGE_BOTTOM, style.marginY);
  }

  // Flex - resolve functions
  const flexValue = typeof style.flex === 'function' ? style.flex() : style.flex;
  if (typeof flexValue === 'number') {
    yogaNode.setFlex(flexValue);
  }
  const flexGrowValue = typeof style.flexGrow === 'function' ? style.flexGrow() : style.flexGrow;
  if (typeof flexGrowValue === 'number') {
    yogaNode.setFlexGrow(flexGrowValue);
  }
  const flexShrinkValue =
    typeof style.flexShrink === 'function' ? style.flexShrink() : style.flexShrink;
  if (typeof flexShrinkValue === 'number') {
    yogaNode.setFlexShrink(flexShrinkValue);
  }

  // Gap - space between flex children
  if (typeof style.gap === 'number') {
    yogaNode.setGap(Yoga.GUTTER_ALL, style.gap);
  }

  // Position type (relative is default) - resolve functions
  const positionValue = typeof style.position === 'function' ? style.position() : style.position;
  if (positionValue === 'absolute') {
    yogaNode.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
  } else if (positionValue === 'relative') {
    yogaNode.setPositionType(Yoga.POSITION_TYPE_RELATIVE);
  }

  // Position offsets (left/top/right/bottom) - resolve functions
  const leftValue = typeof style.left === 'function' ? style.left() : style.left;
  if (typeof leftValue === 'number') {
    yogaNode.setPosition(Yoga.EDGE_LEFT, leftValue);
  }

  const topValue = typeof style.top === 'function' ? style.top() : style.top;
  if (typeof topValue === 'number') {
    yogaNode.setPosition(Yoga.EDGE_TOP, topValue);
  }

  const rightValue = typeof style.right === 'function' ? style.right() : style.right;
  if (typeof rightValue === 'number') {
    yogaNode.setPosition(Yoga.EDGE_RIGHT, rightValue);
  }

  const bottomValue = typeof style.bottom === 'function' ? style.bottom() : style.bottom;
  if (typeof bottomValue === 'number') {
    yogaNode.setPosition(Yoga.EDGE_BOTTOM, bottomValue);
  }
}

/**
 * Build Yoga node tree from TUI node tree
 */
// biome-ignore lint/suspicious/noExplicitAny: yoga-wasm-web doesn't provide types
function buildYogaTree(tuiNode: TUINode, yogaNodeMap: Map<TUINode, any>, Yoga: any): any {
  const yogaNode = Yoga.Node.create();
  yogaNodeMap.set(tuiNode, yogaNode);

  // Apply styles
  const style = typeof tuiNode.style === 'function' ? tuiNode.style() : tuiNode.style || {};
  applyStylesToYogaNode(yogaNode, style, Yoga);

  // Calculate total content width for text nodes
  // Helper to recursively collect text width from all children (including nested Text nodes)
  const collectTextWidth = (children: (string | TUINode)[]): number => {
    let width = 0;
    for (const child of children) {
      if (typeof child === 'string') {
        width += terminalWidth(child);
      } else if (typeof child === 'object' && child !== null && 'type' in child) {
        const childNode = child as TUINode;
        // For nested Text nodes, recursively collect their text width
        if (childNode.type === 'text' && childNode.children) {
          width += collectTextWidth(childNode.children);
        }
        // For fragments, also collect their children's width
        if (childNode.type === 'fragment' && childNode.children) {
          width += collectTextWidth(childNode.children);
        }
      }
    }
    return width;
  };

  let totalTextWidth = 0;
  let hasStringChildren = false;

  // Handle children
  if (tuiNode.children) {
    for (const child of tuiNode.children) {
      if (typeof child === 'string') {
        hasStringChildren = true;
        totalTextWidth += terminalWidth(child);
        // Text leaf - create a sized yoga node based on visual width
        const textYogaNode = Yoga.Node.create();
        textYogaNode.setWidth(terminalWidth(child));
        textYogaNode.setHeight(1);
        yogaNode.insertChild(textYogaNode, yogaNode.getChildCount());
      } else if (typeof child === 'object' && child !== null) {
        // For nested Text nodes within a parent Text, count their width
        if ('type' in child) {
          const childNode = child as TUINode;
          if (childNode.type === 'text' && childNode.children) {
            hasStringChildren = true;
            totalTextWidth += collectTextWidth(childNode.children);
          }
        }
        if ('type' in child) {
          const childNode = child as TUINode;

          // Fragment nodes are transparent containers
          if (childNode.type === 'fragment') {
            // Create yoga node for fragment (for layout tracking)
            const fragmentYogaNode = Yoga.Node.create();

            // Get fragment's own style if available
            const fragmentStyle =
              typeof childNode.style === 'function' ? childNode.style() : childNode.style || {};

            // Apply fragment's flex settings if specified, otherwise use defaults
            const fragmentFlex =
              typeof fragmentStyle.flex === 'function' ? fragmentStyle.flex() : fragmentStyle.flex;
            if (typeof fragmentFlex === 'number') {
              fragmentYogaNode.setFlex(fragmentFlex);
            } else {
              fragmentYogaNode.setFlexGrow(1);
              fragmentYogaNode.setFlexShrink(1);
            }

            // CRITICAL: Fragment must have proper flexDirection for layout
            // Use fragment's own style if set, otherwise inherit from parent
            if (fragmentStyle.flexDirection === 'row') {
              fragmentYogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
            } else if (fragmentStyle.flexDirection === 'column') {
              fragmentYogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
            } else if (style.flexDirection === 'row') {
              fragmentYogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
            } else {
              // Default to column for TUI layouts (matches Box default behavior)
              fragmentYogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
            }
            yogaNodeMap.set(childNode, fragmentYogaNode);

            // Process fragment's children
            for (const fragmentChild of childNode.children) {
              if (typeof fragmentChild === 'string') {
                const textYogaNode = Yoga.Node.create();
                textYogaNode.setWidth(terminalWidth(fragmentChild));
                textYogaNode.setHeight(1);
                fragmentYogaNode.insertChild(textYogaNode, fragmentYogaNode.getChildCount());
              } else if (
                typeof fragmentChild === 'object' &&
                fragmentChild !== null &&
                'type' in fragmentChild
              ) {
                const childYogaNode = buildYogaTree(fragmentChild as TUINode, yogaNodeMap, Yoga);
                fragmentYogaNode.insertChild(childYogaNode, fragmentYogaNode.getChildCount());
              }
            }

            yogaNode.insertChild(fragmentYogaNode, yogaNode.getChildCount());
          } else {
            // Regular TUINode
            const childYogaNode = buildYogaTree(childNode, yogaNodeMap, Yoga);
            yogaNode.insertChild(childYogaNode, yogaNode.getChildCount());
          }
        }
      }
    }
  }

  // If this node has string children and no explicit width/height is set,
  // set its size based on content to prevent it from collapsing to 0 in flex layouts
  if (hasStringChildren && tuiNode.type === 'text') {
    // Check if width was not explicitly set in the style
    const hasExplicitWidth = style.width !== undefined;
    const hasExplicitHeight = style.height !== undefined;

    if (!hasExplicitWidth) {
      // Set width to content width (sum of all string children widths)
      yogaNode.setWidth(totalTextWidth);
    }

    if (!hasExplicitHeight) {
      // Text nodes are always 1 line tall
      yogaNode.setHeight(1);
    }
  }

  return yogaNode;
}

/**
 * Extract layout results from computed Yoga tree
 */
// biome-ignore lint/suspicious/noExplicitAny: yoga-wasm-web doesn't provide types
function extractLayout(
  tuiNode: TUINode,
  yogaNodeMap: Map<TUINode, any>,
  layoutMap: LayoutMap,
  offsetX = 0,
  offsetY = 0,
): void {
  const yogaNode = yogaNodeMap.get(tuiNode);
  if (!yogaNode) return;

  const layout: LayoutResult = {
    x: offsetX + yogaNode.getComputedLeft(),
    y: offsetY + yogaNode.getComputedTop(),
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight(),
  };

  layoutMap.set(tuiNode, layout);

  // Process children
  if (tuiNode.children) {
    for (const child of tuiNode.children) {
      if (typeof child === 'object' && child !== null) {
        if ('type' in child) {
          const childNode = child as TUINode;

          // Fragment nodes - extract layout for fragment and its children
          if (childNode.type === 'fragment') {
            const fragmentYogaNode = yogaNodeMap.get(childNode);
            let fragmentLayout: LayoutResult | null = null;
            if (fragmentYogaNode) {
              fragmentLayout = {
                x: layout.x + fragmentYogaNode.getComputedLeft(),
                y: layout.y + fragmentYogaNode.getComputedTop(),
                width: fragmentYogaNode.getComputedWidth(),
                height: fragmentYogaNode.getComputedHeight(),
              };
              layoutMap.set(childNode, fragmentLayout);
            }

            // Process fragment's children using fragment's position as offset
            const childOffsetX = fragmentLayout?.x ?? layout.x;
            const childOffsetY = fragmentLayout?.y ?? layout.y;
            for (const fragmentChild of childNode.children) {
              if (
                typeof fragmentChild === 'object' &&
                fragmentChild !== null &&
                'type' in fragmentChild
              ) {
                extractLayout(
                  fragmentChild as TUINode,
                  yogaNodeMap,
                  layoutMap,
                  childOffsetX,
                  childOffsetY,
                );
              }
            }
          } else {
            // Regular TUINode
            extractLayout(childNode, yogaNodeMap, layoutMap, layout.x, layout.y);
          }
        }
      }
    }
  }
}

/**
 * Compute layout for TUI tree using Yoga (async for WASM)
 */
export async function computeLayout(
  rootNode: TUINode,
  availableWidth: number,
  availableHeight: number,
): Promise<LayoutMap> {
  const Yoga = await getYoga();
  // biome-ignore lint/suspicious/noExplicitAny: yoga-wasm-web doesn't provide types
  const yogaNodeMap = new Map<TUINode, any>();
  const layoutMap: LayoutMap = new Map();

  // Build Yoga tree
  const rootYogaNode = buildYogaTree(rootNode, yogaNodeMap, Yoga);

  // Calculate layout
  rootYogaNode.calculateLayout(availableWidth, availableHeight, Yoga.DIRECTION_LTR);

  // Extract layout results
  extractLayout(rootNode, yogaNodeMap, layoutMap);

  // Clean up Yoga nodes - only free root (it will free children recursively)
  rootYogaNode.freeRecursive();

  return layoutMap;
}
