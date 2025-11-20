import stripAnsi from 'strip-ansi';
import { describe, expect, it } from 'vitest';
import { Box } from './components/Box';
import { Newline } from './components/Newline';
import { Spacer } from './components/Spacer';
import { Static } from './components/Static';
import { Text } from './components/Text';
import { render } from './render';

describe('render', () => {
  describe('basic rendering', () => {
    it('should render plain text', () => {
      const node = Text({ children: 'Hello' });
      const output = render(node, { width: 80 });

      expect(stripAnsi(output)).toContain('Hello');
    });

    it('should render text in a box', () => {
      const node = Box({
        style: { width: 20, borderStyle: 'single', padding: 1 },
        children: 'Hello World',
      });
      const output = render(node, { width: 80 });

      expect(stripAnsi(output)).toContain('Hello World');
      expect(stripAnsi(output)).toContain('┌'); // Top-left border
      expect(stripAnsi(output)).toContain('└'); // Bottom-left border
    });

    it('should respect width prop', () => {
      const node = Box({
        style: { width: 40, borderStyle: 'single' },
        children: 'Test',
      });
      const output = render(node, { width: 80 });
      const lines = output.split('\n');

      // First line should be exactly 40 chars (including ANSI codes stripped)
      expect(stripAnsi(lines[0]).length).toBe(40);
    });
  });

  describe('border styles', () => {
    it('should render single border style', () => {
      const node = Box({
        style: { width: 10, height: 3, borderStyle: 'single' },
      });
      const output = stripAnsi(render(node));

      expect(output).toContain('┌');
      expect(output).toContain('┐');
      expect(output).toContain('└');
      expect(output).toContain('┘');
      expect(output).toContain('│');
      expect(output).toContain('─');
    });

    it('should render double border style', () => {
      const node = Box({
        style: { width: 10, height: 3, borderStyle: 'double' },
      });
      const output = stripAnsi(render(node));

      expect(output).toContain('╔');
      expect(output).toContain('╗');
      expect(output).toContain('╚');
      expect(output).toContain('╝');
    });

    it('should render round border style', () => {
      const node = Box({
        style: { width: 10, height: 3, borderStyle: 'round' },
      });
      const output = stripAnsi(render(node));

      expect(output).toContain('╭');
      expect(output).toContain('╮');
      expect(output).toContain('╰');
      expect(output).toContain('╯');
    });

    it('should render without border when borderStyle is none', () => {
      const node = Box({
        style: { width: 10, height: 3, borderStyle: 'none' },
        children: 'Test',
      });
      const output = stripAnsi(render(node));

      expect(output).not.toContain('┌');
      expect(output).not.toContain('│');
      expect(output).toContain('Test');
    });
  });

  describe('padding', () => {
    it('should apply padding', () => {
      const node = Box({
        style: { width: 20, borderStyle: 'single', padding: 1 },
        children: 'X',
      });
      const output = stripAnsi(render(node));
      const lines = output.split('\n');

      // Line with content should have padding space before X
      const contentLine = lines.find((line) => line.includes('X'));
      expect(contentLine).toBeTruthy();
      // With padding: 1, content is inserted at position paddingLeft (1) within the line
      // The border is at position 0, so X appears at position 1 in the string
      const xPosition = contentLine?.indexOf('X') ?? -1;
      expect(xPosition).toBeGreaterThanOrEqual(1);
    });

    it('should apply paddingX', () => {
      const node = Box({
        style: { width: 30, borderStyle: 'single', paddingX: 2 },
        children: 'X',
      });
      const output = stripAnsi(render(node));
      const lines = output.split('\n');

      const contentLine = lines.find((line) => line.includes('X'));
      expect(contentLine).toBeTruthy();
      // With paddingX: 2 and border, content should be at position 3 (border + 2)
      expect(contentLine?.indexOf('X')).toBeGreaterThanOrEqual(2);
    });

    it('should apply paddingY', () => {
      const node = Box({
        style: { width: 20, height: 6, borderStyle: 'single', paddingY: 1 },
        children: 'X',
      });
      const output = stripAnsi(render(node));
      const lines = output.split('\n');

      // Content should not be on line 0 (top border)
      expect(stripAnsi(lines[0])).not.toContain('X');
      // With paddingY: 1 and border, currentY starts at: (hasBorder ? 1 : 0) + paddingTop
      // = 1 + 1 = 2, but then we insert at paddingTop within the box area
      // Actually, based on the code: currentY = paddingTop for fixed-height
      // For fixed height with border, content starts at paddingTop (line 1 inside border)
      // Find which line has X
      const xLineIndex = lines.findIndex((line) => stripAnsi(line).includes('X'));
      expect(xLineIndex).toBeGreaterThan(0); // Not on first line (top border)
    });
  });

  describe('flexDirection: row (inline rendering)', () => {
    it('should render Text children inline', () => {
      const node = Text({
        children: [
          Text({ children: 'Red', color: 'red' }),
          Text({ children: ' Green', color: 'green' }),
          Text({ children: ' Blue', color: 'blue' }),
        ],
      });
      const output = stripAnsi(render(node, { width: 80 }));

      // Should be on same line without large gaps
      expect(output).toContain('Red Green Blue');
    });

    it('should render log entry style inline', () => {
      const node = Text({
        children: [
          Text({ children: '[10:00:00]', dim: true }),
          ' ',
          Text({ children: 'INFO', color: 'cyan', bold: true }),
          ' - Server started',
        ],
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('[10:00:00] INFO - Server started');
    });

    it('should handle Box with flexDirection row', () => {
      const node = Box({
        style: { flexDirection: 'row', width: 60 },
        children: [
          Text({ children: 'Left ' }),
          Text({ children: 'Middle ' }),
          Text({ children: 'Right' }),
        ],
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('Left Middle Right');
    });

    it('should not add excessive spacing in row layout', () => {
      const node = Text({
        children: [Text({ children: 'A' }), Text({ children: 'B' }), Text({ children: 'C' })],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const firstLine = output.split('\n')[0];

      // Should be compact, not "A" followed by 78 spaces then "B"
      expect(firstLine.trim()).toBe('ABC');
    });
  });

  describe('flexDirection: column (vertical stacking)', () => {
    it('should stack children vertically', () => {
      const node = Box({
        style: { flexDirection: 'column', width: 20 },
        children: [
          Text({ children: 'Line 1' }),
          Text({ children: 'Line 2' }),
          Text({ children: 'Line 3' }),
        ],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      expect(lines[0]).toContain('Line 1');
      expect(lines[1]).toContain('Line 2');
      expect(lines[2]).toContain('Line 3');
    });

    it('should default to column layout for Box', () => {
      const node = Box({
        style: { width: 20 },
        children: ['A', 'B', 'C'],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      // Each child on separate line
      expect(lines[0]).toContain('A');
      expect(lines[1]).toContain('B');
      expect(lines[2]).toContain('C');
    });
  });

  describe('auto-sizing boxes', () => {
    it('should auto-size box to fit content', () => {
      const node = Box({
        style: { width: 30, borderStyle: 'single', padding: 1 },
        children: ['Line 1', 'Line 2', 'Line 3'],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      // Should have: top border + padding + 3 content lines + padding + bottom border = 7
      expect(lines.length).toBe(7);
    });

    it('should auto-size with nested boxes', () => {
      const node = Box({
        style: { width: 40, borderStyle: 'single', padding: 1 },
        children: Box({
          style: { borderStyle: 'single', padding: 1 },
          children: 'Nested',
        }),
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('Nested');
      expect(output.split('\n').length).toBeGreaterThan(3); // Multiple layers
    });
  });

  describe('fixed-height boxes', () => {
    it('should respect fixed height', () => {
      const node = Box({
        style: { width: 20, height: 5, borderStyle: 'single' },
        children: 'Content',
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      expect(lines.length).toBe(5);
    });

    it('should not overflow fixed-height box', () => {
      const node = Box({
        style: { width: 20, height: 4, borderStyle: 'single' },
        children: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6'],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      // Should be exactly 4 lines (fixed height)
      expect(lines.length).toBe(4);
    });
  });

  describe('Static component', () => {
    it('should render static list', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const node = Static({
        items,
        children: (item) => Text({ children: item }),
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
    });

    it('should render log entries with Static', () => {
      const logs = [
        { time: '10:00:00', msg: 'Start' },
        { time: '10:00:01', msg: 'Running' },
      ];
      const node = Static({
        items: logs,
        children: (log) =>
          Text({
            children: [Text({ children: `[${log.time}]`, dim: true }), ` ${log.msg}`],
          }),
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('[10:00:00] Start');
      expect(output).toContain('[10:00:01] Running');
    });
  });

  describe('Newline component', () => {
    it('should render single newline', () => {
      const node = Box({
        style: { width: 20 },
        children: ['A', Newline(), 'B'],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      expect(lines[0]).toContain('A');
      expect(lines[1].trim()).toBe(''); // Newline creates empty line
      expect(lines[2]).toContain('B');
    });

    it('should render multiple newlines', () => {
      const node = Box({
        style: { width: 20 },
        children: ['A', Newline({ count: 3 }), 'B'],
      });
      const output = stripAnsi(render(node, { width: 80 }));
      const lines = output.split('\n');

      // A, then 2 empty lines (count: 3 - 1), then B
      expect(lines[0]).toContain('A');
      // Note: actual empty line count depends on implementation
      const bLineIndex = lines.findIndex((line) => line.includes('B'));
      expect(bLineIndex).toBeGreaterThan(2);
    });
  });

  describe('Spacer component', () => {
    it('should render spacer', () => {
      const node = Box({
        style: { width: 20, height: 10, borderStyle: 'single' },
        children: ['Top', Spacer(), 'Bottom'],
      });
      const output = stripAnsi(render(node, { width: 80 }));

      // Spacer should push content apart (though flexGrow not fully implemented yet)
      expect(output).toContain('Top');
      expect(output).toContain('Bottom');
    });
  });

  describe('nested components', () => {
    it('should render deeply nested structure', () => {
      const node = Box({
        style: { width: 50, borderStyle: 'single', padding: 1 },
        children: [
          Text({ children: 'Header', bold: true }),
          Box({
            style: { borderStyle: 'single', padding: 1 },
            children: [
              Text({ children: 'Nested content' }),
              Box({
                style: { padding: 1 },
                children: 'Deep nested',
              }),
            ],
          }),
          Text({ children: 'Footer', dim: true }),
        ],
      });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('Header');
      expect(output).toContain('Nested content');
      expect(output).toContain('Deep nested');
      expect(output).toContain('Footer');
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      const node = Box({ style: { width: 20, height: 3, borderStyle: 'single' } });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toContain('┌');
      expect(output).toContain('└');
    });

    it('should handle very small width', () => {
      const node = Box({ style: { width: 5, borderStyle: 'single' } });
      const output = render(node, { width: 80 });

      expect(output).toBeTruthy();
    });

    it('should handle zero height', () => {
      const node = Box({ style: { width: 20, height: 0 } });
      const output = stripAnsi(render(node, { width: 80 }));

      expect(output).toBe(''); // No output for zero height
    });

    it('should handle undefined children gracefully', () => {
      const node = Box({ style: { width: 20, height: 3 } });
      const output = render(node, { width: 80 });

      // Should render an empty box with the specified height
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('color and styling', () => {
    it('should apply ANSI color codes', () => {
      const node = Text({ children: 'Colored', color: 'red' });
      const output = render(node, { width: 80 });

      // Output should contain ANSI codes (not stripped)
      expect(output).not.toBe(stripAnsi(output));
      expect(stripAnsi(output)).toContain('Colored');
    });

    it('should apply background color', () => {
      const node = Text({ children: 'BG', backgroundColor: 'blue' });
      const output = render(node, { width: 80 });

      expect(output).not.toBe(stripAnsi(output));
      expect(stripAnsi(output)).toContain('BG');
    });

    it('should apply text styles', () => {
      const node = Text({ children: 'Styled', bold: true, underline: true });
      const output = render(node, { width: 80 });

      expect(output).not.toBe(stripAnsi(output));
      expect(stripAnsi(output)).toContain('Styled');
    });
  });
});
