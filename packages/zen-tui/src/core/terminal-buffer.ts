/**
 * Terminal Screen Buffer
 *
 * Maintains a line-based representation of the terminal screen with ANSI codes preserved.
 */

import stripAnsi from 'strip-ansi';
import { terminalWidth } from '../utils/terminal-width.js';

// Grapheme segmenter for proper Unicode handling (handles emojis, Hindi, Thai, etc.)
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/**
 * Iterate through a string by grapheme clusters
 * This correctly handles complex Unicode like:
 * - Emojis with ZWJ (👨‍👩‍👧)
 * - Flag emojis (🇺🇸)
 * - Skin tone modifiers (👋🏻)
 * - Hindi/Thai combining characters
 * - Keycap emojis (1️⃣)
 */
function* iterateGraphemes(str: string): Generator<string> {
  for (const { segment } of segmenter.segment(str)) {
    yield segment;
  }
}

export class TerminalBuffer {
  private buffer: string[];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.buffer = Array(height).fill('');
  }

  /**
   * Clear the entire buffer
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      this.buffer[y] = '';
    }
  }

  /**
   * Write text at a specific position
   * Returns the bounding box of what was written
   * @param replace If true, don't preserve content after the written text (used for clearing areas)
   */
  writeAt(
    x: number,
    y: number,
    text: string,
    maxWidth?: number,
    replace = false,
  ): { x: number; y: number; width: number; height: number } {
    const lines = text.split('\n');
    let maxLineWidth = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      const targetY = y + lineIndex;

      if (targetY >= this.height) break;

      // Clip line to maxWidth if specified
      if (maxWidth !== undefined) {
        const strippedLine = stripAnsi(line);
        const visualWidth = terminalWidth(strippedLine);

        if (visualWidth > maxWidth) {
          // Truncate to maxWidth, preserving ANSI codes
          // Use grapheme segmenter for proper Unicode handling
          let currentWidth = 0;
          let truncated = '';
          let inAnsiCode = false;
          let ansiCode = '';

          for (const grapheme of iterateGraphemes(line)) {
            if (grapheme === '\x1b') {
              inAnsiCode = true;
              ansiCode = grapheme;
              continue;
            }

            if (inAnsiCode) {
              ansiCode += grapheme;
              if (grapheme === 'm') {
                inAnsiCode = false;
                truncated += ansiCode;
                ansiCode = '';
              }
              continue;
            }

            const graphemeWidth = terminalWidth(grapheme);
            if (currentWidth + graphemeWidth > maxWidth) break;

            truncated += grapheme;
            currentWidth += graphemeWidth;
          }

          line = truncated;
        }
      }

      // Get existing line content (if any)
      const existingLine = this.buffer[targetY] || '';

      // Merge new text at position x with existing content
      // We need to preserve content before x and after x + line width
      const lineWidth = terminalWidth(stripAnsi(line));

      // Build the new line: existing content before x + new text + existing content after
      let newLine = '';

      // Add existing content before position x (or spaces if needed)
      // IMPORTANT: We must walk through existingLine accounting for ANSI codes,
      // as substring() would cut ANSI codes incorrectly
      // Use grapheme segmenter for proper Unicode handling
      if (x > 0) {
        let visualPos = 0;
        let inAnsiCode = false;
        let beforeX = '';

        for (const grapheme of iterateGraphemes(existingLine)) {
          // Track ANSI codes
          if (grapheme === '\x1b') {
            inAnsiCode = true;
            beforeX += grapheme;
            continue;
          }

          if (inAnsiCode) {
            beforeX += grapheme;
            if (grapheme === 'm') {
              inAnsiCode = false;
            }
            continue; // ANSI codes don't contribute to visual width
          }

          // Check if we've reached the target visual position
          if (visualPos >= x) {
            break;
          }

          beforeX += grapheme;
          visualPos += terminalWidth(grapheme);
        }

        newLine += beforeX;

        // Pad with spaces if existing content doesn't reach position x
        if (visualPos < x) {
          newLine += ' '.repeat(x - visualPos);
        }
      }

      // Add new text
      newLine += line;

      // Add existing content after the new text (if any)
      // Need to preserve content that comes after our written text (e.g., right border)
      // Skip this if replace mode is enabled (used for clearing/filling areas)
      // Use grapheme segmenter for proper Unicode handling
      const afterX = x + lineWidth;
      const existingVisualWidth = terminalWidth(stripAnsi(existingLine));

      if (!replace && afterX < existingVisualWidth) {
        // Extract the portion of existingLine that starts at visual position afterX
        // We need to find the actual string index that corresponds to visual position afterX
        let visualPos = 0;
        let stringPos = 0;
        let inAnsiCode = false;
        let lastAnsiStart = -1; // Track start of most recent ANSI sequence

        // Walk through existingLine to find where visual position afterX starts
        for (let i = 0; i < existingLine.length; i++) {
          const char = existingLine[i];

          // Track ANSI codes
          if (char === '\x1b') {
            inAnsiCode = true;
            lastAnsiStart = i; // Remember where this ANSI sequence started
          }

          if (inAnsiCode) {
            if (char === 'm') {
              inAnsiCode = false;
            }
            continue; // ANSI codes don't contribute to visual width
          }

          // Check if we've reached the target visual position
          if (visualPos >= afterX) {
            // Include any preceding ANSI codes that style this character
            stringPos = lastAnsiStart >= 0 ? lastAnsiStart : i;
            break;
          }

          visualPos += terminalWidth(char);
          lastAnsiStart = -1; // Reset after processing a visual character
        }

        // Extract everything from stringPos onwards
        if (stringPos < existingLine.length) {
          newLine += existingLine.substring(stringPos);
        }
      }

      // Store the merged line
      this.buffer[targetY] = newLine;

      // Track max visual width (without ANSI codes)
      const visualWidth = terminalWidth(line);
      maxLineWidth = Math.max(maxLineWidth, visualWidth);
    }

    return {
      x,
      y,
      width: maxLineWidth,
      height: lines.length,
    };
  }

  /**
   * Clear a rectangular region
   */
  clearRegion(_x: number, y: number, _width: number, height: number): void {
    for (let row = y; row < y + height && row < this.height; row++) {
      this.buffer[row] = '';
    }
  }

  /**
   * Get the current content at a position (not really meaningful with ANSI codes, returns full line)
   */
  getAt(_x: number, y: number): string {
    if (y >= 0 && y < this.height) {
      return this.buffer[y];
    }
    return '';
  }

  /**
   * Get a line as a string
   */
  getLine(y: number): string {
    if (y >= 0 && y < this.height) {
      return this.buffer[y];
    }
    return '';
  }

  /**
   * Render the entire buffer to terminal
   */
  renderFull(): string {
    return this.buffer.join('\n');
  }

  /**
   * Get diff between this buffer and another
   * Returns array of changes: { y: number, line: string }
   */
  diff(other: TerminalBuffer): Array<{ y: number; line: string }> {
    const changes: Array<{ y: number; line: string }> = [];

    for (let y = 0; y < Math.min(this.height, other.height); y++) {
      const thisLine = this.getLine(y);
      const otherLine = other.getLine(y);

      if (thisLine !== otherLine) {
        changes.push({ y, line: thisLine });
      }
    }

    return changes;
  }

  /**
   * Clone the buffer
   */
  clone(): TerminalBuffer {
    const cloned = new TerminalBuffer(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      cloned.buffer[y] = this.buffer[y];
    }
    return cloned;
  }

  /**
   * Resize buffer (for terminal resize events)
   */
  resize(newWidth: number, newHeight: number): void {
    const newBuffer = Array(newHeight).fill('');

    // Copy existing content
    for (let y = 0; y < Math.min(this.height, newHeight); y++) {
      newBuffer[y] = this.buffer[y];
    }

    this.buffer = newBuffer;
    this.width = newWidth;
    this.height = newHeight;
  }
}
