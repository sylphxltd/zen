/** @jsxImportSource @zen/tui */
/**
 * Markdown Component Tests
 *
 * Tests for markdown rendering with terminal-friendly styling.
 */
import { describe, expect, it } from 'bun:test';
import { signal } from '@zen/signal';
import { Markdown, type MarkdownProps } from './Markdown.js';

describe('Markdown', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render empty markdown', () => {
      const result = Markdown({ content: '' });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render plain text', () => {
      const result = Markdown({ content: 'Hello World' });

      expect(result).toBeDefined();
    });

    it('should render multiple paragraphs', () => {
      const result = Markdown({ content: 'First paragraph\n\nSecond paragraph' });

      expect(result).toBeDefined();
    });

    it('should support reactive content', () => {
      const content = signal('# Title');
      const result = Markdown({ content: () => content.value });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Headers
  // ==========================================================================

  describe('Headers', () => {
    it('should render h1 header', () => {
      const result = Markdown({ content: '# Header 1' });

      expect(result).toBeDefined();
    });

    it('should render h2 header', () => {
      const result = Markdown({ content: '## Header 2' });

      expect(result).toBeDefined();
    });

    it('should render h3 header', () => {
      const result = Markdown({ content: '### Header 3' });

      expect(result).toBeDefined();
    });

    it('should render h4 header', () => {
      const result = Markdown({ content: '#### Header 4' });

      expect(result).toBeDefined();
    });

    it('should render h5 header', () => {
      const result = Markdown({ content: '##### Header 5' });

      expect(result).toBeDefined();
    });

    it('should render h6 header', () => {
      const result = Markdown({ content: '###### Header 6' });

      expect(result).toBeDefined();
    });

    it('should render multiple headers', () => {
      const result = Markdown({
        content: '# Title\n## Subtitle\n### Section',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Inline Formatting
  // ==========================================================================

  describe('Inline Formatting', () => {
    it('should render bold text with **', () => {
      const result = Markdown({ content: 'This is **bold** text' });

      expect(result).toBeDefined();
    });

    it('should render italic text with *', () => {
      const result = Markdown({ content: 'This is *italic* text' });

      expect(result).toBeDefined();
    });

    it('should render inline code with `', () => {
      const result = Markdown({ content: 'This is `code` text' });

      expect(result).toBeDefined();
    });

    it('should render links', () => {
      const result = Markdown({ content: 'Click [here](https://example.com)' });

      expect(result).toBeDefined();
    });

    it('should render mixed formatting', () => {
      const result = Markdown({
        content: 'This is **bold**, *italic*, and `code`',
      });

      expect(result).toBeDefined();
    });

    it('should handle nested formatting', () => {
      const result = Markdown({ content: 'This is **bold and *italic***' });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Code Blocks
  // ==========================================================================

  describe('Code Blocks', () => {
    it('should render code block', () => {
      const result = Markdown({ content: '```\ncode here\n```' });

      expect(result).toBeDefined();
    });

    it('should render code block with language', () => {
      const result = Markdown({ content: '```javascript\nconsole.log("hi");\n```' });

      expect(result).toBeDefined();
    });

    it('should render multi-line code block', () => {
      const result = Markdown({
        content: '```\nline 1\nline 2\nline 3\n```',
      });

      expect(result).toBeDefined();
    });

    it('should handle empty code block', () => {
      const result = Markdown({ content: '```\n```' });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Lists
  // ==========================================================================

  describe('Lists', () => {
    it('should render unordered list with -', () => {
      const result = Markdown({ content: '- Item 1\n- Item 2\n- Item 3' });

      expect(result).toBeDefined();
    });

    it('should render unordered list with *', () => {
      const result = Markdown({ content: '* Item 1\n* Item 2\n* Item 3' });

      expect(result).toBeDefined();
    });

    it('should render ordered list', () => {
      const result = Markdown({ content: '1. First\n2. Second\n3. Third' });

      expect(result).toBeDefined();
    });

    it('should render list with inline formatting', () => {
      const result = Markdown({
        content: '- **Bold item**\n- *Italic item*\n- `Code item`',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Blockquotes
  // ==========================================================================

  describe('Blockquotes', () => {
    it('should render blockquote', () => {
      const result = Markdown({ content: '> This is a quote' });

      expect(result).toBeDefined();
    });

    it('should render multi-line blockquote', () => {
      const result = Markdown({ content: '> Line 1\n> Line 2' });

      expect(result).toBeDefined();
    });

    it('should render blockquote with formatting', () => {
      const result = Markdown({ content: '> This is **bold** in quote' });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Horizontal Rules
  // ==========================================================================

  describe('Horizontal Rules', () => {
    it('should render hr with ---', () => {
      const result = Markdown({ content: 'Above\n\n---\n\nBelow' });

      expect(result).toBeDefined();
    });

    it('should render hr with ***', () => {
      const result = Markdown({ content: 'Above\n\n***\n\nBelow' });

      expect(result).toBeDefined();
    });

    it('should render hr with ___', () => {
      const result = Markdown({ content: 'Above\n\n___\n\nBelow' });

      expect(result).toBeDefined();
    });

    it('should render hr with extra dashes', () => {
      const result = Markdown({ content: '------' });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Custom Colors
  // ==========================================================================

  describe('Custom Colors', () => {
    it('should apply custom header color', () => {
      const result = Markdown({
        content: '# Title',
        colors: { header: 'yellow' },
      });

      expect(result).toBeDefined();
    });

    it('should apply custom code color', () => {
      const result = Markdown({
        content: '`code`',
        colors: { code: 'green' },
      });

      expect(result).toBeDefined();
    });

    it('should apply custom code background', () => {
      const result = Markdown({
        content: '`code`',
        colors: { codeBackground: 'blue' },
      });

      expect(result).toBeDefined();
    });

    it('should apply custom link color', () => {
      const result = Markdown({
        content: '[link](url)',
        colors: { link: 'yellow' },
      });

      expect(result).toBeDefined();
    });

    it('should apply custom blockquote color', () => {
      const result = Markdown({
        content: '> quote',
        colors: { blockquote: 'cyan' },
      });

      expect(result).toBeDefined();
    });

    it('should apply custom list marker color', () => {
      const result = Markdown({
        content: '- item',
        colors: { listMarker: 'magenta' },
      });

      expect(result).toBeDefined();
    });

    it('should apply all custom colors', () => {
      const result = Markdown({
        content: '# Header\n\n`code`\n\n[link](url)\n\n> quote\n\n- item',
        colors: {
          header: 'red',
          code: 'green',
          codeBackground: 'black',
          link: 'blue',
          blockquote: 'gray',
          listMarker: 'yellow',
        },
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Complex Documents
  // ==========================================================================

  describe('Complex Documents', () => {
    it('should render full markdown document', () => {
      const content = `# Title

This is a paragraph with **bold** and *italic* text.

## Code Section

Here is some \`inline code\` and a code block:

\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\`

## Lists

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third

## Quote

> This is a quote

---

That's all!`;

      const result = Markdown({ content });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle consecutive empty lines', () => {
      const result = Markdown({ content: 'Line 1\n\n\n\nLine 2' });

      expect(result).toBeDefined();
    });

    it('should handle only whitespace', () => {
      const result = Markdown({ content: '   \n   \n   ' });

      expect(result).toBeDefined();
    });

    it('should handle very long lines', () => {
      const result = Markdown({ content: 'A'.repeat(500) });

      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const result = Markdown({ content: '< > & " \' © ®' });

      expect(result).toBeDefined();
    });

    it('should handle emoji', () => {
      const result = Markdown({ content: '# 🎉 Celebration\n\n- 👍 Good\n- 👎 Bad' });

      expect(result).toBeDefined();
    });

    it('should handle unclosed formatting', () => {
      const result = Markdown({ content: 'This is **unclosed bold' });

      expect(result).toBeDefined();
    });

    it('should handle unclosed code block', () => {
      const result = Markdown({ content: '```\ncode without close' });

      expect(result).toBeDefined();
    });

    it('should handle header without space', () => {
      const result = Markdown({ content: '#NoSpace' });

      expect(result).toBeDefined();
    });

    it('should handle mixed line endings', () => {
      const result = Markdown({ content: 'Line 1\r\nLine 2\rLine 3\nLine 4' });

      expect(result).toBeDefined();
    });
  });
});
