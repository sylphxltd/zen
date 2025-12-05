/**
 * Utilities - Helper functions and internal utilities
 */

export {
  FocusProvider,
  useFocusManager,
  useFocus,
  type FocusContextValue,
  type FocusableItem,
} from './focus.js';
export {
  hitTest,
  hitTestAll,
  findClickableAncestor,
  setHitTestLayout,
  clearHitTestLayout,
  type HitTestResult,
} from './hit-test.js';
export {
  terminalWidth,
  sliceByWidth,
  sliceFromColumn,
  charIndexToColumn,
  columnToCharIndex,
  getGraphemes,
  graphemeAt,
  graphemeWidthAt,
} from './terminal-width.js';
export type { MouseEvent } from './mouse-parser.js';
