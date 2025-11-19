/**
 * TUI Virtual Node Types
 */

export type TUINodeType = 'box' | 'text' | 'component';

export interface TUIStyle {
  // Layout
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Flexbox
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
}

export interface TUINode {
  type: TUINodeType;
  tagName?: string;
  props: Record<string, any>;
  children: Array<TUINode | string>;
  parentNode?: TUINode;
  style?: TUIStyle;
}

export interface RenderOutput {
  text: string;
  width: number;
  height: number;
}
