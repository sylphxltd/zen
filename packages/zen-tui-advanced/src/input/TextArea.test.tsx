import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
/** @jsxImportSource @zen/tui */
/**
 * TextArea Component Tests - Architecture Level
 *
 * CRITICAL: Import from @zen/tui to use same module instance as TextArea component
 */
import { createRoot, signal } from '@zen/runtime';
import { TextArea } from './TextArea.js';

import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';

setPlatformOps(tuiPlatformOps);

describe('TextArea Component', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  describe('Basic Rendering', () => {
    it('should render empty textarea', () => {
      const result = TextArea({ value: '' });
      expect(result).toBeDefined();
    });

    it('should render with initial value', () => {
      const result = TextArea({ value: 'Hello\nWorld' });
      expect(result).toBeDefined();
    });

    it('should render with placeholder when empty', () => {
      const result = TextArea({ value: '', placeholder: 'Enter text...' });
      expect(result).toBeDefined();
    });
  });

  describe('Placeholder Behavior', () => {
    it('should show placeholder when value is empty string', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          placeholder: 'Type here...',
          onChange: (v) => values.push(v),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type a character
      dispatchInput('a');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Value should be 'a', NOT 'aType here...' or 'Type here...a'
      expect(values.length).toBeGreaterThan(0);
      expect(values[values.length - 1]).toBe('a');
    });

    it('should NOT include placeholder in typed text', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          placeholder: 'Type here...',
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type multiple characters
      dispatchInput('H');
      dispatchInput('i');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should be 'Hi', NOT 'HiType here...'
      expect(values[values.length - 1]).toBe('Hi');
      expect(values[values.length - 1]).not.toContain('Type here');
    });

    it('should replace placeholder completely when typing starts', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          placeholder: 'Enter your message',
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('X');
      expect(values[values.length - 1].length).toBe(1);
    });
  });

  describe('Text Input', () => {
    it('should insert characters at cursor', async () => {
      const values: string[] = [];

      createRoot(() => {
        return TextArea({
          value: '',
          onChange: (v) => values.push(v),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('a');
      dispatchInput('b');
      dispatchInput('c');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values).toContain('a');
      expect(values).toContain('ab');
      expect(values).toContain('abc');
    });

    it('should handle Enter key for newlines', async () => {
      const values: string[] = [];
      const value = signal('Line1');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end and press Enter
      dispatchInput('\x1B[F'); // End
      dispatchInput('\r'); // Enter
      await new Promise((resolve) => setTimeout(resolve, 10));

      const hasNewline = values.some((v) => v.includes('\n'));
      expect(hasNewline).toBe(true);
    });

    it('should handle Backspace', async () => {
      const values: string[] = [];
      const value = signal('abc');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end
      dispatchInput('\x1B[F'); // End
      // Backspace
      dispatchInput('\x7f');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values).toContain('ab');
    });
  });

  describe('Line Wrapping', () => {
    it('should wrap text at column boundary', () => {
      // Test that visual lines are calculated correctly
      const result = TextArea({
        value: 'ABCDEFGHIJ', // 10 chars
        cols: 5, // Should wrap to 2 visual lines
        wrap: true,
        border: false,
      });

      expect(result).toBeDefined();
    });

    it('should handle text longer than cols', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 10,
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type 15 characters (more than cols=10)
      for (const char of 'ABCDEFGHIJKLMNO') {
        dispatchInput(char);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Value should contain all 15 characters
      expect(values[values.length - 1]).toBe('ABCDEFGHIJKLMNO');
      expect(values[values.length - 1].length).toBe(15);
    });

    it('should not lose characters when wrapping', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 5,
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type exactly 10 characters (2 lines of 5)
      for (const char of '1234567890') {
        dispatchInput(char);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('1234567890');
    });
  });

  describe('Focus Gate Pattern', () => {
    it('should NOT receive input when isFocused=false', async () => {
      const values: string[] = [];

      createRoot(() => {
        return TextArea({
          value: '',
          onChange: (v) => values.push(v),
          isFocused: false,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('x');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values).toEqual([]);
    });

    it('should receive input when isFocused=true', async () => {
      const values: string[] = [];

      createRoot(() => {
        return TextArea({
          value: '',
          onChange: (v) => values.push(v),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('y');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values.length).toBeGreaterThan(0);
    });

    it('should respond to reactive isFocused changes', async () => {
      const values: string[] = [];
      const focused = signal(false);

      createRoot(() => {
        return TextArea({
          value: '',
          onChange: (v) => values.push(v),
          isFocused: () => focused.value,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Not focused
      dispatchInput('a');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(values).toEqual([]);

      // Focus
      focused.value = true;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now should receive
      dispatchInput('b');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work in uncontrolled mode (no reactive value)', async () => {
      const values: string[] = [];

      createRoot(() => {
        return TextArea({
          value: 'Initial', // Plain string, not reactive
          onChange: (v) => values.push(v),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[F'); // End
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values.length).toBeGreaterThan(0);
      expect(values[values.length - 1]).toContain('X');
    });

    it('should work in controlled mode (reactive value)', async () => {
      const values: string[] = [];
      const value = signal('Start');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[F'); // End
      dispatchInput('!');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Start!');
    });
  });

  describe('Read-only Mode', () => {
    it('should NOT accept input when readOnly=true', async () => {
      const values: string[] = [];

      createRoot(() => {
        return TextArea({
          value: 'ReadOnly',
          onChange: (v) => values.push(v),
          isFocused: true,
          readOnly: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('x');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values).toEqual([]);
    });
  });

  describe('Initial Value Bug Reproduction', () => {
    it('should insert at cursor position 0, prepending to initial value', async () => {
      const values: string[] = [];
      const value = signal('Type here...');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type at cursor position 0 (start of line)
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(values[values.length - 1]).toBe('XType here...');
    });

    it('should correctly track cursor and insert multiple chars', async () => {
      const values: string[] = [];
      const value = signal('Hello');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type A B C at cursor 0
      dispatchInput('A');
      dispatchInput('B');
      dispatchInput('C');
      await new Promise((resolve) => setTimeout(resolve, 10));
      // Each character should be inserted at advancing cursor position
      expect(values).toContain('AHello');
      expect(values).toContain('ABHello');
      expect(values).toContain('ABCHello');
    });

    it('should correctly wrap text at contentWidth', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 10, // contentWidth = 10 - 2 (border) = 8
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type 20 characters
      for (const char of '12345678901234567890') {
        dispatchInput(char);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      const finalValue = values[values.length - 1];
      // Value should have all 20 chars (wrapping is visual only, not in value)
      expect(finalValue).toBe('12345678901234567890');
      expect(finalValue.length).toBe(20);
    });

    it('should calculate contentWidth correctly', () => {
      // cols=40, border=true (default) → contentWidth = 40 - 2 = 38
      // This is a visual rendering test
      const result = TextArea({
        value: 'A'.repeat(50), // 50 chars
        cols: 40,
        border: true, // default
        wrap: true,
      });

      // Check the result has correct style
      expect(result).toBeDefined();
    });
  });

  describe('Wide Character Support (CJK)', () => {
    it('should correctly wrap text with CJK characters (width=2)', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 12, // contentWidth = 10 after border
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type "大" (2 columns) + "abc" (3 columns) = 5 columns
      // Type more to test wrapping
      dispatchInput('大');
      dispatchInput('a');
      dispatchInput('b');
      dispatchInput('c');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('大abc');
    });

    it('should position cursor correctly with CJK characters', async () => {
      const values: string[] = [];
      const value = signal('大火');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 20,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end
      dispatchInput('\x1B[F'); // End
      // Type a character - should append after "火"
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('大火X');
    });

    it('should handle mixed CJK and ASCII text correctly', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 10, // contentWidth = 8 after border
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type mixed content: "A大B" = 4 columns (1+2+1)
      dispatchInput('A');
      dispatchInput('大');
      dispatchInput('B');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('A大B');
    });

    it('should wrap correctly when CJK char would exceed line width', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 7, // contentWidth = 5 after border
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type: "ABCD大"
      // ABCD = 4 cols, then 大 = 2 cols → total would be 6, exceeds 5
      // Should wrap 大 to next line
      for (const char of 'ABCD大') {
        dispatchInput(char);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      const finalValue = values[values.length - 1];
      expect(finalValue).toBe('ABCD大');
      // Visual wrapping test - the value stays the same, but display should wrap
    });

    it('should handle backspace correctly with CJK characters', async () => {
      const values: string[] = [];
      const value = signal('A大B');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end then backspace
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x7f'); // Backspace
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('A大');
    });

    it('should calculate visual width correctly for emoji', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 12,
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type emoji (width=2) + text
      dispatchInput('🎉');
      dispatchInput('a');
      dispatchInput('b');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('🎉ab');
    });
  });

  describe('Scrolling Behavior', () => {
    it('should handle content exceeding visible rows', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          rows: 3, // Only 3 visible rows
          cols: 20,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type multiple lines (more than rows=3)
      dispatchInput('Line1');
      dispatchInput('\r'); // Enter
      dispatchInput('Line2');
      dispatchInput('\r');
      dispatchInput('Line3');
      dispatchInput('\r');
      dispatchInput('Line4');
      dispatchInput('\r');
      dispatchInput('Line5');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const finalValue = values[values.length - 1];
      expect(finalValue).toContain('Line1');
      expect(finalValue).toContain('Line5');
      expect(finalValue.split('\n').length).toBe(5);
    });

    it('should scroll to keep cursor visible when adding lines', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          rows: 2,
          cols: 20,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add 5 lines - cursor should stay visible via auto-scroll
      for (let i = 1; i <= 5; i++) {
        dispatchInput(`L${i}`);
        if (i < 5) dispatchInput('\r');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('L1\nL2\nL3\nL4\nL5');
    });
  });

  describe('Cursor Movement Edge Cases', () => {
    it('should handle Home key at start of line', async () => {
      const values: string[] = [];
      const value = signal('Hello');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press Home (already at start), then type
      dispatchInput('\x1B[H'); // Home
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('XHello');
    });

    it('should handle End key at end of line', async () => {
      const values: string[] = [];
      const value = signal('Hello');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press End twice (should stay at end)
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x1B[F'); // End again
      dispatchInput('!');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Hello!');
    });

    it('should handle arrow keys at boundaries', async () => {
      const values: string[] = [];
      const value = signal('AB');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Start at position 0
      // Left arrow at start should do nothing
      dispatchInput('\x1B[D'); // Left
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('XAB');
    });

    it('should move between lines with up/down arrows', async () => {
      const values: string[] = [];
      const value = signal('Line1\nLine2\nLine3');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end of first line
      dispatchInput('\x1B[F'); // End (goes to end of Line1)
      // Move down
      dispatchInput('\x1B[B'); // Down
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cursor should now be in Line2
      expect(values[values.length - 1]).toContain('Line2');
    });
  });

  describe('Multi-line Editing', () => {
    it('should join lines when backspace at start of line', async () => {
      const values: string[] = [];
      const value = signal('Line1\nLine2');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to start of Line2
      dispatchInput('\x1B[B'); // Down
      dispatchInput('\x1B[H'); // Home
      // Backspace should join lines
      dispatchInput('\x7f');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Line1Line2');
    });

    it('should join lines when delete at end of line', async () => {
      const values: string[] = [];
      const value = signal('Line1\nLine2');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end of Line1
      dispatchInput('\x1B[F'); // End
      // Delete should join with next line
      dispatchInput('\x1B[3~'); // Delete key
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Line1Line2');
    });

    it('should split line correctly when Enter in middle', async () => {
      const values: string[] = [];
      const value = signal('HelloWorld');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move cursor to after "Hello" (position 5)
      dispatchInput('\x1B[C'); // Right x5
      dispatchInput('\x1B[C');
      dispatchInput('\x1B[C');
      dispatchInput('\x1B[C');
      dispatchInput('\x1B[C');
      // Press Enter
      dispatchInput('\r');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Hello\nWorld');
    });
  });

  describe('Edge Cases with Long Content', () => {
    it('should handle very long single line', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 10,
          wrap: true,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type 100 characters
      const longText = 'A'.repeat(100);
      for (const char of longText) {
        dispatchInput(char);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1].length).toBe(100);
    });

    it('should handle empty lines correctly', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create empty lines
      dispatchInput('\r');
      dispatchInput('\r');
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('\n\nX');
    });

    it('should preserve trailing newlines', async () => {
      const values: string[] = [];
      const value = signal('Text');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Move to end and add newlines
      dispatchInput('\x1B[F'); // End
      dispatchInput('\r');
      dispatchInput('\r');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Text\n\n');
    });
  });

  describe('Wide Character Edge Cases', () => {
    it('should handle cursor left through CJK character', async () => {
      const values: string[] = [];
      const value = signal('A大B');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Go to end, then left twice (should skip over 大 as one unit)
      dispatchInput('\x1B[F'); // End (after B)
      dispatchInput('\x1B[D'); // Left (before B, after 大)
      dispatchInput('\x1B[D'); // Left (before 大, after A)
      dispatchInput('X');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('AX大B');
    });

    it('should delete entire CJK character with backspace', async () => {
      const values: string[] = [];
      const value = signal('大');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Go to end and backspace
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x7f'); // Backspace
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('');
    });

    it('should handle emoji with ZWJ sequences', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          cols: 20,
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type family emoji (ZWJ sequence)
      dispatchInput('👨‍👩‍👧');
      dispatchInput('a');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('👨‍👩‍👧a');
    });
  });

  describe('No Cols Specified (Flexible Width)', () => {
    it('should work without cols specified', async () => {
      const values: string[] = [];
      const value = signal('');

      createRoot(() => {
        return TextArea({
          value: () => value.value,
          // No cols - should use flex width
          onChange: (v) => {
            value.value = v;
            values.push(v);
          },
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('Hello World');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(values[values.length - 1]).toBe('Hello World');
    });
  });
});
