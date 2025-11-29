/** @jsxImportSource @zen/tui */
/**
 * TextArea Component
 *
 * Simple multi-line text input for TUI applications.
 * Similar to HTML <textarea> - for general text input, NOT a code editor.
 *
 * Features:
 * - Multi-line text editing
 * - Cursor movement (arrows, home/end, page up/down)
 * - Soft text wrapping with word boundaries
 * - Keyboard scrolling for large content
 *
 * NOT included (use a CodeEditor component for these):
 * - Line numbers (available as opt-in prop, but off by default)
 * - Syntax highlighting
 * - Mouse scroll (future: opt-in via MouseProvider context)
 *
 * @example
 * ```tsx
 * const text = signal('Hello\nWorld');
 *
 * <TextArea
 *   value={text.value}
 *   onChange={(newValue) => text.value = newValue}
 *   rows={10}
 *   placeholder="Enter text..."
 * />
 * ```
 */

import {
  Box,
  type MaybeReactive,
  Text,
  batch,
  computed,
  effect,
  getGraphemes,
  resolve,
  signal,
  useFocus,
  useInput,
} from '@zen/tui';
import { type VisualLine, isCursorOnLine, wrapText } from './text-wrap';

export interface TextAreaProps {
  /** Current text value - supports MaybeReactive for reactivity */
  value?: MaybeReactive<string>;

  /** Callback when text changes */
  onChange?: (value: string) => void;

  /** Number of visible rows */
  rows?: number;

  /** Number of columns (width) */
  cols?: number;

  /** Placeholder text when empty */
  placeholder?: string;

  /** Show line numbers */
  showLineNumbers?: boolean;

  /** Enable line wrapping */
  wrap?: boolean;

  /** Read-only mode */
  readOnly?: boolean;

  /**
   * Focus ID for FocusProvider integration (Ink-compatible pattern)
   * When provided, uses useFocus() for focus management
   */
  focusId?: string;

  /**
   * Auto-focus when mounted (only used with focusId)
   */
  autoFocus?: boolean;

  /**
   * External focus control - supports MaybeReactive<boolean>
   * When provided, overrides useFocus. Prefer focusId for FocusProvider pattern.
   */
  isFocused?: MaybeReactive<boolean>;

  /** Border style */
  border?: boolean;
}

/**
 * TextArea Component
 *
 * Multi-line text editor for TUI applications.
 */
export function TextArea(props: TextAreaProps) {
  const {
    value: valueProp = '',
    onChange,
    rows = 10,
    cols,
    placeholder = '',
    showLineNumbers = false,
    wrap = true,
    readOnly = false,
    focusId,
    autoFocus = false,
    isFocused: isFocusedProp,
    border = true,
  } = props;

  // ==========================================================================
  // Focus Management
  // ==========================================================================

  const focusResult = focusId ? useFocus({ id: focusId, autoFocus }) : null;

  const effectiveFocused = computed(() => {
    if (isFocusedProp !== undefined) {
      const externalActive = resolve(isFocusedProp);
      if (!externalActive) return false;
    }
    if (focusResult) {
      return focusResult.isFocused.value;
    }
    if (isFocusedProp !== undefined) {
      return resolve(isFocusedProp);
    }
    return true;
  });

  // ==========================================================================
  // Layout Calculations (reactive)
  // ==========================================================================

  const lineNumberWidth = showLineNumbers ? 5 : 0;
  const borderWidth = border ? 2 : 0;

  // contentWidth must be reactive if cols can change
  const contentWidth = computed(() => {
    const effectiveCols = cols ?? 1000;
    return Math.max(1, effectiveCols - borderWidth - lineNumberWidth);
  });

  // ==========================================================================
  // State
  // ==========================================================================

  const externalValue = computed(() => resolve(valueProp));
  const internalValue = signal(externalValue.value);
  const cursorRow = signal(0);
  const cursorCol = signal(0);
  const scrollOffset = signal(0);

  const isControlled =
    typeof valueProp === 'function' ||
    (valueProp !== null && typeof valueProp === 'object' && '_kind' in valueProp);

  const currentValue = computed(() => (isControlled ? externalValue.value : internalValue.value));

  // Track previous value to detect external changes
  let prevExternalValue = externalValue.value;

  // Constrain cursor when external value changes (controlled mode only)
  effect(() => {
    const newVal = externalValue.value;
    // Only react to external changes, not our own updates
    if (isControlled && newVal !== prevExternalValue) {
      prevExternalValue = newVal;
      // Constrain cursor to new text bounds
      const lines = newVal ? newVal.split('\n') : [''];
      const maxRow = Math.max(0, lines.length - 1);
      if (cursorRow.value > maxRow) {
        cursorRow.value = maxRow;
      }
      const maxCol = (lines[cursorRow.value] || '').length;
      if (cursorCol.value > maxCol) {
        cursorCol.value = maxCol;
      }
    }
  });

  const logicalLines = computed(() => {
    const text = currentValue.value;
    return text ? text.split('\n') : [''];
  });

  // ==========================================================================
  // Visual Lines (using text-wrap module)
  // ==========================================================================

  const wrapResult = computed(() =>
    wrapText(currentValue.value, {
      contentWidth: contentWidth.value,
      wordWrap: wrap,
      reserveCursorSpace: true,
    }),
  );

  const visualLines = computed(() => wrapResult.value.lines);

  const cursorVisualRow = computed(() => {
    const lines = visualLines.value;
    for (let i = 0; i < lines.length; i++) {
      const vl = lines[i];
      const nextVl = lines[i + 1];
      if (isCursorOnLine(vl, nextVl, cursorRow.value, cursorCol.value)) {
        return i;
      }
    }
    return 0;
  });

  const visibleVisualLines = computed(() => {
    const all = visualLines.value;
    const start = scrollOffset.value;
    const end = Math.min(start + rows, all.length);
    return all.slice(start, end);
  });

  // ==========================================================================
  // Cursor Management
  // ==========================================================================

  const constrainCursor = () => {
    const lines = logicalLines.value;
    const maxRow = Math.max(0, lines.length - 1);
    const currentRow = Math.min(cursorRow.value, maxRow);
    const currentLine = lines[currentRow] || '';
    const maxCol = currentLine.length;

    cursorRow.value = currentRow;
    cursorCol.value = Math.min(cursorCol.value, maxCol);

    const visualRow = cursorVisualRow.value;
    if (visualRow < scrollOffset.value) {
      scrollOffset.value = visualRow;
    } else if (visualRow >= scrollOffset.value + rows) {
      scrollOffset.value = visualRow - rows + 1;
    }
  };

  // ==========================================================================
  // Text Editing Operations
  // ==========================================================================

  const updateText = (newValue: string, newRow?: number, newCol?: number) => {
    batch(() => {
      internalValue.value = newValue;
      if (newRow !== undefined) cursorRow.value = newRow;
      if (newCol !== undefined) cursorCol.value = newCol;
    });
    onChange?.(newValue);
    constrainCursor();
  };

  const insertText = (text: string) => {
    if (readOnly) return;
    const lines = logicalLines.value;
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = lines[row] || '';

    const newLine = line.slice(0, col) + text + line.slice(col);
    const newLines = [...lines];
    newLines[row] = newLine;

    updateText(newLines.join('\n'), undefined, col + text.length);
  };

  /** Find grapheme boundary before cursor position */
  const findGraphemeBefore = (line: string, col: number) => {
    const graphemes = getGraphemes(line);
    let charIndex = 0;
    let prevCharIndex = 0;
    let grapheme = '';
    for (const g of graphemes) {
      if (charIndex >= col) break;
      prevCharIndex = charIndex;
      grapheme = g;
      charIndex += g.length;
    }
    return { start: prevCharIndex, grapheme };
  };

  /** Find grapheme at cursor position */
  const findGraphemeAt = (line: string, col: number) => {
    const graphemes = getGraphemes(line);
    let charIndex = 0;
    for (const g of graphemes) {
      if (charIndex >= col) return { start: charIndex, grapheme: g };
      charIndex += g.length;
    }
    return { start: col, grapheme: '' };
  };

  const deleteBackward = () => {
    if (readOnly) return;
    const lines = [...logicalLines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = lines[row] || '';

    if (col > 0) {
      const { start, grapheme } = findGraphemeBefore(line, col);
      lines[row] = line.slice(0, start) + line.slice(start + grapheme.length);
      updateText(lines.join('\n'), row, start);
    } else if (row > 0) {
      const prevLine = lines[row - 1];
      lines[row - 1] = prevLine + line;
      lines.splice(row, 1);
      updateText(lines.join('\n'), row - 1, prevLine.length);
    }
  };

  const deleteForward = () => {
    if (readOnly) return;
    const lines = [...logicalLines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = lines[row] || '';

    if (col < line.length) {
      const { start, grapheme } = findGraphemeAt(line, col);
      lines[row] = line.slice(0, start) + line.slice(start + grapheme.length);
      updateText(lines.join('\n'), row, col);
    } else if (row < lines.length - 1) {
      lines[row] = line + lines[row + 1];
      lines.splice(row + 1, 1);
      updateText(lines.join('\n'), row, col);
    }
  };

  const insertNewline = () => {
    if (readOnly) return;
    const lines = [...logicalLines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = lines[row] || '';

    lines[row] = line.slice(0, col);
    lines.splice(row + 1, 0, line.slice(col));

    updateText(lines.join('\n'), row + 1, 0);
  };

  // ==========================================================================
  // Cursor Movement
  // ==========================================================================

  const moveCursorLeft = () => {
    const lines = logicalLines.value;
    const line = lines[cursorRow.value] || '';

    if (cursorCol.value > 0) {
      const graphemes = getGraphemes(line);
      let charIndex = 0;
      let prevCharIndex = 0;
      for (const g of graphemes) {
        if (charIndex >= cursorCol.value) break;
        prevCharIndex = charIndex;
        charIndex += g.length;
      }
      cursorCol.value = prevCharIndex;
    } else if (cursorRow.value > 0) {
      cursorRow.value -= 1;
      cursorCol.value = (lines[cursorRow.value] || '').length;
      constrainCursor();
    }
  };

  const moveCursorRight = () => {
    const lines = logicalLines.value;
    const line = lines[cursorRow.value] || '';

    if (cursorCol.value < line.length) {
      const graphemes = getGraphemes(line);
      let charIndex = 0;
      for (const g of graphemes) {
        if (charIndex >= cursorCol.value) {
          cursorCol.value = charIndex + g.length;
          break;
        }
        charIndex += g.length;
      }
    } else if (cursorRow.value < lines.length - 1) {
      cursorRow.value += 1;
      cursorCol.value = 0;
      constrainCursor();
    }
  };

  // ==========================================================================
  // Input Handling
  // ==========================================================================

  const handleCursorUp = () => {
    if (cursorRow.value > 0) {
      cursorRow.value -= 1;
      constrainCursor();
    }
  };

  const handleCursorDown = () => {
    if (cursorRow.value < logicalLines.value.length - 1) {
      cursorRow.value += 1;
      constrainCursor();
    }
  };

  const handlePageUp = () => {
    cursorRow.value = Math.max(0, cursorRow.value - rows);
    constrainCursor();
  };

  const handlePageDown = () => {
    cursorRow.value = Math.min(logicalLines.value.length - 1, cursorRow.value + rows);
    constrainCursor();
  };

  const handleHome = () => {
    cursorCol.value = 0;
  };

  const handleEnd = () => {
    cursorCol.value = (logicalLines.value[cursorRow.value] || '').length;
  };

  useInput(
    (input, key) => {
      if (!effectiveFocused.value || readOnly) return false;

      // Navigation keys
      if (key.upArrow) {
        handleCursorUp();
        return true;
      }
      if (key.downArrow) {
        handleCursorDown();
        return true;
      }
      if (key.leftArrow) {
        moveCursorLeft();
        return true;
      }
      if (key.rightArrow) {
        moveCursorRight();
        return true;
      }
      if (key.home) {
        handleHome();
        return true;
      }
      if (key.end) {
        handleEnd();
        return true;
      }
      if (key.pageUp) {
        handlePageUp();
        return true;
      }
      if (key.pageDown) {
        handlePageDown();
        return true;
      }

      // Editing keys
      if (key.backspace) {
        deleteBackward();
        return true;
      }
      if (key.delete) {
        deleteForward();
        return true;
      }
      if (key.return) {
        insertNewline();
        return true;
      }

      // Text input
      if (input && !key.ctrl && !key.meta && !key.tab) {
        insertText(input);
        return true;
      }

      return false;
    },
    { isActive: effectiveFocused },
  );

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  const renderLineNumber = (vl: VisualLine) => {
    if (!showLineNumbers) return null;
    const isFirstVisualLine = vl.startCol === 0;
    const lineNum = isFirstVisualLine ? `${`${vl.logicalRow + 1}`.padStart(4, ' ')} ` : '     ';
    return <Text style={{ dim: true }}>{lineNum}</Text>;
  };

  const renderCursorLine = (vl: VisualLine, visualIndex: number) => {
    const colInVisual = cursorCol.value - vl.startCol;
    const graphemes = getGraphemes(vl.text);

    let charIndex = 0;
    let graphemeIndex = 0;
    for (let i = 0; i < graphemes.length; i++) {
      if (charIndex >= colInVisual) {
        graphemeIndex = i;
        break;
      }
      charIndex += graphemes[i].length;
      graphemeIndex = i + 1;
    }

    const before = graphemes.slice(0, graphemeIndex).join('');
    const cursor = graphemes[graphemeIndex] || ' ';
    const after = graphemes.slice(graphemeIndex + 1).join('');

    return (
      <Text key={visualIndex}>
        {renderLineNumber(vl)}
        {before}
        <Text style={{ inverse: true }}>{cursor}</Text>
        {after}
      </Text>
    );
  };

  const renderTextLine = (vl: VisualLine, visualIndex: number) => {
    return (
      <Text key={visualIndex}>
        {renderLineNumber(vl)}
        {vl.text || ' '}
      </Text>
    );
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  const widthStyle = cols !== undefined ? { width: cols } : { flex: 1 };

  return (
    <Box
      style={{
        flexDirection: 'column',
        ...widthStyle,
        height: rows + (border ? 2 : 0),
        borderStyle: border ? 'single' : undefined,
        borderColor: () => (effectiveFocused.value ? 'cyan' : 'gray'),
        overflow: 'hidden',
      }}
    >
      {() => {
        const displayLines = visibleVisualLines.value;
        const isEmpty = currentValue.value === '';

        if (isEmpty && placeholder) {
          return <Text style={{ dim: true }}>{placeholder.slice(0, contentWidth.value)}</Text>;
        }

        const allLines = visualLines.value;

        return displayLines.map((vl, index) => {
          const visualIndex = scrollOffset.value + index;
          const nextVl = allLines[visualIndex + 1];
          const hasCursor =
            effectiveFocused.value && isCursorOnLine(vl, nextVl, cursorRow.value, cursorCol.value);

          return hasCursor ? renderCursorLine(vl, visualIndex) : renderTextLine(vl, visualIndex);
        });
      }}
    </Box>
  );
}
