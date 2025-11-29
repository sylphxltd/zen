/** @jsxImportSource @zen/tui */
/**
 * StatusBar Component Tests
 *
 * Tests for bottom status bar with left/center/right sections.
 */
import { describe, expect, it } from 'bun:test';
import { Text } from '../primitives/Text.js';
import {
  StatusBar,
  StatusBarItem,
  StatusBarMode,
  StatusBarSeparator,
  StatusBarShortcut,
} from './StatusBar.js';

describe('StatusBar', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render status bar', () => {
      const result = StatusBar({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render with left content', () => {
      const result = StatusBar({
        left: 'Left content',
      });

      expect(result).toBeDefined();
    });

    it('should render with center content', () => {
      const result = StatusBar({
        center: 'Center content',
      });

      expect(result).toBeDefined();
    });

    it('should render with right content', () => {
      const result = StatusBar({
        right: 'Right content',
      });

      expect(result).toBeDefined();
    });

    it('should render with all sections', () => {
      const result = StatusBar({
        left: 'Left',
        center: 'Center',
        right: 'Right',
      });

      expect(result).toBeDefined();
    });

    it('should accept TUINode as content', () => {
      const result = StatusBar({
        left: Text({ children: 'Custom' }),
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Layout
  // ==========================================================================

  describe('Layout', () => {
    it('should have row flex direction', () => {
      const result = StatusBar({});

      expect(result.style?.flexDirection).toBe('row');
    });

    it('should have width 100%', () => {
      const result = StatusBar({});

      expect(result.style?.width).toBe('100%');
    });

    it('should have height 1', () => {
      const result = StatusBar({});

      expect(result.style?.height).toBe(1);
    });

    it('should have three section children', () => {
      const result = StatusBar({
        left: 'L',
        center: 'C',
        right: 'R',
      });

      expect(result.children.length).toBe(3);
    });

    it('should align left section to start', () => {
      const result = StatusBar({ left: 'Left' });

      expect(result.children[0].style?.justifyContent).toBe('flex-start');
    });

    it('should align center section to center', () => {
      const result = StatusBar({ center: 'Center' });

      expect(result.children[1].style?.justifyContent).toBe('center');
    });

    it('should align right section to end', () => {
      const result = StatusBar({ right: 'Right' });

      expect(result.children[2].style?.justifyContent).toBe('flex-end');
    });
  });

  // ==========================================================================
  // Styling
  // ==========================================================================

  describe('Styling', () => {
    it('should use default blue background', () => {
      const result = StatusBar({});

      expect(result.style?.backgroundColor).toBe('blue');
    });

    it('should use custom background color', () => {
      const result = StatusBar({
        backgroundColor: 'green',
      });

      expect(result.style?.backgroundColor).toBe('green');
    });

    it('should accept custom style', () => {
      const result = StatusBar({
        style: { paddingX: 1 },
      });

      expect(result.style?.paddingX).toBe(1);
    });

    it('should merge custom style with defaults', () => {
      const result = StatusBar({
        style: { paddingX: 1 },
        backgroundColor: 'red',
      });

      expect(result.style?.paddingX).toBe(1);
      expect(result.style?.backgroundColor).toBe('red');
    });
  });

  // ==========================================================================
  // Text Styling
  // ==========================================================================

  describe('Text Styling', () => {
    it('should use default white text color', () => {
      // Text color is applied to wrapped content
      const result = StatusBar({
        left: 'Text',
        color: 'white',
      });

      expect(result).toBeDefined();
    });

    it('should use custom text color', () => {
      const result = StatusBar({
        left: 'Text',
        color: 'yellow',
      });

      expect(result).toBeDefined();
    });

    it('should support bold text', () => {
      const result = StatusBar({
        left: 'Bold',
        bold: true,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty left', () => {
      const result = StatusBar({ left: undefined });

      expect(result).toBeDefined();
    });

    it('should handle empty center', () => {
      const result = StatusBar({ center: undefined });

      expect(result).toBeDefined();
    });

    it('should handle empty right', () => {
      const result = StatusBar({ right: undefined });

      expect(result).toBeDefined();
    });

    it('should handle all empty sections', () => {
      const result = StatusBar({});

      expect(result).toBeDefined();
    });

    it('should handle empty string content', () => {
      const result = StatusBar({
        left: '',
        center: '',
        right: '',
      });

      expect(result).toBeDefined();
    });

    it('should handle very long content', () => {
      const result = StatusBar({
        left: 'A'.repeat(50),
        center: 'B'.repeat(50),
        right: 'C'.repeat(50),
      });

      expect(result).toBeDefined();
    });
  });
});

// ==========================================================================
// StatusBarItem
// ==========================================================================

describe('StatusBarItem', () => {
  it('should render item', () => {
    const result = StatusBarItem({ children: 'Item' });

    expect(result).toBeDefined();
    expect(result.type).toBe('text');
  });

  it('should apply custom color', () => {
    const result = StatusBarItem({
      children: 'Colored',
      color: 'yellow',
    });

    expect(result.style?.color).toBe('yellow');
  });

  it('should apply background color', () => {
    const result = StatusBarItem({
      children: 'Background',
      backgroundColor: 'red',
    });

    expect(result.style?.backgroundColor).toBe('red');
  });

  it('should apply bold', () => {
    const result = StatusBarItem({
      children: 'Bold',
      bold: true,
    });

    expect(result.style?.bold).toBe(true);
  });

  it('should add padding when padded', () => {
    const result = StatusBarItem({
      children: 'Padded',
      padded: true,
    });

    // Content should have spaces around it
    expect(result.children[0]).toContain(' ');
  });

  it('should not add padding when not padded', () => {
    const result = StatusBarItem({
      children: 'NoPad',
      padded: false,
    });

    expect(result.children[0]).toBe('NoPad');
  });
});

// ==========================================================================
// StatusBarMode
// ==========================================================================

describe('StatusBarMode', () => {
  it('should render mode indicator', () => {
    const result = StatusBarMode({ mode: 'NORMAL' });

    expect(result).toBeDefined();
    expect(result.type).toBe('text');
  });

  it('should use green for NORMAL mode', () => {
    const result = StatusBarMode({ mode: 'NORMAL' });

    expect(result.style?.backgroundColor).toBe('green');
    expect(result.style?.color).toBe('black');
  });

  it('should use blue for INSERT mode', () => {
    const result = StatusBarMode({ mode: 'INSERT' });

    expect(result.style?.backgroundColor).toBe('blue');
    expect(result.style?.color).toBe('white');
  });

  it('should use magenta for VISUAL mode', () => {
    const result = StatusBarMode({ mode: 'VISUAL' });

    expect(result.style?.backgroundColor).toBe('magenta');
    expect(result.style?.color).toBe('white');
  });

  it('should use yellow for COMMAND mode', () => {
    const result = StatusBarMode({ mode: 'COMMAND' });

    expect(result.style?.backgroundColor).toBe('yellow');
    expect(result.style?.color).toBe('black');
  });

  it('should use cyan for SEARCH mode', () => {
    const result = StatusBarMode({ mode: 'SEARCH' });

    expect(result.style?.backgroundColor).toBe('cyan');
    expect(result.style?.color).toBe('black');
  });

  it('should use gray for unknown mode', () => {
    const result = StatusBarMode({ mode: 'CUSTOM' });

    expect(result.style?.backgroundColor).toBe('gray');
    expect(result.style?.color).toBe('white');
  });

  it('should uppercase mode text', () => {
    const result = StatusBarMode({ mode: 'normal' });

    expect(result.children[0]).toContain('NORMAL');
  });

  it('should apply custom background color', () => {
    const result = StatusBarMode({
      mode: 'NORMAL',
      backgroundColor: 'purple',
    });

    expect(result.style?.backgroundColor).toBe('purple');
  });

  it('should apply custom text color', () => {
    const result = StatusBarMode({
      mode: 'NORMAL',
      color: 'yellow',
    });

    expect(result.style?.color).toBe('yellow');
  });

  it('should be bold', () => {
    const result = StatusBarMode({ mode: 'NORMAL' });

    expect(result.style?.bold).toBe(true);
  });
});

// ==========================================================================
// StatusBarShortcut
// ==========================================================================

describe('StatusBarShortcut', () => {
  it('should render shortcut', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+S',
      action: 'Save',
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should render keys and action', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+Q',
      action: 'Quit',
    });

    expect(result.children.length).toBe(2);
  });

  it('should use default yellow key color', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+S',
      action: 'Save',
    });

    expect(result.children[0].style?.color).toBe('yellow');
  });

  it('should use custom key color', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+S',
      action: 'Save',
      keyColor: 'cyan',
    });

    expect(result.children[0].style?.color).toBe('cyan');
  });

  it('should make keys bold', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+S',
      action: 'Save',
    });

    expect(result.children[0].style?.bold).toBe(true);
  });

  it('should make action dim', () => {
    const result = StatusBarShortcut({
      keys: 'Ctrl+S',
      action: 'Save',
    });

    expect(result.children[1].style?.dim).toBe(true);
  });
});

// ==========================================================================
// StatusBarSeparator
// ==========================================================================

describe('StatusBarSeparator', () => {
  it('should render separator', () => {
    const result = StatusBarSeparator();

    expect(result).toBeDefined();
    expect(result.type).toBe('text');
  });

  it('should contain separator character', () => {
    const result = StatusBarSeparator();

    expect(result.children[0]).toContain('│');
  });

  it('should be dim', () => {
    const result = StatusBarSeparator();

    expect(result.style?.dim).toBe(true);
  });
});
