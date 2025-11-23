/**
 * Terminal Screen Buffer
 *
 * Maintains a line-based representation of the terminal screen with ANSI codes preserved.
 */

import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

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
   */
  writeAt(
    x: number,
    y: number,
    text: string,
    maxWidth?: number,
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
        const visualWidth = stringWidth(strippedLine);

        if (visualWidth > maxWidth) {
          // Truncate to maxWidth, preserving ANSI codes
          let currentWidth = 0;
          let truncated = '';
          let inAnsiCode = false;
          let ansiCode = '';

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '\x1b') {
              inAnsiCode = true;
              ansiCode = char;
              continue;
            }

            if (inAnsiCode) {
              ansiCode += char;
              if (char === 'm') {
                inAnsiCode = false;
                truncated += ansiCode;
                ansiCode = '';
              }
              continue;
            }

            const charWidth = stringWidth(char);
            if (currentWidth + charWidth > maxWidth) break;

            truncated += char;
            currentWidth += charWidth;
          }

          line = truncated;
        }
      }

      // Get existing line content (if any)
      const existingLine = this.buffer[targetY] || '';

      // Merge new text at position x with existing content
      // We need to preserve content before x and after x + line width
      const lineWidth = stringWidth(stripAnsi(line));

      // Build the new line: existing content before x + new text + existing content after
      let newLine = '';

      // Add existing content before position x (or spaces if needed)
      if (x > 0) {
        const existingBeforeX = existingLine.substring(0, Math.min(x, existingLine.length));
        const existingWidth = stringWidth(stripAnsi(existingBeforeX));

        newLine += existingBeforeX;

        // Pad with spaces if existing content doesn't reach position x
        if (existingWidth < x) {
          newLine += ' '.repeat(x - existingWidth);
        }
      }

      // Add new text
      newLine += line;

      // Add existing content after the new text (if any)
      // Need to preserve content that comes after our written text (e.g., right border)
      const afterX = x + lineWidth;
      const existingVisualWidth = stringWidth(stripAnsi(existingLine));

      if (afterX < existingVisualWidth) {
        // Extract the portion of existingLine that starts at visual position afterX
        // We need to find the actual string index that corresponds to visual position afterX
        const _strippedLine = stripAnsi(existingLine);
        let visualPos = 0;
        let stringPos = 0;
        let inAnsiCode = false;

        // Walk through existingLine to find where visual position afterX starts
        for (let i = 0; i < existingLine.length; i++) {
          const char = existingLine[i];

          // Track ANSI codes
          if (char === '\x1b') {
            inAnsiCode = true;
          }

          if (inAnsiCode) {
            if (char === 'm') {
              inAnsiCode = false;
            }
            continue; // ANSI codes don't contribute to visual width
          }

          // Check if we've reached the target visual position
          if (visualPos >= afterX) {
            stringPos = i;
            break;
          }

          visualPos += stringWidth(char);
        }

        // Extract everything from stringPos onwards
        if (stringPos < existingLine.length) {
          newLine += existingLine.substring(stringPos);
        }
      }

      // Store the merged line
      this.buffer[targetY] = newLine;

      // Track max visual width (without ANSI codes)
      const visualWidth = stringWidth(line);
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
