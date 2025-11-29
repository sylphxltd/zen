import { describe, expect, it } from 'bun:test';
import {
  sliceAtWordBoundary,
  wrapLine,
  wrapText,
  findCursorVisualLine,
  isCursorOnLine,
  type VisualLine,
} from './text-wrap';

describe('text-wrap module', () => {
  // ===========================================================================
  // sliceAtWordBoundary
  // ===========================================================================
  describe('sliceAtWordBoundary', () => {
    it('should slice at word boundary when possible', () => {
      const result = sliceAtWordBoundary('hello world foo', 10);
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });

    it('should fall back to character slice when no space', () => {
      const result = sliceAtWordBoundary('abcdefghijklmnop', 10);
      expect(result.text).toBe('abcdefghij');
      expect(result.charCount).toBe(10);
    });

    it('should reserve cursor space when requested', () => {
      const result = sliceAtWordBoundary('hello world foo', 10, true);
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });

    it('should handle text that ends at space', () => {
      const result = sliceAtWordBoundary('hello ', 10);
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });

    it('should handle empty string', () => {
      const result = sliceAtWordBoundary('', 10);
      expect(result.text).toBe('');
      expect(result.charCount).toBe(0);
    });

    it('should handle single character', () => {
      const result = sliceAtWordBoundary('a', 10);
      expect(result.text).toBe('a');
      expect(result.charCount).toBe(1);
    });

    it('should handle text shorter than maxWidth', () => {
      const result = sliceAtWordBoundary('hi', 10);
      expect(result.text).toBe('hi');
      expect(result.charCount).toBe(2);
    });

    it('should handle text with only spaces', () => {
      const result = sliceAtWordBoundary('     ', 3);
      expect(result.text).toBe('   ');
      expect(result.charCount).toBe(3);
    });

    it('should handle leading space', () => {
      const result = sliceAtWordBoundary(' hello world', 8);
      expect(result.text).toBe(' hello ');
      expect(result.charCount).toBe(7);
    });

    it('should handle multiple consecutive spaces', () => {
      const result = sliceAtWordBoundary('hello    world', 10);
      // Should break at last space within width
      expect(result.text).toBe('hello    ');
      expect(result.charCount).toBe(9);
    });

    // CJK characters (width 2 each)
    it('should handle CJK characters correctly', () => {
      // 中文 = 2 chars, 4 columns
      const result = sliceAtWordBoundary('中文测试', 5);
      // Can fit 2 CJK chars (4 cols), 3rd would be 6 cols
      expect(result.text).toBe('中文');
      expect(result.charCount).toBe(2);
      expect(result.width).toBe(4);
    });

    it('should handle mixed ASCII and CJK', () => {
      const result = sliceAtWordBoundary('hi中文', 5);
      // 'hi' = 2 cols, '中' = 2 cols = 4 cols fits
      // Adding '文' would be 6 cols
      expect(result.text).toBe('hi中');
      expect(result.charCount).toBe(3);
    });
  });

  // ===========================================================================
  // wrapLine
  // ===========================================================================
  describe('wrapLine', () => {
    it('should not wrap short lines', () => {
      const result = wrapLine('hello', 0, { contentWidth: 20 });
      expect(result.length).toBe(1);
      expect(result[0].text).toBe('hello');
    });

    it('should wrap long lines at word boundaries', () => {
      const result = wrapLine('hello world foo bar', 0, { contentWidth: 12 });
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('hello world ');
      expect(result[1].text).toBe('foo bar');
    });

    it('should reserve cursor space by default', () => {
      const text = 'a'.repeat(37);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      expect(result.length).toBe(1);
    });

    it('should wrap at cursor threshold with word boundaries', () => {
      const text = 'hello world foo bar baz qux abc def';
      const result = wrapLine(text + ' xy', 0, { contentWidth: 38 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('should fit no-space text at exactly contentWidth', () => {
      const text = 'a'.repeat(38);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      expect(result.length).toBe(1);
    });

    it('should wrap no-space text exceeding contentWidth', () => {
      const text = 'a'.repeat(39);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      expect(result.length).toBe(2);
    });

    it('should track startCol correctly for wrapped lines', () => {
      const result = wrapLine('hello world foo', 0, { contentWidth: 8 });
      expect(result[0].startCol).toBe(0);
      expect(result[1].startCol).toBe(6);
    });

    it('should handle empty line', () => {
      const result = wrapLine('', 0, { contentWidth: 20 });
      expect(result.length).toBe(1);
      expect(result[0].text).toBe('');
      expect(result[0].startCol).toBe(0);
    });

    it('should handle wordWrap=false', () => {
      const text = 'hello world foo bar';
      const result = wrapLine(text, 0, { contentWidth: 12, wordWrap: false });
      // Without word wrap, line should not be wrapped (just truncated visually)
      expect(result.length).toBe(1);
      expect(result[0].text).toBe(text);
    });

    it('should handle reserveCursorSpace=false', () => {
      const text = 'a'.repeat(38);
      const result = wrapLine(text, 0, { contentWidth: 38, reserveCursorSpace: false });
      // Without cursor space reservation, 38 chars at width 38 should NOT wrap
      expect(result.length).toBe(1);
    });

    it('should track startVisualCol for CJK characters', () => {
      // 中文中文中文 = 6 chars, 12 columns
      const result = wrapLine('中文中文中文', 0, { contentWidth: 5 });
      // Each CJK char is 2 columns
      // First chunk: 中文 (4 cols)
      // Second chunk: 中文 (4 cols)
      // Third chunk: 中文 (4 cols)
      expect(result.length).toBe(3);
      expect(result[0].startVisualCol).toBe(0);
      expect(result[1].startVisualCol).toBe(4);
      expect(result[2].startVisualCol).toBe(8);
    });

    it('should handle very long word exceeding line width', () => {
      const longWord = 'supercalifragilisticexpialidocious';
      const result = wrapLine(longWord, 0, { contentWidth: 10 });
      // Should break at character boundary
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].text.length).toBeLessThanOrEqual(10);
    });

    it('should preserve logical row across wrapped segments', () => {
      const result = wrapLine('hello world foo bar', 5, { contentWidth: 8 });
      expect(result[0].logicalRow).toBe(5);
      expect(result[1].logicalRow).toBe(5);
      expect(result[2].logicalRow).toBe(5);
    });

    it('should handle trailing spaces', () => {
      const result = wrapLine('hello   ', 0, { contentWidth: 20 });
      expect(result.length).toBe(1);
      expect(result[0].text).toBe('hello   ');
    });
  });

  // ===========================================================================
  // wrapText
  // ===========================================================================
  describe('wrapText', () => {
    it('should wrap multiline text', () => {
      const result = wrapText('hello\nworld', { contentWidth: 20 });
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].logicalRow).toBe(0);
      expect(result.lines[1].logicalRow).toBe(1);
    });

    it('should handle empty text', () => {
      const result = wrapText('', { contentWidth: 20 });
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].text).toBe('');
    });

    it('should provide logicalToVisual mapping', () => {
      const result = wrapText('hello world foo bar\nsecond line', { contentWidth: 12 });
      expect(result.logicalToVisual.get(0)).toBeDefined();
      expect(result.logicalToVisual.get(1)).toBeDefined();
    });

    it('should handle multiple consecutive empty lines', () => {
      const result = wrapText('a\n\n\nb', { contentWidth: 20 });
      expect(result.lines.length).toBe(4);
      expect(result.lines[0].text).toBe('a');
      expect(result.lines[1].text).toBe('');
      expect(result.lines[2].text).toBe('');
      expect(result.lines[3].text).toBe('b');
    });

    it('should handle text starting with newline', () => {
      const result = wrapText('\nhello', { contentWidth: 20 });
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toBe('');
      expect(result.lines[1].text).toBe('hello');
    });

    it('should handle text ending with newline', () => {
      const result = wrapText('hello\n', { contentWidth: 20 });
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toBe('hello');
      expect(result.lines[1].text).toBe('');
    });

    it('should correctly map logical to visual indices', () => {
      const result = wrapText('hello world foo\nbar', { contentWidth: 8 });
      // First logical line wraps to 3 visual lines
      const mapping0 = result.logicalToVisual.get(0);
      expect(mapping0?.start).toBe(0);
      expect(mapping0?.end).toBeGreaterThanOrEqual(1);

      // Second logical line is 1 visual line
      const mapping1 = result.logicalToVisual.get(1);
      expect(mapping1?.start).toBeGreaterThan(0);
    });

    it('should handle emoji in text', () => {
      const result = wrapText('hello 🔥 world', { contentWidth: 20 });
      expect(result.lines.length).toBe(1);
      // Emoji should be counted as width 2
      expect(result.lines[0].text).toBe('hello 🔥 world');
    });

    it('should wrap text with CJK correctly', () => {
      const result = wrapText('中文测试文本', { contentWidth: 5 });
      // Each CJK is 2 cols, so 3 chars = 6 cols, must wrap
      expect(result.lines.length).toBeGreaterThan(1);
    });
  });

  // ===========================================================================
  // findCursorVisualLine
  // ===========================================================================
  describe('findCursorVisualLine', () => {
    it('should find cursor in single line', () => {
      const lines: VisualLine[] = [{ text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 }];
      expect(findCursorVisualLine(lines, 0, 3)).toBe(0);
    });

    it('should find cursor in wrapped lines', () => {
      const lines: VisualLine[] = [
        { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 },
        { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 },
      ];
      expect(findCursorVisualLine(lines, 0, 3)).toBe(0);
      expect(findCursorVisualLine(lines, 0, 8)).toBe(1);
    });

    it('should find cursor at end of line', () => {
      const lines: VisualLine[] = [{ text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 }];
      expect(findCursorVisualLine(lines, 0, 5)).toBe(0);
    });

    it('should find cursor on correct logical row', () => {
      const lines: VisualLine[] = [
        { text: 'first', logicalRow: 0, startCol: 0, startVisualCol: 0 },
        { text: 'second', logicalRow: 1, startCol: 0, startVisualCol: 0 },
      ];
      expect(findCursorVisualLine(lines, 0, 0)).toBe(0);
      expect(findCursorVisualLine(lines, 1, 0)).toBe(1);
    });

    it('should return 0 for non-existent row', () => {
      const lines: VisualLine[] = [{ text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 }];
      expect(findCursorVisualLine(lines, 5, 0)).toBe(0);
    });

    it('should handle cursor at wrap boundary', () => {
      const lines: VisualLine[] = [
        { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 },
        { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 },
      ];
      // Cursor at position 6 should be on second visual line
      expect(findCursorVisualLine(lines, 0, 6)).toBe(1);
    });

    it('should handle empty visual lines', () => {
      const lines: VisualLine[] = [
        { text: '', logicalRow: 0, startCol: 0, startVisualCol: 0 },
        { text: 'hello', logicalRow: 1, startCol: 0, startVisualCol: 0 },
      ];
      expect(findCursorVisualLine(lines, 0, 0)).toBe(0);
    });
  });

  // ===========================================================================
  // isCursorOnLine
  // ===========================================================================
  describe('isCursorOnLine', () => {
    it('should return true when cursor is on line', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 0, 3)).toBe(true);
    });

    it('should return false for wrong logical row', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 1, 3)).toBe(false);
    });

    it('should handle wrap boundary correctly', () => {
      const vl1: VisualLine = { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      const vl2: VisualLine = { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 };

      expect(isCursorOnLine(vl1, vl2, 0, 6)).toBe(false);
      expect(isCursorOnLine(vl2, undefined, 0, 6)).toBe(true);
    });

    it('should allow cursor at end of last visual line', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 0, 5)).toBe(true);
    });

    it('should return false for cursor before startCol', () => {
      const vl: VisualLine = { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 };
      expect(isCursorOnLine(vl, undefined, 0, 3)).toBe(false);
    });

    it('should return false for cursor after line end (non-last)', () => {
      const vl1: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      const vl2: VisualLine = { text: 'world', logicalRow: 0, startCol: 5, startVisualCol: 5 };
      // Cursor at 5 should be on vl2, not vl1
      expect(isCursorOnLine(vl1, vl2, 0, 5)).toBe(false);
    });

    it('should handle empty line', () => {
      const vl: VisualLine = { text: '', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 0, 0)).toBe(true);
    });

    it('should handle cursor in middle of wrapped line', () => {
      const vl1: VisualLine = { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      const vl2: VisualLine = { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 };
      const vl3: VisualLine = { text: '', logicalRow: 1, startCol: 0, startVisualCol: 0 };

      // Cursor in middle of "world"
      expect(isCursorOnLine(vl2, vl3, 0, 8)).toBe(true);
    });
  });

  // ===========================================================================
  // Word wrapping edge cases
  // ===========================================================================
  describe('word wrapping edge cases', () => {
    it('should wrap "I am a boy" correctly at width 10', () => {
      const result = wrapText('I am a boy', { contentWidth: 10 });
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toBe('I am a ');
      expect(result.lines[1].text).toBe('boy');
    });

    it('should handle exact contentWidth text', () => {
      const text = 'abcdefghij';
      const result = wrapText(text, { contentWidth: 10 });
      expect(result.lines.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle single space', () => {
      const result = wrapText(' ', { contentWidth: 10 });
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].text).toBe(' ');
    });

    it('should handle only newlines', () => {
      const result = wrapText('\n\n\n', { contentWidth: 10 });
      expect(result.lines.length).toBe(4);
    });

    it('should handle very narrow width', () => {
      const result = wrapText('hello world', { contentWidth: 2 });
      // Should break into many small chunks
      expect(result.lines.length).toBeGreaterThan(5);
    });

    it('should handle width of 1', () => {
      const result = wrapText('ab', { contentWidth: 1 });
      // Each char on its own line
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toBe('a');
      expect(result.lines[1].text).toBe('b');
    });
  });

  // ===========================================================================
  // Integration: Cursor positioning with wrapping
  // ===========================================================================
  describe('cursor positioning with wrapping', () => {
    it('should position cursor correctly after typing fills line', () => {
      // Simulate typing "hello world" into width 8
      const result = wrapText('hello world', { contentWidth: 8 });

      // Cursor at position 11 (end of text)
      const cursorLine = findCursorVisualLine(result.lines, 0, 11);
      expect(cursorLine).toBeGreaterThan(0); // Should be on wrapped line

      // Verify isCursorOnLine is consistent
      const vl = result.lines[cursorLine];
      const nextVl = result.lines[cursorLine + 1];
      expect(isCursorOnLine(vl, nextVl, 0, 11)).toBe(true);
    });

    it('should position cursor at exact wrap point', () => {
      const result = wrapText('hello world foo', { contentWidth: 8 });

      // Test cursor at position 6 (right after "hello ")
      const cursorLine = findCursorVisualLine(result.lines, 0, 6);
      const vl = result.lines[cursorLine];
      expect(vl.startCol).toBeLessThanOrEqual(6);
    });

    it('should handle cursor movement through multiple wraps', () => {
      const text = 'the quick brown fox jumps over';
      const result = wrapText(text, { contentWidth: 10 });

      // Test cursor at various positions
      for (let i = 0; i <= text.length; i++) {
        const line = findCursorVisualLine(result.lines, 0, i);
        expect(line).toBeGreaterThanOrEqual(0);
        expect(line).toBeLessThan(result.lines.length);
      }
    });

    it('should position cursor in multiline text correctly', () => {
      const result = wrapText('first line\nsecond line', { contentWidth: 20 });

      // Cursor on first line
      expect(findCursorVisualLine(result.lines, 0, 5)).toBe(0);

      // Cursor on second line
      expect(findCursorVisualLine(result.lines, 1, 3)).toBe(1);
    });
  });
});
