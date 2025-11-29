/** @jsxImportSource @zen/tui */
/**
 * Interactive Components Tests
 *
 * Tests for Hoverable, Pressable, and Draggable components.
 */
import { describe, expect, it } from 'bun:test';
import { Text } from '../primitives/Text.js';
import { Draggable, type DraggableProps } from './Draggable.js';
import { Hoverable, type HoverableProps } from './Hoverable.js';
import { Pressable, type PressableProps } from './Pressable.js';

// ==========================================================================
// Hoverable
// ==========================================================================

describe('Hoverable', () => {
  describe('Basic Rendering', () => {
    it('should render hoverable wrapper', () => {
      const result = Hoverable({
        children: (isHovered) => <Text>{isHovered ? 'Hovered' : 'Not hovered'}</Text>,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('hoverable');
    });

    it('should have __mouseId prop', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
      });

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('hoverable-');
    });

    it('should render children with hover state', () => {
      const result = Hoverable({
        children: (isHovered) => <Text>{isHovered ? 'Yes' : 'No'}</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const result1 = Hoverable({ children: () => <Text>1</Text> });
      const result2 = Hoverable({ children: () => <Text>2</Text> });

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onHoverIn callback', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onHoverOut callback', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverOut: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept both callbacks', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => {},
        onHoverOut: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        disabled: true,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Pressable
// ==========================================================================

describe('Pressable', () => {
  describe('Basic Rendering', () => {
    it('should render pressable wrapper', () => {
      const result = Pressable({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('pressable');
    });

    it('should have __mouseId prop', () => {
      const result = Pressable({});

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('pressable-');
    });

    it('should render with children', () => {
      const result = Pressable({
        children: <Text>Click me</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should render without children', () => {
      const result = Pressable({});

      expect(result).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const result1 = Pressable({});
      const result2 = Pressable({});

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onPress callback', () => {
      const result = Pressable({
        onPress: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onPressIn callback', () => {
      const result = Pressable({
        onPressIn: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onPressOut callback', () => {
      const result = Pressable({
        onPressOut: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept all callbacks', () => {
      const result = Pressable({
        onPress: () => {},
        onPressIn: () => {},
        onPressOut: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Pressable({
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Pressable({
        disabled: true,
        children: <Text>Disabled</Text>,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Draggable
// ==========================================================================

describe('Draggable', () => {
  describe('Basic Rendering', () => {
    it('should render draggable wrapper', () => {
      const result = Draggable({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('draggable');
    });

    it('should have __mouseId prop', () => {
      const result = Draggable({});

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('draggable-');
    });

    it('should render with children', () => {
      const result = Draggable({
        children: <Text>Drag me</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should render without children', () => {
      const result = Draggable({});

      expect(result).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const result1 = Draggable({});
      const result2 = Draggable({});

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onDragStart callback', () => {
      const result = Draggable({
        onDragStart: () => undefined,
      });

      expect(result).toBeDefined();
    });

    it('should accept onDrag callback', () => {
      const result = Draggable({
        onDrag: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onDragEnd callback', () => {
      const result = Draggable({
        onDragEnd: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept all callbacks', () => {
      const result = Draggable({
        onDragStart: () => true,
        onDrag: () => {},
        onDragEnd: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should allow onDragStart to return false to prevent drag', () => {
      const result = Draggable({
        onDragStart: () => false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Draggable({
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Draggable({
        disabled: true,
        children: <Text>Disabled</Text>,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Edge Cases
// ==========================================================================

describe('Interactive Edge Cases', () => {
  it('should handle nested interactive components', () => {
    const result = Pressable({
      children: Hoverable({
        children: () => <Text>Nested</Text>,
      }),
    });

    expect(result).toBeDefined();
  });

  it('should handle Pressable inside Draggable', () => {
    const result = Draggable({
      children: Pressable({
        children: <Text>Press in Drag</Text>,
      }),
    });

    expect(result).toBeDefined();
  });

  it('should handle complex children in Hoverable', () => {
    const result = Hoverable({
      children: (isHovered) =>
        isHovered ? <Text style={{ bold: true }}>Hovered!</Text> : <Text>Not hovered</Text>,
    });

    expect(result).toBeDefined();
  });
});
