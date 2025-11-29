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
 * - Soft text wrapping (default on)
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
  charIndexToColumn,
  columnToCharIndex,
  computed,
  getGraphemes,
  graphemeAt,
  resolve,
  signal,
  sliceByWidth,
  terminalWidth,
  useFocus,
  useInput,
} from '@zen/tui';

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
    cols, // undefined = flex to fill parent
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
  // Focus Management (Ink-compatible pattern)
  // ==========================================================================
  // Priority:
  // 1. If isFocused prop provided → use it (external control)
  // 2. If focusId provided → use useFocus (FocusProvider pattern)
  // 3. Otherwise → default to focused (standalone mode)

  // useFocus returns { isFocused: Computed<boolean> }
  // Only call useFocus if focusId is provided (FocusProvider pattern)
  const focusResult = focusId ? useFocus({ id: focusId, autoFocus }) : null;

  // Determine effective focus state:
  // 1. If isFocused prop is provided, it acts as a GATE (must be true to be focused)
  // 2. If focusId is also provided, BOTH external AND FocusProvider must agree
  // 3. This allows parent to control "scope" while FocusProvider controls "which item"
  const effectiveFocused = computed(() => {
    // Check external gate first
    if (isFocusedProp !== undefined) {
      const externalActive = resolve(isFocusedProp);
      if (!externalActive) return false; // Gate is closed
    }

    // If using FocusProvider, check its focus state
    if (focusResult) {
      return focusResult.isFocused.value;
    }

    // Fallback: use external if provided, otherwise true
    if (isFocusedProp !== undefined) {
      return resolve(isFocusedProp);
    }
    return true; // Default: focused when standalone
  });

  // Resolve value - supports MaybeReactive<string>
  const externalValue = computed(() => resolve(valueProp));

  // Calculate available content width (inside border, minus line numbers)
  // If cols not specified, use a large value for text wrapping (actual clipping handled by overflow:hidden)
  const lineNumberWidth = showLineNumbers ? 5 : 0; // "   1 " = 5 chars
  const borderWidth = border ? 2 : 0; // left + right border
  // When no cols specified, use 1000 as "no wrap limit" - actual display width determined by Yoga
  const effectiveCols = cols ?? 1000;
  const contentWidth = Math.max(1, effectiveCols - borderWidth - lineNumberWidth);

  // Internal state - sync with external value when it changes
  const internalValue = signal(externalValue.value);
  const cursorRow = signal(0); // Logical row (actual line in text)
  const cursorCol = signal(0); // Logical column (position in actual line)
  const scrollOffset = signal(0); // Visual line scroll offset

  // Current value: use external if reactive (controlled), otherwise internal
  // Reactive values: functions or signals (have _kind property)
  const isControlled =
    typeof valueProp === 'function' ||
    (valueProp !== null && typeof valueProp === 'object' && '_kind' in valueProp);

  const currentValue = computed(() => {
    // If value is reactive, treat as controlled - always use external
    if (isControlled) {
      return externalValue.value;
    }
    // Otherwise use internal value (supports immediate updates during typing)
    return internalValue.value;
  });

  // Split text into logical lines (actual newlines)
  const logicalLines = computed(() => {
    const text = currentValue.value;
    return text ? text.split('\n') : [''];
  });

  // Wrap logical lines into visual lines for display
  // Each visual line tracks: { text, logicalRow, startCol, startVisualCol }
  // startCol = character index in logical line
  // startVisualCol = visual column (terminal columns) where this line starts
  interface VisualLine {
    text: string;
    logicalRow: number;
    startCol: number; // character index
    startVisualCol: number; // visual column offset
  }

  const visualLines = computed((): VisualLine[] => {
    const logical = logicalLines.value;
    const result: VisualLine[] = [];

    for (let logicalRow = 0; logicalRow < logical.length; logicalRow++) {
      const line = logical[logicalRow];
      const lineWidth = terminalWidth(line);

      if (!wrap || lineWidth <= contentWidth) {
        // No wrapping needed - single visual line
        result.push({ text: line, logicalRow, startCol: 0, startVisualCol: 0 });
      } else {
        // Wrap long line into multiple visual lines using visual width
        let startCol = 0;
        let startVisualCol = 0;
        const graphemes = getGraphemes(line);

        while (startCol < line.length) {
          // Slice by visual width from current position
          const remaining = line.slice(startCol);
          const sliced = sliceByWidth(remaining, contentWidth);

          if (sliced.charCount === 0) {
            // Edge case: single wide character wider than contentWidth
            // Take at least one grapheme to avoid infinite loop
            const firstGrapheme = graphemes.find(
              (_, i) => graphemes.slice(0, i).reduce((sum, g) => sum + g.length, 0) >= startCol,
            );
            if (firstGrapheme) {
              result.push({
                text: firstGrapheme,
                logicalRow,
                startCol,
                startVisualCol,
              });
              startCol += firstGrapheme.length;
              startVisualCol += terminalWidth(firstGrapheme);
            } else {
              break;
            }
          } else {
            result.push({
              text: sliced.text,
              logicalRow,
              startCol,
              startVisualCol,
            });
            startCol += sliced.charCount;
            startVisualCol += sliced.width;
          }
        }

        // Handle empty trailing chunk (cursor at end of wrapped line)
        if (line.length > 0 && startCol === line.length && startVisualCol % contentWidth === 0) {
          result.push({ text: '', logicalRow, startCol: line.length, startVisualCol });
        }
      }
    }

    return result;
  });

  // Find visual line index for current cursor position
  const cursorVisualRow = computed(() => {
    const visual = visualLines.value;
    const logRow = cursorRow.value;
    const logCol = cursorCol.value;

    for (let i = 0; i < visual.length; i++) {
      const vl = visual[i];
      if (vl.logicalRow === logRow) {
        // Check if cursor is in this visual line's range
        const endCol = vl.startCol + (vl.text.length || contentWidth);
        if (logCol >= vl.startCol && logCol < endCol) {
          return i;
        }
        // Cursor at end of line
        if (logCol === vl.startCol + vl.text.length && i + 1 < visual.length) {
          const next = visual[i + 1];
          if (next.logicalRow !== logRow) {
            return i; // Last visual line of this logical line
          }
        }
      }
    }
    // Fallback: find last visual line for this logical row
    for (let i = visual.length - 1; i >= 0; i--) {
      if (visual[i].logicalRow === logRow) return i;
    }
    return 0;
  });

  // Visible visual lines with scroll offset
  const visibleVisualLines = computed(() => {
    const all = visualLines.value;
    const start = scrollOffset.value;
    const end = Math.min(start + rows, all.length);
    return all.slice(start, end);
  });

  // Update cursor position constraints
  const constrainCursor = () => {
    const currentLines = logicalLines.value;
    const maxRow = Math.max(0, currentLines.length - 1);
    const currentRow = Math.min(cursorRow.value, maxRow);
    const currentLine = currentLines[currentRow] || '';
    const maxCol = currentLine.length;

    cursorRow.value = currentRow;
    cursorCol.value = Math.min(cursorCol.value, maxCol);

    // Auto-scroll to keep cursor visible (using visual lines)
    const visualRow = cursorVisualRow.value;
    if (visualRow < scrollOffset.value) {
      scrollOffset.value = visualRow;
    } else if (visualRow >= scrollOffset.value + rows) {
      scrollOffset.value = visualRow - rows + 1;
    }
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    if (readOnly) return;

    const currentLines = logicalLines.value;
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    const newLine = line.slice(0, col) + text + line.slice(col);
    const newLines = [...currentLines];
    newLines[row] = newLine;

    const newValue = newLines.join('\n');

    // Use batch to update all signals atomically, preventing cascading re-renders
    batch(() => {
      internalValue.value = newValue;
      cursorCol.value = col + text.length;
    });

    if (onChange) {
      onChange(newValue);
    }

    constrainCursor();
  };

  // Delete grapheme at cursor (handles multi-codepoint characters like emoji)
  const deleteChar = (direction: 'forward' | 'backward') => {
    if (readOnly) return;

    const currentLines = [...logicalLines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    let newCol = col;
    let newRow = row;

    if (direction === 'backward') {
      if (col > 0) {
        // Delete grapheme before cursor (not just one character)
        const graphemes = getGraphemes(line);
        let charIndex = 0;
        let prevCharIndex = 0;
        let graphemeToDelete = '';

        for (const g of graphemes) {
          if (charIndex >= col) break;
          prevCharIndex = charIndex;
          graphemeToDelete = g;
          charIndex += g.length;
        }

        // Delete the grapheme by reconstructing the line
        const newLine =
          line.slice(0, prevCharIndex) + line.slice(prevCharIndex + graphemeToDelete.length);
        currentLines[row] = newLine;
        newCol = prevCharIndex;
      } else if (row > 0) {
        // Merge with previous line
        const prevLine = currentLines[row - 1];
        currentLines[row - 1] = prevLine + line;
        currentLines.splice(row, 1);
        newRow = row - 1;
        newCol = prevLine.length;
      }
    } else {
      // forward
      if (col < line.length) {
        // Delete grapheme at cursor (not just one character)
        const graphemes = getGraphemes(line);
        let charIndex = 0;
        let graphemeToDelete = '';
        let graphemeStartIndex = col;

        for (const g of graphemes) {
          if (charIndex >= col) {
            graphemeToDelete = g;
            graphemeStartIndex = charIndex;
            break;
          }
          charIndex += g.length;
        }

        // Delete the grapheme by reconstructing the line
        const newLine =
          line.slice(0, graphemeStartIndex) +
          line.slice(graphemeStartIndex + graphemeToDelete.length);
        currentLines[row] = newLine;
      } else if (row < currentLines.length - 1) {
        // Merge with next line
        const nextLine = currentLines[row + 1];
        currentLines[row] = line + nextLine;
        currentLines.splice(row + 1, 1);
      }
    }

    const newValue = currentLines.join('\n');

    // Use batch to update all signals atomically
    batch(() => {
      internalValue.value = newValue;
      cursorRow.value = newRow;
      cursorCol.value = newCol;
    });

    if (onChange) {
      onChange(newValue);
    }

    constrainCursor();
  };

  // Insert newline
  const insertNewline = () => {
    if (readOnly) return;

    const currentLines = [...logicalLines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    const beforeCursor = line.slice(0, col);
    const afterCursor = line.slice(col);

    currentLines[row] = beforeCursor;
    currentLines.splice(row + 1, 0, afterCursor);

    const newValue = currentLines.join('\n');

    // Use batch to update all signals atomically
    batch(() => {
      internalValue.value = newValue;
      cursorRow.value = row + 1;
      cursorCol.value = 0;
    });

    if (onChange) {
      onChange(newValue);
    }

    constrainCursor();
  };

  // Keyboard input handler
  useInput(
    (input, key) => {
      if (!effectiveFocused.value || readOnly) return false;

      const currentLines = logicalLines.value;

      // Arrow keys - cursor movement
      if (key.upArrow) {
        if (cursorRow.value > 0) {
          cursorRow.value -= 1;
          constrainCursor();
        }
        return true; // consumed
      }
      if (key.downArrow) {
        if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          constrainCursor();
        }
        return true; // consumed
      }
      if (key.leftArrow) {
        if (cursorCol.value > 0) {
          // Move by grapheme (not character) to handle multi-codepoint sequences
          const currentLine = currentLines[cursorRow.value] || '';
          const graphemes = getGraphemes(currentLine);
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
          cursorCol.value = (currentLines[cursorRow.value] || '').length;
          constrainCursor();
        }
        return true; // consumed
      }
      if (key.rightArrow) {
        const currentLine = currentLines[cursorRow.value] || '';
        if (cursorCol.value < currentLine.length) {
          // Move by grapheme (not character) to handle multi-codepoint sequences
          const graphemes = getGraphemes(currentLine);
          let charIndex = 0;
          for (const g of graphemes) {
            if (charIndex >= cursorCol.value) {
              cursorCol.value = charIndex + g.length;
              break;
            }
            charIndex += g.length;
          }
        } else if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          cursorCol.value = 0;
          constrainCursor();
        }
        return true; // consumed
      }
      // Home/End
      if (key.home) {
        cursorCol.value = 0;
        return true; // consumed
      }
      if (key.end) {
        const currentLine = currentLines[cursorRow.value] || '';
        cursorCol.value = currentLine.length;
        return true; // consumed
      }
      // Page Up/Down
      if (key.pageUp) {
        cursorRow.value = Math.max(0, cursorRow.value - rows);
        constrainCursor();
        return true; // consumed
      }
      if (key.pageDown) {
        cursorRow.value = Math.min(currentLines.length - 1, cursorRow.value + rows);
        constrainCursor();
        return true; // consumed
      }
      // Backspace/Delete
      if (key.backspace || key.delete) {
        deleteChar(key.backspace ? 'backward' : 'forward');
        return true; // consumed
      }
      // Enter
      if (key.return) {
        insertNewline();
        return true; // consumed
      }
      // Regular text input (but not Tab - allow Tab for navigation)
      if (input && !key.ctrl && !key.meta && !key.tab) {
        insertText(input);
        return true; // consumed
      }

      return false; // not consumed, let other handlers process
    },
    { isActive: effectiveFocused },
  );

  // Render
  // If cols is specified, use fixed width; otherwise use flex to fill parent
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
          return <Text style={{ dim: true }}>{placeholder.slice(0, contentWidth)}</Text>;
        }

        const allVisualLines = visualLines.value;

        return displayLines.map((vl, index) => {
          const visualIndex = scrollOffset.value + index;
          // Check if cursor is on this visual line
          // For wrapped lines, cursor at wrap boundary should be on the NEXT visual line
          // Only use <= for the last visual line of a logical row (end of actual line)
          // IMPORTANT: Use full visualLines array, not just visible displayLines
          const nextVl = allVisualLines[visualIndex + 1];
          const isLastVisualOfLogicalRow = !nextVl || nextVl.logicalRow !== vl.logicalRow;
          const isCursorLine =
            vl.logicalRow === cursorRow.value &&
            cursorCol.value >= vl.startCol &&
            (isLastVisualOfLogicalRow
              ? cursorCol.value <= vl.startCol + vl.text.length
              : cursorCol.value < vl.startCol + vl.text.length);

          // Line numbers show the logical row number (only on first visual line of each logical line)
          const isFirstVisualLine = vl.startCol === 0;
          const lineNumber = showLineNumbers
            ? isFirstVisualLine
              ? `${`${vl.logicalRow + 1}`.padStart(4, ' ')} `
              : '     ' // continuation lines get blank line number
            : '';

          // For cursor line, render with inline cursor highlight
          if (isCursorLine && effectiveFocused.value) {
            const colInVisual = cursorCol.value - vl.startCol;
            // Use grapheme-aware operations for proper wide character handling
            const graphemes = getGraphemes(vl.text);
            let charIndex = 0;
            let graphemeIndex = 0;

            // Find the grapheme at cursor position
            for (let i = 0; i < graphemes.length; i++) {
              if (charIndex >= colInVisual) {
                graphemeIndex = i;
                break;
              }
              charIndex += graphemes[i].length;
              graphemeIndex = i + 1;
            }

            // Check if cursor is at the very end of the visual line
            const cursorAtEnd = graphemeIndex >= graphemes.length;

            if (cursorAtEnd && graphemes.length > 0) {
              // Cursor at end of non-empty line: underline last character to indicate cursor position
              // This avoids adding an extra space that might overflow the display width
              const beforeLast = graphemes.slice(0, graphemes.length - 1);
              const lastGrapheme = graphemes[graphemes.length - 1];
              return (
                <Text key={visualIndex}>
                  {showLineNumbers && <Text style={{ dim: true }}>{lineNumber}</Text>}
                  {beforeLast.join('')}
                  <Text style={{ inverse: true, underline: true }}>{lastGrapheme}</Text>
                </Text>
              );
            }

            const beforeGraphemes = graphemes.slice(0, graphemeIndex);
            const cursorGrapheme = graphemes[graphemeIndex] || ' ';
            const afterGraphemes = graphemes.slice(graphemeIndex + 1);

            return (
              <Text key={visualIndex}>
                {showLineNumbers && <Text style={{ dim: true }}>{lineNumber}</Text>}
                {beforeGraphemes.join('')}
                <Text style={{ inverse: true }}>{cursorGrapheme}</Text>
                {afterGraphemes.join('')}
              </Text>
            );
          }

          // Non-cursor rows
          return (
            <Text key={visualIndex}>
              {showLineNumbers && <Text style={{ dim: true }}>{lineNumber}</Text>}
              {vl.text || ' '}
            </Text>
          );
        });
      }}
    </Box>
  );
}
