/**
 * TUI Virtual Node Types
 */

/**
 * Node types:
 * - 'box': Container with layout (flexbox)
 * - 'text': Text content
 * - 'component': Component wrapper
 * - 'fragment': Transparent container for reactive children (like React Fragment)
 */
export type TUINodeType = 'box' | 'text' | 'component' | 'fragment';

export interface TUIStyle {
  // Layout
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Flexbox
  flex?: number; // Shorthand for flexGrow/flexShrink
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';

  // Spacing
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  margin?: number;
  marginX?: number;
  marginY?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;

  gap?: number; // Gap between children in row/column layout

  // Border
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'none';
  borderColor?: string;

  // Colors
  color?: string;
  backgroundColor?: string;

  // Text
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean; // Swap foreground/background colors

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll';
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
