/**
 * Mouse Event Parser
 *
 * Parses SGR extended mouse tracking sequences.
 * Format: \x1b[<b;x;yM (press) or \x1b[<b;x;ym (release)
 */

export interface MouseEvent {
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'scroll';
  button: 'left' | 'middle' | 'right' | 'scroll-up' | 'scroll-down' | 'none';
  x: number; // 1-indexed column
  y: number; // 1-indexed row
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Parse SGR extended mouse tracking sequence
 * Returns null if not a mouse event
 */
export function parseMouseEvent(data: string): MouseEvent | null {
  // SGR extended format: ESC[<b;x;yM or ESC[<b;x;ym
  // Check for ESC character at start
  if (!data.startsWith('\x1b[<')) return null;

  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences require control characters
  const match = data.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
  if (!match) return null;

  const [, buttonCode, xStr, yStr, action] = match;
  const b = Number.parseInt(buttonCode, 10);
  const x = Number.parseInt(xStr, 10);
  const y = Number.parseInt(yStr, 10);

  // Extract modifiers from button code
  const ctrl = !!(b & 16);
  const shift = !!(b & 4);
  const meta = !!(b & 8);

  // Button code (without modifiers)
  const baseButton = b & ~(16 | 8 | 4);

  // Determine button type
  let button: MouseEvent['button'];
  let type: MouseEvent['type'];

  // Check for mouse move (bit 32 set = motion)
  const isMotion = !!(b & 32);
  const buttonBase = baseButton & ~32; // Remove motion bit

  if (baseButton === 64) {
    button = 'scroll-up';
    type = 'scroll';
  } else if (baseButton === 65) {
    button = 'scroll-down';
    type = 'scroll';
  } else if (buttonBase === 0) {
    button = 'left';
    if (isMotion) {
      type = 'mousemove';
    } else if (action === 'M') {
      type = 'mousedown';
    } else {
      type = 'mouseup';
    }
  } else if (buttonBase === 1) {
    button = 'middle';
    if (isMotion) {
      type = 'mousemove';
    } else if (action === 'M') {
      type = 'mousedown';
    } else {
      type = 'mouseup';
    }
  } else if (buttonBase === 2) {
    button = 'right';
    if (isMotion) {
      type = 'mousemove';
    } else if (action === 'M') {
      type = 'mousedown';
    } else {
      type = 'mouseup';
    }
  } else if (buttonBase === 3 || baseButton === 35) {
    // Button release or motion with no button
    button = 'none';
    type = isMotion ? 'mousemove' : 'mouseup';
  } else {
    // Unknown button code
    return null;
  }

  return {
    type,
    button,
    x,
    y,
    ...(ctrl && { ctrl }),
    ...(shift && { shift }),
    ...(meta && { meta }),
  };
}
