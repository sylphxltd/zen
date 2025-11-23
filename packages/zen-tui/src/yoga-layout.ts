/**
 * Yoga Layout Integration for TUI
 *
 * Computes flexbox layout for TUI nodes, enabling fine-grained updates.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initYoga, { type Yoga } from 'yoga-wasm-web';
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

  // Width
  if (typeof style.width === 'number') {
    yogaNode.setWidth(style.width);
  } else if (style.width === 'auto') {
    yogaNode.setWidthAuto();
  } else if (typeof style.width === 'string' && style.width.endsWith('%')) {
    yogaNode.setWidthPercent(Number.parseFloat(style.width));
  }

  // Height
  if (typeof style.height === 'number') {
    yogaNode.setHeight(style.height);
  } else if (style.height === 'auto') {
    yogaNode.setHeightAuto();
  } else if (typeof style.height === 'string' && style.height.endsWith('%')) {
    yogaNode.setHeightPercent(Number.parseFloat(style.height));
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

  // Flex
  if (typeof style.flex === 'number') {
    yogaNode.setFlex(style.flex);
  }
  if (typeof style.flexGrow === 'number') {
    yogaNode.setFlexGrow(style.flexGrow);
  }
  if (typeof style.flexShrink === 'number') {
    yogaNode.setFlexShrink(style.flexShrink);
  }
}

/**
 * Build Yoga node tree from TUI node tree
 */
function buildYogaTree(tuiNode: TUINode, yogaNodeMap: Map<TUINode, any>, Yoga: any): any {
  const yogaNode = Yoga.Node.create();
  yogaNodeMap.set(tuiNode, yogaNode);

  // Apply styles
  const style = typeof tuiNode.style === 'function' ? tuiNode.style() : tuiNode.style || {};
  applyStylesToYogaNode(yogaNode, style, Yoga);

  // Handle children
  if (tuiNode.children) {
    for (const child of tuiNode.children) {
      if (typeof child === 'string') {
        // Text leaf - create a sized yoga node based on text length
        const textYogaNode = Yoga.Node.create();
        textYogaNode.setWidth(child.length);
        textYogaNode.setHeight(1);
        yogaNode.insertChild(textYogaNode, yogaNode.getChildCount());
      } else if (typeof child === 'object' && child !== null) {
        if ('_type' in child && child._type === 'marker') {
          // Reactive marker - treat as container that expands to fill parent
          const markerYogaNode = Yoga.Node.create();
          // Markers should expand to fill their parent container
          markerYogaNode.setFlexGrow(1);
          markerYogaNode.setFlexShrink(1);
          yogaNodeMap.set(child as any, markerYogaNode);

          // Process marker's children
          if ('children' in child && Array.isArray(child.children)) {
            for (const markerChild of child.children) {
              if (typeof markerChild === 'string') {
                const textYogaNode = Yoga.Node.create();
                textYogaNode.setWidth(markerChild.length);
                textYogaNode.setHeight(1);
                markerYogaNode.insertChild(textYogaNode, markerYogaNode.getChildCount());
              } else if (
                typeof markerChild === 'object' &&
                markerChild !== null &&
                'type' in markerChild
              ) {
                const childYogaNode = buildYogaTree(markerChild as TUINode, yogaNodeMap, Yoga);
                markerYogaNode.insertChild(childYogaNode, markerYogaNode.getChildCount());
              }
            }
          }

          yogaNode.insertChild(markerYogaNode, yogaNode.getChildCount());
        } else if ('type' in child) {
          // Regular TUINode
          const childYogaNode = buildYogaTree(child as TUINode, yogaNodeMap, Yoga);
          yogaNode.insertChild(childYogaNode, yogaNode.getChildCount());
        }
      }
    }
  }

  return yogaNode;
}

/**
 * Extract layout results from computed Yoga tree
 */
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
        if ('_type' in child && child._type === 'marker') {
          // Marker
          const markerYogaNode = yogaNodeMap.get(child as any);
          if (markerYogaNode) {
            const markerLayout: LayoutResult = {
              x: layout.x + markerYogaNode.getComputedLeft(),
              y: layout.y + markerYogaNode.getComputedTop(),
              width: markerYogaNode.getComputedWidth(),
              height: markerYogaNode.getComputedHeight(),
            };
            layoutMap.set(child as any, markerLayout);
          }

          // Process marker's children
          if ('children' in child && Array.isArray(child.children)) {
            for (const markerChild of child.children) {
              if (
                typeof markerChild === 'object' &&
                markerChild !== null &&
                'type' in markerChild
              ) {
                extractLayout(markerChild as TUINode, yogaNodeMap, layoutMap, layout.x, layout.y);
              }
            }
          }
        } else if ('type' in child) {
          extractLayout(child as TUINode, yogaNodeMap, layoutMap, layout.x, layout.y);
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
