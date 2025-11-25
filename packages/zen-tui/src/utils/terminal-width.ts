/**
 * Terminal Width Calculation
 *
 * Provides consistent character width calculation for TUI layout.
 *
 * Problem:
 * - string-width library may not match actual terminal rendering
 * - Variation Selector 16 (U+FE0F) affects emoji width inconsistently
 * - Different terminals have different Unicode version support
 *
 * Solution:
 * - Normalize emoji by handling VS16 consistently
 * - Use grapheme-aware iteration for proper cluster handling
 * - Provide fallback to string-width for standard characters
 */

import stringWidth from 'string-width';

// Variation Selector 16 - forces emoji presentation
const VS16 = '\uFE0F';

// Emoji ZWJ sequences use this
const ZWJ = '\u200D';

// Common emoji that should be width 2
const WIDE_EMOJI = new Set([
  '📁',
  '📂',
  '📄',
  '📋',
  '📌',
  '📍',
  '🤖',
  '🔥',
  '💡',
  '⚡',
  '✨',
  '❤',
  '💔',
  '💕',
  '💖',
  '💗',
  '💘',
  '💙',
  '💚',
  '💛',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '✅',
  '❌',
  '⭐',
  '🌟',
]);

// Emoji that should be width 1 (narrow presentation by default)
// These are symbols that have emoji variants but are traditionally narrow
const NARROW_EMOJI_BASE = new Set([
  '⚛', // Atom (base character without VS16)
  '☢', // Radioactive
  '☣', // Biohazard
  '♻', // Recycling
  '⚠', // Warning
  '✓',
  '✔', // Check marks
  '✗',
  '✘', // X marks
  '▶',
  '▷',
  '◀',
  '◁', // Triangles
  '▲',
  '△',
  '▼',
  '▽',
  '►',
  '▻',
  '◄',
  '◅',
  '▸',
  '▹',
  '◂',
  '◃',
  '●',
  '○',
  '◉',
  '◎',
  '■',
  '□',
  '▪',
  '▫',
  '♠',
  '♣',
  '♥',
  '♦', // Card suits
  '🖥', // Desktop computer (displays as width 1 in many terminals despite Unicode width 2)
]);

// Cached segmenter for performance
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/**
 * Segment text into grapheme clusters using Intl.Segmenter
 */
function* graphemeClusters(text: string): Generator<string> {
  for (const segment of segmenter.segment(text)) {
    yield segment.segment;
  }
}

/**
 * Get base character (strip VS16 if present)
 */
function getBaseChar(grapheme: string): string {
  return grapheme.replace(VS16, '');
}

/**
 * Check if grapheme is an emoji with VS16
 */
function hasVS16(grapheme: string): boolean {
  return grapheme.includes(VS16);
}

/**
 * Check if grapheme contains ZWJ (emoji sequence)
 */
function hasZWJ(grapheme: string): boolean {
  return grapheme.includes(ZWJ);
}

/**
 * Calculate width of a single grapheme cluster
 */
function graphemeWidth(grapheme: string): number {
  // Empty string
  if (grapheme.length === 0) return 0;

  // Get base character (without VS16)
  const base = getBaseChar(grapheme);

  // Check if base is in narrow emoji set
  if (NARROW_EMOJI_BASE.has(base)) {
    // Force width 1 for these symbols regardless of VS16
    return 1;
  }

  // Check if it's in wide emoji set
  if (WIDE_EMOJI.has(base)) {
    return 2;
  }

  // ZWJ sequences (family emoji, etc.) - use string-width
  if (hasZWJ(grapheme)) {
    return stringWidth(grapheme);
  }

  // For emoji with VS16, check if base would be narrow
  if (hasVS16(grapheme)) {
    const baseWidth = stringWidth(base);
    // If base is narrow (1), stay narrow even with VS16
    // This handles cases where terminal ignores VS16
    if (baseWidth === 1) {
      return 1;
    }
  }

  // Default: use string-width
  return stringWidth(grapheme);
}

/**
 * Calculate terminal display width of a string
 *
 * This function provides consistent width calculation by:
 * 1. Using grapheme cluster segmentation
 * 2. Handling VS16 (Variation Selector 16) consistently
 * 3. Treating narrow emoji as width 1 even with VS16
 */
export function terminalWidth(text: string): number {
  let totalWidth = 0;

  for (const grapheme of graphemeClusters(text)) {
    totalWidth += graphemeWidth(grapheme);
  }

  return totalWidth;
}

/**
 * Alternative: Strip VS16 before calculating width
 * This provides the most consistent results across terminals
 */
export function terminalWidthStripped(text: string): number {
  // Remove all VS16 characters, then calculate with string-width
  const stripped = text.replace(/\uFE0F/g, '');
  return stringWidth(stripped);
}

// Export as default
export default terminalWidth;
