/**
 * Emoji Width Detector
 *
 * Automatically detects how the terminal renders emoji with Variation Selector-16.
 * Uses runtime detection with fallback to terminal-specific profiles.
 *
 * Inspired by:
 * - fish shell's runtime emoji width testing
 * - ucs-detect's cursor position query method
 */

import stringWidth from 'string-width';

/**
 * Terminal profiles for known emoji rendering behaviors
 */
const TERMINAL_PROFILES = {
  // Terminals that support VS-16 (render emoji as width 2)
  vs16Supported: new Set(['iTerm.app', 'WezTerm', 'kitty', 'Konsole', 'WindowsTerminal']),

  // Terminals that ignore VS-16 (emoji stays narrow, width 1)
  vs16Ignored: new Set([
    'Apple_Terminal', // macOS Terminal.app
    'vscode', // VS Code integrated terminal
  ]),
} as const;

/**
 * Detection result
 */
interface EmojiWidthProfile {
  /** Does terminal support VS-16 width changes? */
  vs16Supported: boolean;
  /** Detection method used */
  detectionMethod: 'runtime' | 'profile' | 'default';
  /** Terminal identifier */
  terminal?: string;
}

let cachedProfile: EmojiWidthProfile | null = null;

/**
 * Detect emoji width behavior using cursor position query
 *
 * This method:
 * 1. Saves current cursor position
 * 2. Outputs a test emoji with VS-16
 * 3. Queries cursor position
 * 4. Calculates actual width from position change
 * 5. Restores cursor position
 *
 * Note: Only works in interactive terminals, not in piped/redirected output
 */
function detectEmojiWidthRuntime(): EmojiWidthProfile | null {
  // Check if we're in an interactive terminal
  if (!process.stdout.isTTY) {
    return null;
  }

  try {
    // TODO: Implement cursor position query
    // This requires:
    // 1. Enable raw mode on stdin
    // 2. Write CSI sequences to query cursor position
    // 3. Read response from stdin
    // 4. Parse the response
    //
    // Example sequence:
    // - Save cursor: \x1b[s or \x1b7
    // - Output test emoji: 🖥️
    // - Query position: \x1b[6n
    // - Read response: \x1b[{row};{col}R
    // - Restore cursor: \x1b[u or \x1b8
    //
    // For now, we'll skip runtime detection and use profile-based

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect emoji width behavior from environment variables
 */
function detectEmojiWidthFromProfile(): EmojiWidthProfile {
  const terminal = process.env['TERM_PROGRAM'];
  const term = process.env['TERM'];

  // Check known terminals that support VS-16
  if (terminal && TERMINAL_PROFILES.vs16Supported.has(terminal)) {
    return {
      vs16Supported: true,
      detectionMethod: 'profile',
      terminal,
    };
  }

  // Check known terminals that ignore VS-16
  if (terminal && TERMINAL_PROFILES.vs16Ignored.has(terminal)) {
    return {
      vs16Supported: false,
      detectionMethod: 'profile',
      terminal,
    };
  }

  // Special case: VS Code terminal
  if (term?.includes('vscode')) {
    return {
      vs16Supported: false,
      detectionMethod: 'profile',
      terminal: 'vscode',
    };
  }

  // Default: assume VS-16 is NOT supported (conservative approach)
  // Most terminals don't support it, so this is safer
  return {
    vs16Supported: false,
    detectionMethod: 'default',
  };
}

/**
 * Get emoji width detection profile
 *
 * Uses cached result to avoid repeated detection
 */
export function getEmojiWidthProfile(): EmojiWidthProfile {
  if (cachedProfile) {
    return cachedProfile;
  }

  // Try runtime detection first (currently not implemented)
  const runtimeProfile = detectEmojiWidthRuntime();
  if (runtimeProfile) {
    cachedProfile = runtimeProfile;
    return runtimeProfile;
  }

  // Fall back to profile-based detection
  const profile = detectEmojiWidthFromProfile();
  cachedProfile = profile;
  return profile;
}

/**
 * Calculate emoji width considering terminal capabilities
 *
 * @param emoji - Single emoji character (may include VS-16)
 * @returns Width in terminal columns
 */
export function getEmojiWidth(emoji: string): number {
  const profile = getEmojiWidthProfile();

  // If terminal doesn't support VS-16, strip it before calculating
  if (!profile.vs16Supported) {
    const stripped = emoji.replace(/\uFE0F/g, '');
    return stringWidth(stripped);
  }

  // Terminal supports VS-16, use standard calculation
  return stringWidth(emoji);
}

/**
 * Check if an emoji should be forced to narrow width
 *
 * This is used for emojis that are known to render narrowly
 * even when Unicode defines them as wide
 */
export function shouldForceNarrow(emoji: string): boolean {
  const profile = getEmojiWidthProfile();

  // If terminal doesn't support VS-16, emojis with VS-16 stay narrow
  if (!profile.vs16Supported && emoji.includes('\uFE0F')) {
    // Check if base emoji (without VS-16) is narrow
    const base = emoji.replace(/\uFE0F/g, '');
    const baseWidth = stringWidth(base);
    return baseWidth <= 1;
  }

  return false;
}

/**
 * Reset cached detection (for testing)
 */
export function resetEmojiWidthDetection(): void {
  cachedProfile = null;
}
