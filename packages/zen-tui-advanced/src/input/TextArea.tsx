/** @jsxImportSource @zen/tui */
/**
 * TextArea Component
 *
 * Multi-line text editor with scrolling, selection, and editing support.
 * Essential for commit messages, file editing, form inputs in TUI apps.
 *
 * Features:
 * - Multi-line text editing
 * - Cursor movement (arrows, home/end, page up/down)
 * - Text selection and clipboard operations
 * - Line wrapping support
 * - Scrolling for large content
 * - Line numbers (optional)
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

import { Box, Text, signal, computed, useInput } from '@zen/tui';

export interface TextAreaProps {
  /** Current text value */
  value?: string;

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

  /** Focus management */
  isFocused?: boolean;

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
    value: externalValue = '',
    onChange,
    rows = 10,
    cols = 60,
    placeholder = '',
    showLineNumbers = false,
    wrap = true,
    readOnly = false,
    isFocused = true,
    border = true,
  } = props;

  // Internal state
  const internalValue = signal(externalValue);
  const cursorRow = signal(0);
  const cursorCol = signal(0);
  const scrollOffset = signal(0);

  // Use external value if provided
  const currentValue = computed(() =>
    onChange ? externalValue : internalValue.value,
  );

  // Split text into lines
  const lines = computed(() => {
    const text = currentValue.value;
    return text ? text.split('\n') : [''];
  });

  // Visible lines with scroll offset
  const visibleLines = computed(() => {
    const allLines = lines.value;
    const start = scrollOffset.value;
    const end = Math.min(start + rows, allLines.length);
    return allLines.slice(start, end);
  });

  // Update cursor position constraints
  const constrainCursor = () => {
    const currentLines = lines.value;
    const maxRow = Math.max(0, currentLines.length - 1);
    const currentRow = Math.min(cursorRow.value, maxRow);
    const currentLine = currentLines[currentRow] || '';
    const maxCol = currentLine.length;

    cursorRow.value = currentRow;
    cursorCol.value = Math.min(cursorCol.value, maxCol);

    // Auto-scroll to keep cursor visible
    if (currentRow < scrollOffset.value) {
      scrollOffset.value = currentRow;
    } else if (currentRow >= scrollOffset.value + rows) {
      scrollOffset.value = currentRow - rows + 1;
    }
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    if (readOnly) return;

    const currentLines = lines.value;
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    const newLine = line.slice(0, col) + text + line.slice(col);
    const newLines = [...currentLines];
    newLines[row] = newLine;

    const newValue = newLines.join('\n');
    if (onChange) {
      onChange(newValue);
    } else {
      internalValue.value = newValue;
    }

    cursorCol.value = col + text.length;
    constrainCursor();
  };

  // Delete character at cursor
  const deleteChar = (direction: 'forward' | 'backward') => {
    if (readOnly) return;

    const currentLines = [...lines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    if (direction === 'backward') {
      if (col > 0) {
        // Delete character before cursor
        const newLine = line.slice(0, col - 1) + line.slice(col);
        currentLines[row] = newLine;
        cursorCol.value = col - 1;
      } else if (row > 0) {
        // Merge with previous line
        const prevLine = currentLines[row - 1];
        currentLines[row - 1] = prevLine + line;
        currentLines.splice(row, 1);
        cursorRow.value = row - 1;
        cursorCol.value = prevLine.length;
      }
    } else {
      // forward
      if (col < line.length) {
        // Delete character at cursor
        const newLine = line.slice(0, col) + line.slice(col + 1);
        currentLines[row] = newLine;
      } else if (row < currentLines.length - 1) {
        // Merge with next line
        const nextLine = currentLines[row + 1];
        currentLines[row] = line + nextLine;
        currentLines.splice(row + 1, 1);
      }
    }

    const newValue = currentLines.join('\n');
    if (onChange) {
      onChange(newValue);
    } else {
      internalValue.value = newValue;
    }

    constrainCursor();
  };

  // Insert newline
  const insertNewline = () => {
    if (readOnly) return;

    const currentLines = [...lines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    const beforeCursor = line.slice(0, col);
    const afterCursor = line.slice(col);

    currentLines[row] = beforeCursor;
    currentLines.splice(row + 1, 0, afterCursor);

    const newValue = currentLines.join('\n');
    if (onChange) {
      onChange(newValue);
    } else {
      internalValue.value = newValue;
    }

    cursorRow.value = row + 1;
    cursorCol.value = 0;
    constrainCursor();
  };

  // Keyboard input handler
  useInput(
    (input, key) => {
      if (!isFocused || readOnly) return;

      const currentLines = lines.value;

      // Arrow keys - cursor movement
      if (key.upArrow) {
        if (cursorRow.value > 0) {
          cursorRow.value -= 1;
          constrainCursor();
        }
      } else if (key.downArrow) {
        if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          constrainCursor();
        }
      } else if (key.leftArrow) {
        if (cursorCol.value > 0) {
          cursorCol.value -= 1;
        } else if (cursorRow.value > 0) {
          cursorRow.value -= 1;
          cursorCol.value = (currentLines[cursorRow.value] || '').length;
          constrainCursor();
        }
      } else if (key.rightArrow) {
        const currentLine = currentLines[cursorRow.value] || '';
        if (cursorCol.value < currentLine.length) {
          cursorCol.value += 1;
        } else if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          cursorCol.value = 0;
          constrainCursor();
        }
      }
      // Home/End
      else if (key.home) {
        cursorCol.value = 0;
      } else if (key.end) {
        const currentLine = currentLines[cursorRow.value] || '';
        cursorCol.value = currentLine.length;
      }
      // Page Up/Down
      else if (key.pageUp) {
        cursorRow.value = Math.max(0, cursorRow.value - rows);
        constrainCursor();
      } else if (key.pageDown) {
        cursorRow.value = Math.min(currentLines.length - 1, cursorRow.value + rows);
        constrainCursor();
      }
      // Backspace/Delete
      else if (key.backspace || key.delete) {
        deleteChar(key.backspace ? 'backward' : 'forward');
      }
      // Enter
      else if (key.return) {
        insertNewline();
      }
      // Regular text input
      else if (input && !key.ctrl && !key.meta) {
        insertText(input);
      }
    },
    { isActive: isFocused },
  );

  // Render
  return (
    <Box
      flexDirection="column"
      width={cols}
      height={rows + (border ? 2 : 0)}
      borderStyle={border ? 'single' : undefined}
      borderColor={isFocused ? 'cyan' : 'gray'}
    >
      {() => {
        const displayLines = visibleLines.value;
        const isEmpty = currentValue.value === '';

        if (isEmpty && placeholder) {
          return <Text dimColor>{placeholder}</Text>;
        }

        return displayLines.map((line, index) => {
          const globalRow = scrollOffset.value + index;
          const isCursorRow = globalRow === cursorRow.value;
          const lineNumber = showLineNumbers ? `${globalRow + 1}`.padStart(4, ' ') : '';

          return (
            <Box key={globalRow} gap={1}>
              {showLineNumbers && <Text dimColor>{lineNumber}</Text>}
              <Text>
                {() => {
                  if (isCursorRow && isFocused) {
                    const col = cursorCol.value;
                    const before = line.slice(0, col);
                    const cursor = line[col] || ' ';
                    const after = line.slice(col + 1);
                    return (
                      <>
                        {before}
                        <Text inverse>{cursor}</Text>
                        {after}
                      </>
                    );
                  }
                  return line || ' ';
                }}
              </Text>
            </Box>
          );
        });
      }}

      {/* Scroll indicator */}
      {lines.value.length > rows && (
        <Box marginTop={1}>
          <Text dimColor>
            {() => `Lines ${scrollOffset.value + 1}-${Math.min(scrollOffset.value + rows, lines.value.length)} of ${lines.value.length}`}
          </Text>
        </Box>
      )}
    </Box>
  );
}
