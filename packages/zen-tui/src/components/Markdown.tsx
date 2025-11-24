/**
 * Markdown Renderer for TUI
 *
 * Renders Markdown content with terminal-friendly styling.
 * Supports: headers, bold, italic, code, lists, blockquotes, and links.
 */

import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface MarkdownProps {
  /** Markdown content to render (can be reactive) */
  content: string | (() => string);
  /** Width for wrapping (default: 80) */
  width?: number;
  /** Custom colors */
  colors?: {
    header?: string;
    code?: string;
    codeBackground?: string;
    link?: string;
    blockquote?: string;
    listMarker?: string;
  };
}

interface ParsedBlock {
  type: 'header' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'hr';
  level?: number; // For headers (1-6)
  ordered?: boolean; // For lists
  items?: string[]; // For lists
  content?: string;
  language?: string; // For code blocks
}

/** Parse inline markdown (bold, italic, code, links) */
function parseInline(text: string, colors: MarkdownProps['colors']): TUINode[] {
  const elements: TUINode[] = [];
  let remaining = text;

  // Patterns for inline elements
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' as const },
    { regex: /\*(.+?)\*/g, type: 'italic' as const },
    { regex: /`([^`]+)`/g, type: 'code' as const },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' as const },
  ];

  // Process text sequentially
  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; type: string; content: string; url?: string } | null = null;

    // Find earliest inline element
    for (const { regex, type } of patterns) {
      regex.lastIndex = 0;
      const match = regex.exec(remaining);
      if (match && (earliestMatch === null || match.index < earliestMatch.index)) {
        earliestMatch = {
          index: match.index,
          length: match[0].length,
          type,
          content: type === 'link' ? match[1] : match[1],
          url: type === 'link' ? match[2] : undefined,
        };
      }
    }

    if (earliestMatch === null) {
      // No more matches, add remaining as plain text
      if (remaining.length > 0) {
        elements.push(Text({ children: remaining }));
      }
      break;
    }

    // Add text before the match
    if (earliestMatch.index > 0) {
      elements.push(Text({ children: remaining.slice(0, earliestMatch.index) }));
    }

    // Add the matched element
    switch (earliestMatch.type) {
      case 'bold':
        elements.push(Text({ children: earliestMatch.content, bold: true }));
        break;
      case 'italic':
        elements.push(Text({ children: earliestMatch.content, italic: true }));
        break;
      case 'code':
        elements.push(Text({
          children: earliestMatch.content,
          backgroundColor: colors?.codeBackground || 'gray',
          color: colors?.code || 'white',
        }));
        break;
      case 'link':
        elements.push(Text({
          children: `${earliestMatch.content}`,
          color: colors?.link || 'blue',
          underline: true,
        }));
        break;
    }

    remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
  }

  return elements;
}

/** Parse markdown into blocks */
function parseBlocks(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line - skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Header (# ## ### etc)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        content: headerMatch[2],
      });
      i++;
      continue;
    }

    // Horizontal rule (--- or ***)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Code block (```)
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        content: codeLines.join('\n'),
        language,
      });
      i++; // Skip closing ```
      continue;
    }

    // Blockquote (>)
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: false,
        items,
      });
      continue;
    }

    // Ordered list (1. 2. etc)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: true,
        items,
      });
      continue;
    }

    // Paragraph - collect consecutive non-special lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('>') &&
      !lines[i].match(/^[-*]\s+/) &&
      !lines[i].match(/^\d+\.\s+/) &&
      !lines[i].match(/^(-{3,}|\*{3,}|_{3,})$/)
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: paragraphLines.join(' '),
      });
    }
  }

  return blocks;
}

/** Render a single block */
function renderBlock(block: ParsedBlock, colors: MarkdownProps['colors']): TUINode {
  switch (block.type) {
    case 'header': {
      const headerColors: Record<number, string> = {
        1: colors?.header || 'cyan',
        2: colors?.header || 'cyan',
        3: colors?.header || 'blue',
        4: colors?.header || 'blue',
        5: colors?.header || 'magenta',
        6: colors?.header || 'magenta',
      };
      const level = block.level || 1;
      const prefix = level <= 2 ? '' : '  '.repeat(level - 2);

      return Box({
        style: {
          flexDirection: 'row',
          marginTop: level === 1 ? 1 : 0,
          marginBottom: level <= 2 ? 1 : 0,
        },
        children: Text({
          children: prefix + block.content,
          color: headerColors[level],
          bold: level <= 2,
          underline: level === 1,
        }),
      });
    }

    case 'paragraph':
      return Box({
        style: { flexDirection: 'row', marginBottom: 1 },
        children: parseInline(block.content || '', colors),
      });

    case 'code':
      return Box({
        style: {
          flexDirection: 'column',
          backgroundColor: colors?.codeBackground || 'gray',
          padding: 1,
          marginBottom: 1,
        },
        children: [
          // Language label if provided
          block.language ? Text({
            children: block.language,
            dim: true,
          }) : null,
          // Code content
          Text({
            children: block.content,
            color: colors?.code || 'white',
          }),
        ].filter(Boolean),
      });

    case 'blockquote':
      return Box({
        style: {
          flexDirection: 'row',
          paddingLeft: 2,
          marginBottom: 1,
        },
        children: [
          Text({
            children: '│ ',
            color: colors?.blockquote || 'gray',
          }),
          Box({
            style: { flexDirection: 'column' },
            children: parseInline(block.content || '', colors),
          }),
        ],
      });

    case 'list':
      return Box({
        style: { flexDirection: 'column', marginBottom: 1, paddingLeft: 2 },
        children: (block.items || []).map((item, index) => {
          const marker = block.ordered ? `${index + 1}.` : '•';
          return Box({
            style: { flexDirection: 'row' },
            children: [
              Text({
                children: marker + ' ',
                color: colors?.listMarker || 'yellow',
              }),
              ...parseInline(item, colors),
            ],
          });
        }),
      });

    case 'hr':
      return Box({
        style: { marginY: 1 },
        children: Text({
          children: '─'.repeat(40),
          dim: true,
        }),
      });

    default:
      return Text({ children: '' });
  }
}

/**
 * Markdown Component
 *
 * Renders Markdown content with terminal-friendly styling.
 * Supports reactive content via function props.
 *
 * @example
 * ```tsx
 * // Static content
 * <Markdown content="# Hello\n\nThis is **bold** and *italic*." />
 *
 * // Reactive content
 * const md = signal('# Dynamic');
 * <Markdown content={() => md.value} />
 * ```
 */
export function Markdown(props: MarkdownProps): TUINode {
  const { content, colors = {} } = props;

  // If content is a function (reactive), use reactive function pattern
  // The jsx-runtime will wrap this in an effect for automatic re-rendering
  if (typeof content === 'function') {
    return Box({
      style: { flexDirection: 'column' },
      children: () => {
        const resolvedContent = content();
        const blocks = parseBlocks(resolvedContent);
        return blocks.map((block) => renderBlock(block, colors));
      },
    });
  }

  // Static content - render directly
  const blocks = parseBlocks(content);

  return Box({
    style: {
      flexDirection: 'column',
    },
    children: blocks.map((block) => renderBlock(block, colors)),
  });
}
