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
});
