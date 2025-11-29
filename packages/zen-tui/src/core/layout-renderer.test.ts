/**
 * Layout Renderer Integration Tests
 *
 * Tests that verify the actual rendered output to catch visual bugs like:
 * - Text appearing outside container bounds
 * - Clipping not working correctly
 * - Incorrect position calculations
 */
import { describe, expect, it } from 'bun:test';
import stripAnsi from 'strip-ansi';
import { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode } from './types.js';
import { computeLayout } from './yoga-layout.js';
import { renderToBuffer } from './layout-renderer.js';

// Helper to create TUI nodes
const createBox = (
  style: TUINode['style'] = {},
  children: TUINode['children'] = [],
): TUINode => ({
  type: 'box',
  tagName: 'box',
  props: {},
  style,
  children,
});

const createText = (text: string, style: TUINode['style'] = {}): TUINode => ({
  type: 'text',
  tagName: 'text',
  props: {},
  style,
  children: [text],
});

// Helper to get buffer content as array of stripped lines
const getBufferLines = (buffer: TerminalBuffer, height: number): string[] => {
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    lines.push(stripAnsi(buffer.getLine(y)));
  }
  return lines;
};

describe('Layout Renderer', () => {
  // ==========================================================================
  // Basic Text Positioning
  // ==========================================================================

  describe('Basic Text Positioning', () => {
    it('should render text at correct position', async () => {
      const root = createBox(
        { width: 20, height: 5, flexDirection: 'column' },
        [createText('Hello')],
      );

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(root, 20, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      expect(lines[0]).toContain('Hello');
    });

    it('should render multiple text nodes in column', async () => {
      const root = createBox(
        { width: 20, height: 5, flexDirection: 'column' },
        [createText('Line 1'), createText('Line 2'), createText('Line 3')],
      );

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(root, 20, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      expect(lines[0]).toContain('Line 1');
      expect(lines[1]).toContain('Line 2');
      expect(lines[2]).toContain('Line 3');
    });

    it('should render text in row layout', async () => {
      const root = createBox({ width: 30, height: 1, flexDirection: 'row' }, [
        createText('A'),
        createText('B'),
        createText('C'),
      ]);

      const buffer = new TerminalBuffer(30, 1);
      const layoutMap = await computeLayout(root, 30, 1);
      renderToBuffer(root, buffer, layoutMap);

      const line = stripAnsi(buffer.getLine(0));
      expect(line).toContain('A');
      expect(line).toContain('B');
      expect(line).toContain('C');
    });
  });

  // ==========================================================================
  // Border Rendering
  // ==========================================================================

  describe('Border Rendering', () => {
    it('should render box with border', async () => {
      const root = createBox(
        { width: 10, height: 5, borderStyle: 'single' },
        [createText('Hi')],
      );

      const buffer = new TerminalBuffer(10, 5);
      const layoutMap = await computeLayout(root, 10, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      // Top border should have corners
      expect(lines[0]).toContain('┌');
      expect(lines[0]).toContain('┐');
      // Bottom border
      expect(lines[4]).toContain('└');
      expect(lines[4]).toContain('┘');
      // Content inside
      expect(lines[1]).toContain('Hi');
    });

    it('should render nested boxes with borders', async () => {
      const inner = createBox(
        { width: 8, height: 3, borderStyle: 'single' },
        [createText('In')],
      );
      const outer = createBox(
        { width: 12, height: 5, borderStyle: 'single' },
        [inner],
      );

      const buffer = new TerminalBuffer(12, 5);
      const layoutMap = await computeLayout(outer, 12, 5);
      renderToBuffer(outer, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      // Outer border
      expect(lines[0]).toContain('┌');
      // Inner content visible
      expect(lines.some((l) => l.includes('In'))).toBe(true);
    });
  });

  // ==========================================================================
  // Clipping / Overflow
  // ==========================================================================

  describe('Clipping / Overflow', () => {
    it('should clip text that exceeds container width', async () => {
      const root = createBox(
        { width: 10, height: 3, borderStyle: 'single', overflow: 'hidden' },
        [createText('This is a very long text that should be clipped')],
      );

      const buffer = new TerminalBuffer(10, 3);
      const layoutMap = await computeLayout(root, 10, 3);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 3);
      // Text should be clipped to fit within border (8 chars width inside border)
      const contentLine = lines[1];
      // Should not extend past the right border
      expect(contentLine.length).toBeLessThanOrEqual(10);
    });

    it('should clip content in scrollbox vertically', async () => {
      const content = createBox({ flexDirection: 'column' }, [
        createText('Line 1'),
        createText('Line 2'),
        createText('Line 3'),
        createText('Line 4'),
        createText('Line 5'),
      ]);

      const root: TUINode = {
        type: 'box',
        tagName: 'scrollbox',
        props: { scrollOffset: { value: 0 } },
        style: { width: 20, height: 3, borderStyle: 'single' },
        children: [content],
      };

      const buffer = new TerminalBuffer(20, 3);
      const layoutMap = await computeLayout(root, 20, 3);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 3);
      // Only first line of content should be visible (border takes 2 rows)
      const visibleContent = lines[1];
      expect(visibleContent).toContain('Line 1');
      // Line 4, 5 should NOT be visible
      expect(lines.join('')).not.toContain('Line 4');
      expect(lines.join('')).not.toContain('Line 5');
    });

    it('should not render text outside parent bounds', async () => {
      // Create a parent box with limited height
      const parent = createBox(
        { width: 20, height: 3, flexDirection: 'column', overflow: 'hidden' },
        [
          createText('Row 1'),
          createText('Row 2'),
          createText('Row 3'),
          createText('Row 4'), // Should be clipped
          createText('Row 5'), // Should be clipped
        ],
      );

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(parent, 20, 5);
      renderToBuffer(parent, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      const allContent = lines.join('\n');

      // Row 1-3 should be visible
      expect(allContent).toContain('Row 1');
      expect(allContent).toContain('Row 2');
      expect(allContent).toContain('Row 3');
      // Row 4-5 should be clipped (parent height is 3)
      expect(allContent).not.toContain('Row 4');
      expect(allContent).not.toContain('Row 5');
    });
  });

  // ==========================================================================
  // Flex Layout
  // ==========================================================================

  describe('Flex Layout', () => {
    it('should render side-by-side boxes correctly', async () => {
      const left = createBox(
        { flex: 1, borderStyle: 'single' },
        [createText('Left')],
      );
      const right = createBox(
        { flex: 1, borderStyle: 'single' },
        [createText('Right')],
      );
      const root = createBox(
        { width: 30, height: 5, flexDirection: 'row' },
        [left, right],
      );

      const buffer = new TerminalBuffer(30, 5);
      const layoutMap = await computeLayout(root, 30, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      const allContent = lines.join('\n');

      // Both boxes should be visible
      expect(allContent).toContain('Left');
      expect(allContent).toContain('Right');

      // Left content should appear before right content in each line
      const contentLine = lines[1]; // First line inside borders
      const leftPos = contentLine.indexOf('Left');
      const rightPos = contentLine.indexOf('Right');
      if (leftPos >= 0 && rightPos >= 0) {
        expect(leftPos).toBeLessThan(rightPos);
      }
    });

    it('should not leak content between adjacent boxes', async () => {
      const left = createBox(
        { flex: 1, borderStyle: 'single', overflow: 'hidden' },
        [createText('AAAAAAAAAAAAAAAA')], // Long text
      );
      const right = createBox(
        { flex: 1, borderStyle: 'single' },
        [createText('BB')],
      );
      const root = createBox(
        { width: 20, height: 5, flexDirection: 'row' },
        [left, right],
      );

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(root, 20, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);

      // Right box should still show its content
      expect(lines.some((l) => l.includes('BB'))).toBe(true);

      // Left's long text should not overwrite right box's border
      // Check that right border exists
      expect(lines[0].lastIndexOf('┐')).toBeGreaterThan(10);
    });
  });

  // ==========================================================================
  // Position: Absolute
  // ==========================================================================

  describe('Position Absolute', () => {
    it('should render absolute positioned element at correct location', async () => {
      const absoluteBox = createBox(
        {
          position: 'absolute',
          left: 5,
          top: 2,
          width: 10,
          height: 1,
        },
        [createText('Floating')],
      );
      const root = createBox({ width: 30, height: 10 }, [absoluteBox]);

      const buffer = new TerminalBuffer(30, 10);
      const layoutMap = await computeLayout(root, 30, 10);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 10);

      // Text should appear at row 2 (0-indexed)
      expect(lines[2]).toContain('Floating');
      // Should not appear at row 0 or 1
      expect(lines[0]).not.toContain('Floating');
      expect(lines[1]).not.toContain('Floating');
    });

    it('should render absolute elements with correct zIndex order', async () => {
      const back = createBox(
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 10,
          height: 1,
          zIndex: 1,
        },
        [createText('BACK')],
      );
      const front = createBox(
        {
          position: 'absolute',
          left: 2,
          top: 0,
          width: 10,
          height: 1,
          zIndex: 10,
        },
        [createText('FRONT')],
      );
      const root = createBox({ width: 20, height: 5 }, [back, front]);

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(root, 20, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);

      // Front should be visible (higher zIndex), overlapping back
      expect(lines[0]).toContain('FRONT');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty box', async () => {
      const root = createBox({ width: 10, height: 5 }, []);

      const buffer = new TerminalBuffer(10, 5);
      const layoutMap = await computeLayout(root, 10, 5);

      // Should not throw
      expect(() => renderToBuffer(root, buffer, layoutMap)).not.toThrow();
    });

    it('should handle zero-dimension box', async () => {
      const root = createBox({ width: 0, height: 0 }, [createText('Hi')]);

      const buffer = new TerminalBuffer(10, 5);
      const layoutMap = await computeLayout(root, 10, 5);

      expect(() => renderToBuffer(root, buffer, layoutMap)).not.toThrow();
    });

    it('should handle deeply nested boxes', async () => {
      let inner: TUINode = createText('Deep');
      for (let i = 0; i < 10; i++) {
        inner = createBox({ flexDirection: 'column' }, [inner]);
      }
      const root = createBox({ width: 20, height: 15 }, [inner]);

      const buffer = new TerminalBuffer(20, 15);
      const layoutMap = await computeLayout(root, 20, 15);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 15);
      expect(lines.some((l) => l.includes('Deep'))).toBe(true);
    });

    it('should handle wide characters (CJK)', async () => {
      const root = createBox(
        { width: 20, height: 3, borderStyle: 'single' },
        [createText('中文测试')],
      );

      const buffer = new TerminalBuffer(20, 3);
      const layoutMap = await computeLayout(root, 20, 3);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 3);
      expect(lines[1]).toContain('中文测试');
    });

    it('should handle emoji', async () => {
      const root = createBox({ width: 20, height: 3 }, [createText('👋 Hello')]);

      const buffer = new TerminalBuffer(20, 3);
      const layoutMap = await computeLayout(root, 20, 3);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 3);
      expect(lines[0]).toContain('👋');
      expect(lines[0]).toContain('Hello');
    });

    it('should clear buffer before rendering', async () => {
      const buffer = new TerminalBuffer(20, 5);

      // First render
      const root1 = createBox({ width: 20, height: 5 }, [
        createText('First render'),
      ]);
      const layoutMap1 = await computeLayout(root1, 20, 5);
      renderToBuffer(root1, buffer, layoutMap1);

      // Second render with different content
      const root2 = createBox({ width: 20, height: 5 }, [
        createText('Second'),
      ]);
      const layoutMap2 = await computeLayout(root2, 20, 5);
      renderToBuffer(root2, buffer, layoutMap2);

      const lines = getBufferLines(buffer, 5);
      const allContent = lines.join('');

      // First content should be gone
      expect(allContent).not.toContain('First');
      // Second content should be visible
      expect(allContent).toContain('Second');
    });
  });

  // ==========================================================================
  // Regression Tests
  // ==========================================================================

  describe('Margin Support', () => {
    it('should apply marginTop correctly', async () => {
      const root = createBox(
        { width: 20, height: 5, flexDirection: 'column' },
        [
          createText('First'),
          createBox({ marginTop: 2 }, [createText('Second')]),
        ],
      );

      const buffer = new TerminalBuffer(20, 5);
      const layoutMap = await computeLayout(root, 20, 5);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 5);
      // First line should have "First"
      expect(lines[0]).toContain('First');
      // Second line should be empty (marginTop: 2)
      expect(lines[1].trim()).toBe('');
      // Third line (index 2) should have space from marginTop
      expect(lines[2].trim()).toBe('');
      // "Second" should appear after the margin
      expect(lines[3]).toContain('Second');
    });

    it('should apply marginLeft correctly', async () => {
      const root = createBox(
        { width: 20, height: 1, flexDirection: 'row' },
        [createBox({ marginLeft: 5 }, [createText('Hi')])],
      );

      const buffer = new TerminalBuffer(20, 1);
      const layoutMap = await computeLayout(root, 20, 1);
      renderToBuffer(root, buffer, layoutMap);

      const line = stripAnsi(buffer.getLine(0));
      const hiPos = line.indexOf('Hi');
      // Hi should be at position 5 or later due to marginLeft
      expect(hiPos).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Regression Tests', () => {
    it('should not render text outside bordered container (visual bug)', async () => {
      // This tests the bug shown in the screenshot where "sa" and "df s"
      // appeared outside the bordered boxes

      const leftBox = createBox(
        {
          flex: 1,
          borderStyle: 'single',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        [
          createText('List:'),
          createText('Apple'),
          createText('Banana'),
          createText('Cherry'),
        ],
      );

      const rightBox = createBox(
        {
          flex: 1,
          borderStyle: 'single',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        [
          createText('TextArea:'),
          createText('中文测试 dfklaj dlksafdj'),
          createText('klasdf'),
          createText('asdf'),
        ],
      );

      const root = createBox(
        { width: 60, height: 10, flexDirection: 'row' },
        [leftBox, rightBox],
      );

      const buffer = new TerminalBuffer(60, 10);
      const layoutMap = await computeLayout(root, 60, 10);
      renderToBuffer(root, buffer, layoutMap);

      const lines = getBufferLines(buffer, 10);

      // Content should be inside bordered boxes only
      // Check that each line either:
      // 1. Is empty
      // 2. Contains border characters
      // 3. Contains content between borders

      for (let y = 0; y < 10; y++) {
        const line = lines[y];
        if (line.trim() === '') continue;

        // If line has content, it should be properly contained
        // Look for stray content after the rightmost border
        const lastBorderPos = Math.max(
          line.lastIndexOf('│'),
          line.lastIndexOf('┐'),
          line.lastIndexOf('┘'),
        );

        if (lastBorderPos >= 0) {
          const afterBorder = line.substring(lastBorderPos + 1).trim();
          // After the last border, there should be no visible content
          expect(afterBorder).toBe('');
        }
      }
    });
  });
});
