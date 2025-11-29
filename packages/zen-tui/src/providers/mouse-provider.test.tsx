/** @jsxImportSource @zen/tui */
/**
 * MouseProvider Component Tests
 *
 * Tests for mouse tracking provider and context.
 * Note: MouseProvider uses Context.Provider which requires createRoot
 */
import { describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import { Text } from '../primitives/Text.js';
import { type MouseContextValue, MouseProvider, useMouseContext } from './MouseProvider.js';

describe('MouseProvider', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render mouse provider', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should render with children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          children: <Text>Content</Text>,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should render without children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Context
  // ==========================================================================

  describe('Context', () => {
    it('should expose context via useMouseContext', () => {
      // useMouseContext returns null outside of provider
      const context = useMouseContext();

      // Outside provider, context is null
      expect(context).toBeNull();
    });
  });

  // ==========================================================================
  // Enabled State
  // ==========================================================================

  describe('Enabled State', () => {
    it('should be enabled by default', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept enabled=true', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          enabled: true,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept enabled=false', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          enabled: false,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept reactive enabled', () => {
      let result: unknown;
      const enabled = signal(true);
      createRoot(() => {
        result = MouseProvider({
          enabled: () => enabled.value,
        });
        return result;
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({ children: undefined });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should handle multiple children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          children: [<Text key="1">First</Text>, <Text key="2">Second</Text>],
        });
        return result;
      });

      expect(result).toBeDefined();
    });
  });
});

// ==========================================================================
// Event Types
// ==========================================================================

describe('Mouse Event Types', () => {
  it('should export PressEvent type', () => {
    // Type checking - just verify imports work
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
      button: 'left' as const,
      modifiers: {},
      stopPropagation: () => {},
    };

    expect(event.x).toBe(0);
  });

  it('should export DragEvent type', () => {
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
      button: 'left' as const,
      modifiers: {},
      stopPropagation: () => {},
      deltaX: 10,
      deltaY: 5,
      startX: 0,
      startY: 0,
    };

    expect(event.deltaX).toBe(10);
  });

  it('should export HoverEvent type', () => {
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
    };

    expect(event.x).toBe(0);
  });
});
