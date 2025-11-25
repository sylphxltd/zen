/** @jsxImportSource @zen/tui */
/**
 * CodeEditor Component
 *
 * Multi-line code editor with line numbers and syntax highlighting.
 * Built for code editing in TUI applications.
 *
 * Features:
 * - Line numbers (always visible)
 * - Syntax highlighting (JS/TS, Python, JSON, etc.)
 * - All TextArea features (cursor, editing, wrapping)
 *
 * @example
 * ```tsx
 * const code = signal('function hello() {\n  return "world";\n}');
 *
 * <CodeEditor
 *   value={code.value}
 *   onChange={(v) => code.value = v}
 *   language="typescript"
 *   rows={20}
 * />
 * ```
 */

import { Box, Text, batch, computed, signal, useInput } from '@zen/tui';

export type Language = 'javascript' | 'typescript' | 'python' | 'json' | 'markdown' | 'plain';

export interface CodeEditorProps {
  /** Current code value */
  value?: string;

  /** Callback when code changes */
  onChange?: (value: string) => void;

  /** Programming language for syntax highlighting */
  language?: Language;

  /** Number of visible rows */
  rows?: number;

  /** Number of columns (width) */
  cols?: number;

  /** Read-only mode */
  readOnly?: boolean;

  /** Focus management */
  isFocused?: boolean;

  /** Border style */
  border?: boolean;

  /** Show line numbers (default: true for CodeEditor) */
  showLineNumbers?: boolean;

  /** Enable line wrapping (default: false for code) */
  wrap?: boolean;
}

// Token types for syntax highlighting
type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'operator'
  | 'function'
  | 'type'
  | 'plain';

interface Token {
  type: TokenType;
  value: string;
}

// Color mapping for token types
const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: 'magenta',
  string: 'green',
  comment: 'gray',
  number: 'yellow',
  operator: 'cyan',
  function: 'blue',
  type: 'cyan',
  plain: 'white',
};

// Language-specific keywords
const KEYWORDS: Record<Language, string[]> = {
  javascript: [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'try',
    'catch',
    'finally',
    'throw',
    'class',
    'extends',
    'new',
    'this',
    'super',
    'import',
    'export',
    'default',
    'async',
    'await',
    'yield',
    'typeof',
    'instanceof',
    'in',
    'of',
    'delete',
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
  ],
  typescript: [
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'try',
    'catch',
    'finally',
    'throw',
    'class',
    'extends',
    'new',
    'this',
    'super',
    'import',
    'export',
    'default',
    'async',
    'await',
    'yield',
    'typeof',
    'instanceof',
    'in',
    'of',
    'delete',
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
    'interface',
    'type',
    'enum',
    'namespace',
    'module',
    'declare',
    'readonly',
    'public',
    'private',
    'protected',
    'static',
    'abstract',
    'implements',
    'as',
    'is',
    'keyof',
    'infer',
    'never',
    'unknown',
    'any',
    'void',
  ],
  python: [
    'def',
    'return',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'break',
    'continue',
    'try',
    'except',
    'finally',
    'raise',
    'with',
    'as',
    'class',
    'pass',
    'import',
    'from',
    'async',
    'await',
    'yield',
    'lambda',
    'global',
    'nonlocal',
    'True',
    'False',
    'None',
    'and',
    'or',
    'not',
    'in',
    'is',
    'del',
  ],
  json: ['true', 'false', 'null'],
  markdown: [],
  plain: [],
};

// Type keywords (highlighted differently)
const TYPE_KEYWORDS: Record<Language, string[]> = {
  javascript: [
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Function',
    'Promise',
    'Map',
    'Set',
  ],
  typescript: [
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Function',
    'Promise',
    'Map',
    'Set',
    'string',
    'number',
    'boolean',
    'object',
    'symbol',
    'bigint',
  ],
  python: ['int', 'str', 'float', 'bool', 'list', 'dict', 'tuple', 'set', 'None'],
  json: [],
  markdown: [],
  plain: [],
};

/**
 * Simple tokenizer for syntax highlighting
 */
function tokenize(line: string, language: Language): Token[] {
  if (language === 'plain') {
    return [{ type: 'plain', value: line }];
  }

  const tokens: Token[] = [];
  let remaining = line;
  const keywords = KEYWORDS[language] || [];
  const typeKeywords = TYPE_KEYWORDS[language] || [];

  while (remaining.length > 0) {
    let matched = false;

    // Comments
    if (language === 'python' && remaining.startsWith('#')) {
      tokens.push({ type: 'comment', value: remaining });
      break;
    }
    if ((language === 'javascript' || language === 'typescript') && remaining.startsWith('//')) {
      tokens.push({ type: 'comment', value: remaining });
      break;
    }

    // Strings (double quotes)
    const doubleQuoteMatch = remaining.match(/^"(?:[^"\\]|\\.)*"/);
    if (doubleQuoteMatch) {
      tokens.push({ type: 'string', value: doubleQuoteMatch[0] });
      remaining = remaining.slice(doubleQuoteMatch[0].length);
      matched = true;
      continue;
    }

    // Strings (single quotes)
    const singleQuoteMatch = remaining.match(/^'(?:[^'\\]|\\.)*'/);
    if (singleQuoteMatch) {
      tokens.push({ type: 'string', value: singleQuoteMatch[0] });
      remaining = remaining.slice(singleQuoteMatch[0].length);
      matched = true;
      continue;
    }

    // Template strings (backticks)
    const templateMatch = remaining.match(/^`(?:[^`\\]|\\.)*`/);
    if (templateMatch) {
      tokens.push({ type: 'string', value: templateMatch[0] });
      remaining = remaining.slice(templateMatch[0].length);
      matched = true;
      continue;
    }

    // Numbers
    const numberMatch = remaining.match(/^-?\d+\.?\d*(?:e[+-]?\d+)?/i);
    if (numberMatch) {
      tokens.push({ type: 'number', value: numberMatch[0] });
      remaining = remaining.slice(numberMatch[0].length);
      matched = true;
      continue;
    }

    // Identifiers (keywords, types, functions)
    const identMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (identMatch) {
      const word = identMatch[0];
      let tokenType: TokenType = 'plain';

      if (keywords.includes(word)) {
        tokenType = 'keyword';
      } else if (typeKeywords.includes(word)) {
        tokenType = 'type';
      } else if (remaining.length > word.length && remaining[word.length] === '(') {
        tokenType = 'function';
      }

      tokens.push({ type: tokenType, value: word });
      remaining = remaining.slice(word.length);
      matched = true;
      continue;
    }

    // Operators
    const operatorMatch = remaining.match(/^[+\-*/%=<>!&|^~?:]+/);
    if (operatorMatch) {
      tokens.push({ type: 'operator', value: operatorMatch[0] });
      remaining = remaining.slice(operatorMatch[0].length);
      matched = true;
      continue;
    }

    // Whitespace and other characters
    if (!matched) {
      tokens.push({ type: 'plain', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

/**
 * CodeEditor Component
 */
export function CodeEditor(props: CodeEditorProps) {
  const {
    value: externalValue = '',
    onChange,
    language = 'typescript',
    rows = 20,
    cols = 80,
    readOnly = false,
    isFocused = true,
    border = true,
    showLineNumbers = true,
    wrap = false, // Default off for code (preserve formatting)
  } = props;

  // Calculate available content width
  const lineNumberWidth = showLineNumbers ? 5 : 0; // "   1 " = 5 chars
  const borderWidth = border ? 2 : 0;
  const contentWidth = Math.max(1, cols - borderWidth - lineNumberWidth);

  // Internal state
  const internalValue = signal(externalValue);
  const cursorRow = signal(0);
  const cursorCol = signal(0);
  const scrollOffset = signal(0);
  const horizontalScroll = signal(0); // For non-wrapped mode

  const currentValue = computed(() => internalValue.value);

  // Split into lines
  const lines = computed(() => {
    const text = currentValue.value;
    return text ? text.split('\n') : [''];
  });

  // Visible lines
  const visibleLines = computed(() => {
    const allLines = lines.value;
    const start = scrollOffset.value;
    const end = Math.min(start + rows, allLines.length);
    return allLines.slice(start, end);
  });

  // Constrain cursor
  const constrainCursor = () => {
    const currentLines = lines.value;
    const maxRow = Math.max(0, currentLines.length - 1);
    const currentRow = Math.min(cursorRow.value, maxRow);
    const currentLine = currentLines[currentRow] || '';
    const maxCol = currentLine.length;

    cursorRow.value = currentRow;
    cursorCol.value = Math.min(cursorCol.value, maxCol);

    // Vertical scroll
    if (cursorRow.value < scrollOffset.value) {
      scrollOffset.value = cursorRow.value;
    } else if (cursorRow.value >= scrollOffset.value + rows) {
      scrollOffset.value = cursorRow.value - rows + 1;
    }

    // Horizontal scroll (for non-wrapped mode)
    if (!wrap) {
      if (cursorCol.value < horizontalScroll.value) {
        horizontalScroll.value = cursorCol.value;
      } else if (cursorCol.value >= horizontalScroll.value + contentWidth) {
        horizontalScroll.value = cursorCol.value - contentWidth + 1;
      }
    }
  };

  // Insert text
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

    batch(() => {
      internalValue.value = newValue;
      cursorCol.value = col + text.length;
    });

    if (onChange) onChange(newValue);
    constrainCursor();
  };

  // Delete character
  const deleteChar = (direction: 'forward' | 'backward') => {
    if (readOnly) return;

    const currentLines = [...lines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    let newCol = col;
    let newRow = row;

    if (direction === 'backward') {
      if (col > 0) {
        currentLines[row] = line.slice(0, col - 1) + line.slice(col);
        newCol = col - 1;
      } else if (row > 0) {
        const prevLine = currentLines[row - 1];
        currentLines[row - 1] = prevLine + line;
        currentLines.splice(row, 1);
        newRow = row - 1;
        newCol = prevLine.length;
      }
    } else {
      if (col < line.length) {
        currentLines[row] = line.slice(0, col) + line.slice(col + 1);
      } else if (row < currentLines.length - 1) {
        currentLines[row] = line + currentLines[row + 1];
        currentLines.splice(row + 1, 1);
      }
    }

    const newValue = currentLines.join('\n');

    batch(() => {
      internalValue.value = newValue;
      cursorRow.value = newRow;
      cursorCol.value = newCol;
    });

    if (onChange) onChange(newValue);
    constrainCursor();
  };

  // Insert newline
  const insertNewline = () => {
    if (readOnly) return;

    const currentLines = [...lines.value];
    const row = cursorRow.value;
    const col = cursorCol.value;
    const line = currentLines[row] || '';

    // Auto-indent: copy leading whitespace from current line
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    currentLines[row] = line.slice(0, col);
    currentLines.splice(row + 1, 0, indent + line.slice(col));

    const newValue = currentLines.join('\n');

    batch(() => {
      internalValue.value = newValue;
      cursorRow.value = row + 1;
      cursorCol.value = indent.length;
    });

    if (onChange) onChange(newValue);
    constrainCursor();
  };

  // Keyboard input handler
  useInput(
    (input, key) => {
      if (!isFocused || readOnly) return false;

      const currentLines = lines.value;

      if (key.upArrow) {
        if (cursorRow.value > 0) {
          cursorRow.value -= 1;
          constrainCursor();
        }
        return true;
      }
      if (key.downArrow) {
        if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          constrainCursor();
        }
        return true;
      }
      if (key.leftArrow) {
        if (cursorCol.value > 0) {
          cursorCol.value -= 1;
        } else if (cursorRow.value > 0) {
          cursorRow.value -= 1;
          cursorCol.value = (currentLines[cursorRow.value] || '').length;
          constrainCursor();
        }
        return true;
      }
      if (key.rightArrow) {
        const currentLine = currentLines[cursorRow.value] || '';
        if (cursorCol.value < currentLine.length) {
          cursorCol.value += 1;
        } else if (cursorRow.value < currentLines.length - 1) {
          cursorRow.value += 1;
          cursorCol.value = 0;
          constrainCursor();
        }
        return true;
      }
      if (key.home) {
        cursorCol.value = 0;
        horizontalScroll.value = 0;
        return true;
      }
      if (key.end) {
        cursorCol.value = (currentLines[cursorRow.value] || '').length;
        constrainCursor();
        return true;
      }
      if (key.pageUp) {
        cursorRow.value = Math.max(0, cursorRow.value - rows);
        constrainCursor();
        return true;
      }
      if (key.pageDown) {
        cursorRow.value = Math.min(currentLines.length - 1, cursorRow.value + rows);
        constrainCursor();
        return true;
      }
      if (key.backspace || key.delete) {
        deleteChar(key.backspace ? 'backward' : 'forward');
        return true;
      }
      if (key.return) {
        insertNewline();
        return true;
      }
      // Tab inserts 2 spaces (common for code)
      if (key.tab) {
        insertText('  ');
        return true;
      }
      // Regular text
      if (input && !key.ctrl && !key.meta) {
        insertText(input);
        return true;
      }

      return false;
    },
    { isActive: isFocused, priority: 10 },
  );

  // Render a single line with syntax highlighting
  const renderLine = (lineText: string, lineIndex: number, isCursorLine: boolean) => {
    const _tokens = tokenize(lineText, language);
    const globalLineNum = scrollOffset.value + lineIndex;

    // For horizontal scrolling in non-wrap mode
    const hScroll = horizontalScroll.value;
    let displayText = lineText;
    if (!wrap && lineText.length > contentWidth) {
      displayText = lineText.slice(hScroll, hScroll + contentWidth);
    }

    // Line number
    const lineNumber = showLineNumbers ? `${`${globalLineNum + 1}`.padStart(4, ' ')} ` : '';

    if (isCursorLine && isFocused) {
      // Render with cursor
      const cursorPosInDisplay = wrap ? cursorCol.value : cursorCol.value - hScroll;

      // Re-tokenize the visible portion for cursor line
      const visibleTokens = tokenize(displayText, language);
      let charIndex = 0;
      // biome-ignore lint/suspicious/noExplicitAny: JSX return types vary by runtime
      const elements: any[] = [];

      if (showLineNumbers) {
        elements.push(
          <Text key="ln" style={{ dim: true }}>
            {lineNumber}
          </Text>,
        );
      }

      for (const token of visibleTokens) {
        const tokenStart = charIndex;
        const tokenEnd = charIndex + token.value.length;

        if (cursorPosInDisplay >= tokenStart && cursorPosInDisplay < tokenEnd) {
          // Cursor is in this token
          const beforeCursor = token.value.slice(0, cursorPosInDisplay - tokenStart);
          const cursorChar = token.value[cursorPosInDisplay - tokenStart] || ' ';
          const afterCursor = token.value.slice(cursorPosInDisplay - tokenStart + 1);

          if (beforeCursor) {
            elements.push(
              <Text key={`${tokenStart}a`} style={{ color: TOKEN_COLORS[token.type] }}>
                {beforeCursor}
              </Text>,
            );
          }
          elements.push(
            <Text key={`${tokenStart}c`} style={{ inverse: true }}>
              {cursorChar}
            </Text>,
          );
          if (afterCursor) {
            elements.push(
              <Text key={`${tokenStart}b`} style={{ color: TOKEN_COLORS[token.type] }}>
                {afterCursor}
              </Text>,
            );
          }
        } else {
          elements.push(
            <Text key={`t${tokenStart}`} style={{ color: TOKEN_COLORS[token.type] }}>
              {token.value}
            </Text>,
          );
        }

        charIndex = tokenEnd;
      }

      // Cursor at end of line
      if (cursorPosInDisplay >= charIndex) {
        elements.push(
          <Text key="cursor-end" style={{ inverse: true }}>
            {' '}
          </Text>,
        );
      }

      return <Text key={globalLineNum}>{elements}</Text>;
    }

    // Non-cursor line with highlighting
    const visibleTokens = tokenize(displayText, language);

    // Render tokens with character position as key
    let charPos = 0;
    const tokenElements = visibleTokens.map((token) => {
      const key = `t${charPos}`;
      charPos += token.value.length;
      return (
        <Text key={key} style={{ color: TOKEN_COLORS[token.type] }}>
          {token.value}
        </Text>
      );
    });

    return (
      <Text key={globalLineNum}>
        {showLineNumbers && <Text style={{ dim: true }}>{lineNumber}</Text>}
        {tokenElements}
        {displayText === '' && ' '}
      </Text>
    );
  };

  return (
    <Box
      style={{
        flexDirection: 'column',
        width: cols,
        height: rows + (border ? 2 : 0),
        borderStyle: border ? 'single' : undefined,
        borderColor: isFocused ? 'cyan' : 'gray',
        overflow: 'hidden',
      }}
    >
      {() => {
        const displayLines = visibleLines.value;

        return displayLines.map((lineText, index) => {
          const globalIndex = scrollOffset.value + index;
          const isCursorLine = globalIndex === cursorRow.value;
          return renderLine(lineText, index, isCursorLine);
        });
      }}
    </Box>
  );
}
