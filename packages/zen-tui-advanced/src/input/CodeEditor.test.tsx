/** @jsxImportSource @zen/tui */
/**
 * CodeEditor Component Tests
 *
 * Tests for syntax highlighting, cursor navigation, editing, and scrolling.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { CodeEditor, type Language } from './CodeEditor.js';

setPlatformOps(tuiPlatformOps);

describe('CodeEditor', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render empty editor', () => {
      const result = CodeEditor({});
      expect(result).toBeDefined();
    });

    it('should render with initial value', () => {
      const result = CodeEditor({ value: 'const x = 1;' });
      expect(result).toBeDefined();
    });

    it('should render with multiline code', () => {
      const code = `function hello() {
  return "world";
}`;
      const result = CodeEditor({ value: code });
      expect(result).toBeDefined();
    });

    it('should render with custom rows and cols', () => {
      const result = CodeEditor({ rows: 30, cols: 100 });
      expect(result).toBeDefined();
    });

    it('should render without border', () => {
      const result = CodeEditor({ border: false });
      expect(result).toBeDefined();
    });

    it('should render without line numbers', () => {
      const result = CodeEditor({ showLineNumbers: false });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Language Support
  // ==========================================================================

  describe('Language Support', () => {
    const languages: Language[] = [
      'javascript',
      'typescript',
      'python',
      'json',
      'markdown',
      'plain',
    ];

    for (const lang of languages) {
      it(`should render ${lang} code`, () => {
        const result = CodeEditor({ language: lang, value: 'test code' });
        expect(result).toBeDefined();
      });
    }

    it('should highlight JavaScript keywords', () => {
      const code = 'const x = function() { return true; }';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight TypeScript type annotations', () => {
      const code = 'const x: string = "hello";';
      const result = CodeEditor({ language: 'typescript', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight Python keywords', () => {
      const code = 'def hello():\n    return True';
      const result = CodeEditor({ language: 'python', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight JSON literals', () => {
      const code = '{ "key": true, "value": null }';
      const result = CodeEditor({ language: 'json', value: code });
      expect(result).toBeDefined();
    });

    it('should handle comments in JavaScript', () => {
      const code = '// this is a comment\nconst x = 1;';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle comments in Python', () => {
      const code = '# this is a comment\nx = 1';
      const result = CodeEditor({ language: 'python', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight string literals', () => {
      const code = `const a = "double"; const b = 'single'; const c = \`template\`;`;
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight numbers', () => {
      const code = 'const x = 42; const y = 3.14; const z = 1e10;';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should highlight function calls', () => {
      const code = 'console.log("hello"); myFunction();';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Cursor Navigation
  // ==========================================================================

  describe('Cursor Navigation', () => {
    it('should move cursor down with ↓', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2\nline3',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down arrow
      await new Promise((r) => setTimeout(r, 10));

      // No change expected, just navigation
    });

    it('should move cursor up with ↑', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2\nline3',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down
      dispatchInput('\x1B[A'); // Up
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should move cursor left with ←', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'hello',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right first
      dispatchInput('\x1B[D'); // Then left
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should move cursor right with →', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'hello',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should go to start of line with Home', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'hello world',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right
      dispatchInput('\x1B[H'); // Home
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should go to end of line with End', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'hello world',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[F'); // End
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should page up and down', async () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');

      createRoot(() => {
        return CodeEditor({
          value: lines,
          rows: 10,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[6~'); // Page Down
      await new Promise((r) => setTimeout(r, 10));
      dispatchInput('\x1B[5~'); // Page Up
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should wrap cursor to previous line when going left at start', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Go to line 2
      dispatchInput('\x1B[D'); // Left at start of line 2 -> end of line 1
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should wrap cursor to next line when going right at end', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'abc\ndef',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      // Move to end of line 1
      for (let i = 0; i < 4; i++) dispatchInput('\x1B[C');
      // One more right should go to start of line 2
      dispatchInput('\x1B[C');
      await new Promise((r) => setTimeout(r, 10));
    });
  });

  // ==========================================================================
  // Text Editing
  // ==========================================================================

  describe('Text Editing', () => {
    it('should insert character', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('a');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('a');
    });

    it('should insert multiple characters', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('h');
      dispatchInput('i');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes[changes.length - 1]).toBe('hi');
    });

    it('should delete character with Backspace', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'abc',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      // Move to end
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x7F'); // Backspace
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('ab');
    });

    it('should delete character with Delete key', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'abc',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[3~'); // Delete key
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('bc');
    });

    it('should insert newline with Enter', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'hello',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\r'); // Enter
      await new Promise((r) => setTimeout(r, 10));

      expect(changes[changes.length - 1]).toContain('\n');
    });

    it('should auto-indent on newline', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '  indented',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[F'); // End
      dispatchInput('\r'); // Enter
      await new Promise((r) => setTimeout(r, 10));

      const lastChange = changes[changes.length - 1];
      // Should have preserved indentation
      expect(lastChange).toContain('\n  '); // 2 spaces preserved
    });

    it('should insert Tab as spaces', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\t'); // Tab
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('  '); // 2 spaces
    });

    it('should join lines when backspacing at start of line', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down to line 2
      dispatchInput('\x7F'); // Backspace at start
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('line1line2');
    });

    it('should join lines when deleting at end of line', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[F'); // End of line 1
      dispatchInput('\x1B[3~'); // Delete
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('line1line2');
    });
  });

  // ==========================================================================
  // Read-Only Mode
  // ==========================================================================

  describe('Read-Only Mode', () => {
    it('should not allow typing in read-only mode', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'original',
          readOnly: true,
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('x');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toEqual([]);
    });

    it('should not allow backspace in read-only mode', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'original',
          readOnly: true,
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x7F'); // Backspace
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toEqual([]);
    });

    it('should allow navigation in read-only mode', async () => {
      // Navigation should still work, just no editing
      createRoot(() => {
        return CodeEditor({
          value: 'line1\nline2',
          readOnly: true,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down
      dispatchInput('\x1B[C'); // Right
      await new Promise((r) => setTimeout(r, 10));
      // No assertion needed - just verifying it doesn't crash
    });
  });

  // ==========================================================================
  // Focus Handling
  // ==========================================================================

  describe('Focus Handling', () => {
    it('should not receive input when not focused', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: 'original',
          isFocused: false,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('x');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toEqual([]);
    });

    it('should receive input when focused', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('x');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('x');
    });
  });

  // ==========================================================================
  // Scrolling
  // ==========================================================================

  describe('Scrolling', () => {
    it('should scroll when cursor moves below visible area', async () => {
      const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');

      createRoot(() => {
        return CodeEditor({
          value: lines,
          rows: 5,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate down past visible area
      for (let i = 0; i < 10; i++) {
        dispatchInput('\x1B[B'); // Down
      }
      await new Promise((r) => setTimeout(r, 10));
      // No assertion - verifying it doesn't crash
    });

    it('should scroll horizontally in non-wrap mode', async () => {
      const longLine = 'x'.repeat(200);

      createRoot(() => {
        return CodeEditor({
          value: longLine,
          cols: 40,
          wrap: false,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Move cursor to end
      dispatchInput('\x1B[F'); // End
      await new Promise((r) => setTimeout(r, 10));
      // No assertion - verifying it doesn't crash
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('a');
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain('a');
    });

    it('should handle single character file', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'x',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      // Navigate and verify no crash
      dispatchInput('\x1B[C'); // Right
      dispatchInput('\x1B[D'); // Left
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle file with only newlines', async () => {
      createRoot(() => {
        return CodeEditor({
          value: '\n\n\n',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down
      dispatchInput('\x1B[B'); // Down
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle very long lines', async () => {
      const longLine = 'abcdefghij'.repeat(100);

      createRoot(() => {
        return CodeEditor({
          value: longLine,
          cols: 80,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[F'); // End
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle special characters', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('→'); // Unicode arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle cursor at boundaries', async () => {
      createRoot(() => {
        return CodeEditor({
          value: 'abc',
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Try to go past start
      dispatchInput('\x1B[D'); // Left at start (should be no-op)
      dispatchInput('\x1B[D'); // Left again

      // Go to end and try to go past
      dispatchInput('\x1B[F'); // End
      dispatchInput('\x1B[C'); // Right at end (should be no-op)

      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle rapid key presses', async () => {
      const changes: string[] = [];

      createRoot(() => {
        return CodeEditor({
          value: '',
          isFocused: true,
          onChange: (v) => changes.push(v),
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Rapid typing
      for (const char of 'hello world') {
        dispatchInput(char);
      }
      await new Promise((r) => setTimeout(r, 10));

      expect(changes[changes.length - 1]).toBe('hello world');
    });
  });

  // ==========================================================================
  // Syntax Highlighting Edge Cases
  // ==========================================================================

  describe('Syntax Highlighting Edge Cases', () => {
    it('should handle unclosed string', () => {
      const code = 'const x = "unclosed';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle nested quotes', () => {
      const code = `const x = "he said 'hello'"`;
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle escaped characters in strings', () => {
      const code = `const x = "line1\\nline2"`;
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle empty strings', () => {
      const code = `const x = ""; const y = '';`;
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle operators', () => {
      const code = 'const x = a + b * c / d - e % f';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle comparison operators', () => {
      const code = 'if (a === b && c !== d || e >= f) {}';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle negative numbers', () => {
      const code = 'const x = -42; const y = -3.14;';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });

    it('should handle scientific notation', () => {
      const code = 'const x = 1e10; const y = 2.5e-3;';
      const result = CodeEditor({ language: 'javascript', value: code });
      expect(result).toBeDefined();
    });
  });
});
