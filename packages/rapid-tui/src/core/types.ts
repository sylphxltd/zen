/**
 * TUI Virtual Node Types
 */

/**
 * Children type for TUI components
 *
 * Supports:
 * - TUINode: Single node
 * - string: Text content
 * - (TUINode | string)[]: Array of mixed content
 * - () => ...: Reactive function returning any of the above
 */
export type TUIChildren =
  | TUINode
  | string
  | null
  | (TUINode | string | null)[]
  | (() => TUINode | string | null | (TUINode | string | null)[]);

/**
 * Node types:
 * - 'box': Container with layout (flexbox)
 * - 'text': Text content
 * - 'component': Component wrapper
 * - 'fragment': Transparent container for reactive children (like React Fragment)
 */
export type TUINodeType = 'box' | 'text' | 'component' | 'fragment';

/**
 * Helper type that allows both static values and reactive functions
 */
type MaybeFunc<T> = T | (() => T);

export interface TUIStyle {
  // Layout
  width?: MaybeFunc<number | string | undefined>;
  height?: MaybeFunc<number | string | undefined>;
  minWidth?: MaybeFunc<number | undefined>;
  minHeight?: MaybeFunc<number | undefined>;
  maxWidth?: MaybeFunc<number | undefined>;
  maxHeight?: MaybeFunc<number | undefined>;

  // Positioning
  position?: MaybeFunc<'relative' | 'absolute' | undefined>;
  left?: MaybeFunc<number | undefined>;
  top?: MaybeFunc<number | undefined>;
  right?: MaybeFunc<number | undefined>;
  bottom?: MaybeFunc<number | undefined>;
  zIndex?: MaybeFunc<number | undefined>;

  // Flexbox
  flex?: MaybeFunc<number | undefined>; // Shorthand for flexGrow/flexShrink
  flexDirection?: MaybeFunc<'row' | 'column' | 'row-reverse' | 'column-reverse' | undefined>;
  flexGrow?: MaybeFunc<number | undefined>;
  flexShrink?: MaybeFunc<number | undefined>;
  flexBasis?: MaybeFunc<number | string | undefined>;
  alignItems?: MaybeFunc<'flex-start' | 'center' | 'flex-end' | 'stretch' | undefined>;
  alignSelf?: MaybeFunc<'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | undefined>;
  justifyContent?: MaybeFunc<
    'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | undefined
  >;

  // Spacing
  padding?: MaybeFunc<number | undefined>;
  paddingX?: MaybeFunc<number | undefined>;
  paddingY?: MaybeFunc<number | undefined>;
  paddingTop?: MaybeFunc<number | undefined>;
  paddingRight?: MaybeFunc<number | undefined>;
  paddingBottom?: MaybeFunc<number | undefined>;
  paddingLeft?: MaybeFunc<number | undefined>;

  margin?: MaybeFunc<number | undefined>;
  marginX?: MaybeFunc<number | undefined>;
  marginY?: MaybeFunc<number | undefined>;
  marginTop?: MaybeFunc<number | undefined>;
  marginRight?: MaybeFunc<number | undefined>;
  marginBottom?: MaybeFunc<number | undefined>;
  marginLeft?: MaybeFunc<number | undefined>;

  gap?: MaybeFunc<number | undefined>; // Gap between children in row/column layout

  // Border
  borderStyle?: MaybeFunc<'single' | 'double' | 'round' | 'bold' | 'none' | undefined>;
  borderColor?: MaybeFunc<string | undefined>;

  // Colors
  color?: MaybeFunc<string | undefined>;
  backgroundColor?: MaybeFunc<string | undefined>;

  // Text
  bold?: MaybeFunc<boolean | undefined>;
  italic?: MaybeFunc<boolean | undefined>;
  underline?: MaybeFunc<boolean | undefined>;
  strikethrough?: MaybeFunc<boolean | undefined>;
  dim?: MaybeFunc<boolean | undefined>;
  inverse?: MaybeFunc<boolean | undefined>; // Swap foreground/background colors

  // Overflow
  overflow?: MaybeFunc<'visible' | 'hidden' | 'scroll' | undefined>;
}

export interface TUINode {
  type: TUINodeType;
  tagName?: string;
  props: Record<string, any>;
  /**
   * Children can be:
   * - TUINode (including fragment nodes for reactive content)
   * - string (text content)
   */
  children: Array<TUINode | string>;
  parentNode?: TUINode;
  style?: TUIStyle;

  // ============================================================================
  // Fine-Grained Reactivity Fields (ADR-014)
  // ============================================================================
  // These fields enable incremental updates without full tree re-rendering.
  // When a signal changes, only the affected node is marked dirty, and only
  // dirty nodes are re-rendered to the terminal buffer.

  /**
   * Content dirty flag - set when node's content/children change.
   * When true, this node needs to be re-rendered to the buffer.
   * Cleared after rendering.
   *
   * @example
   * ```tsx
   * // In jsx-runtime effect:
   * textNode.children[0] = newValue;
   * textNode._dirty = true;  // Mark for re-render
   * scheduleNodeUpdate(textNode);
   * ```
   */
  _dirty?: boolean;

  /**
   * Layout dirty flag - set when node's size/position might change.
   * When true, Yoga layout needs to be recomputed for this subtree.
   * This is more expensive than content-only updates.
   *
   * Layout is dirty when:
   * - Node is added/removed
   * - width/height/flex properties change
   * - Text content changes length significantly
   *
   * Layout is NOT dirty when:
   * - Only color/style changes
   * - Text content changes but fits in same space
   */
  _layoutDirty?: boolean;
}

export interface RenderOutput {
  text: string;
  width: number;
  height: number;
}

/**
 * Mouse click event passed to onClick handlers
 */
export interface MouseClickEvent {
  /** Screen column (1-indexed) */
  x: number;
  /** Screen row (1-indexed) */
  y: number;
  /** X position relative to element (0-indexed) */
  localX: number;
  /** Y position relative to element (0-indexed) */
  localY: number;
  /** Mouse button that was clicked */
  button: 'left' | 'middle' | 'right';
  /** Ctrl key was held */
  ctrl?: boolean;
  /** Shift key was held */
  shift?: boolean;
  /** Meta key was held */
  meta?: boolean;
}

/**
 * Alias for TUIStyle for backwards compatibility
 * @deprecated Use TUIStyle instead
 */
export type ReactiveStyle = TUIStyle;
