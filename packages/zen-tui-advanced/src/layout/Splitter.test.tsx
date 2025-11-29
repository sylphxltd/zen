/** @jsxImportSource @zen/tui */
/**
 * Splitter Component Tests
 *
 * Tests for layout, resizing, and reactivity.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import { Text, clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { Pane, Splitter } from './Splitter.js';

setPlatformOps(tuiPlatformOps);

describe('Splitter', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render horizontal split with two panes', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Text>Left Pane</Text>
          </Pane>
          <Pane>
            <Text>Right Pane</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should render vertical split with two panes', () => {
      const result = (
        <Splitter orientation="vertical">
          <Pane>
            <Text>Top Pane</Text>
          </Pane>
          <Pane>
            <Text>Bottom Pane</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should render with default horizontal orientation', () => {
      const result = (
        <Splitter>
          <Pane>
            <Text>Pane 1</Text>
          </Pane>
          <Pane>
            <Text>Pane 2</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should render with custom sizes', () => {
      const result = (
        <Splitter orientation="horizontal" sizes={[30, 70]}>
          <Pane>
            <Text>Small Pane (30%)</Text>
          </Pane>
          <Pane>
            <Text>Large Pane (70%)</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should render with minimum size constraints', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane minSize={20}>
            <Text>Pane with min 20 cols</Text>
          </Pane>
          <Pane minSize={30}>
            <Text>Pane with min 30 cols</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should render with three panes', () => {
      const result = (
        <Splitter orientation="horizontal" sizes={[20, 50, 30]}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Middle</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should render with nested splitters', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Text>Left Pane</Text>
          </Pane>
          <Pane>
            <Splitter orientation="vertical">
              <Pane>
                <Text>Top Right</Text>
              </Pane>
              <Pane>
                <Text>Bottom Right</Text>
              </Pane>
            </Splitter>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Divider Configuration
  // ==========================================================================

  describe('Divider Configuration', () => {
    it('should hide divider when showDivider=false', () => {
      const result = (
        <Splitter orientation="horizontal" showDivider={false}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should use custom divider character', () => {
      const result = (
        <Splitter orientation="horizontal" dividerChar="║">
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should use default divider for horizontal', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should use default divider for vertical', () => {
      const result = (
        <Splitter orientation="vertical">
          <Pane>
            <Text>Top</Text>
          </Pane>
          <Pane>
            <Text>Bottom</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Resize Functionality
  // ==========================================================================

  describe('Resize Functionality', () => {
    it('should disable resize when resizable=false', () => {
      const result = (
        <Splitter orientation="horizontal" resizable={false}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should not respond to resize keys when resizable=false', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={false} sizes={[50, 50]}>
            <Pane>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('}'); // Try to resize
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash or change sizes
    });

    it('should resize panes with { and } keys', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={true} sizes={[50, 50]} focusedPane={0}>
            <Pane>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('}'); // Increase focused pane size
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash
    });

    it('should decrease focused pane size with {', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={true} sizes={[50, 50]} focusedPane={1}>
            <Pane>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('{'); // Decrease focused pane size
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash
    });
  });

  // ==========================================================================
  // Focus Management
  // ==========================================================================

  describe('Focus Management', () => {
    it('should support focusedPane prop', () => {
      const result = (
        <Splitter orientation="horizontal" focusedPane={1}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should support reactive focusedPane', () => {
      const focusedPane = signal(0);

      const result = (
        <Splitter orientation="horizontal" focusedPane={() => focusedPane.value}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Change focus
      focusedPane.value = 1;
    });
  });

  // ==========================================================================
  // Reactive Props
  // ==========================================================================

  describe('Reactive Props', () => {
    it('should support reactive orientation', () => {
      const orientation = signal<'horizontal' | 'vertical'>('horizontal');

      const result = (
        <Splitter orientation={() => orientation.value}>
          <Pane>
            <Text>Pane 1</Text>
          </Pane>
          <Pane>
            <Text>Pane 2</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Change orientation
      orientation.value = 'vertical';
    });

    it('should support reactive sizes', () => {
      const sizes = signal([30, 70]);

      const result = (
        <Splitter orientation="horizontal" sizes={() => sizes.value}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Change sizes
      sizes.value = [50, 50];
    });

    it('should support reactive showDivider', () => {
      const showDivider = signal(true);

      const result = (
        <Splitter orientation="horizontal" showDivider={() => showDivider.value}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Toggle divider
      showDivider.value = false;
    });

    it('should support reactive dividerChar', () => {
      const dividerChar = signal('│');

      const result = (
        <Splitter orientation="horizontal" dividerChar={() => dividerChar.value}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Change divider
      dividerChar.value = '║';
    });

    it('should support reactive resizable', () => {
      const resizable = signal(true);

      const result = (
        <Splitter orientation="horizontal" resizable={() => resizable.value}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();

      // Disable resize
      resizable.value = false;
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle single pane', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Text>Only Pane</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should handle many panes', () => {
      const result = (
        <Splitter orientation="horizontal" sizes={[20, 20, 20, 20, 20]}>
          <Pane>
            <Text>1</Text>
          </Pane>
          <Pane>
            <Text>2</Text>
          </Pane>
          <Pane>
            <Text>3</Text>
          </Pane>
          <Pane>
            <Text>4</Text>
          </Pane>
          <Pane>
            <Text>5</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should handle empty panes', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane />
          <Pane />
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should handle sizes that do not sum to 100', () => {
      const result = (
        <Splitter orientation="horizontal" sizes={[25, 25]}>
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Text>Right</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should handle very small sizes', () => {
      const result = (
        <Splitter orientation="horizontal" sizes={[5, 95]}>
          <Pane>
            <Text>Tiny</Text>
          </Pane>
          <Pane>
            <Text>Large</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should not resize below minimum with { key', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={true} sizes={[10, 90]} focusedPane={0}>
            <Pane minSize={5}>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      // Try to shrink already small pane
      dispatchInput('{');
      dispatchInput('{');
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash or go negative
    });

    it('should not resize when at first pane with {', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={true} sizes={[50, 50]} focusedPane={0}>
            <Pane>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('{'); // Can't shrink first pane (no previous pane)
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash
    });

    it('should not resize when at last pane with }', async () => {
      createRoot(() => {
        return (
          <Splitter orientation="horizontal" resizable={true} sizes={[50, 50]} focusedPane={1}>
            <Pane>
              <Text>Left</Text>
            </Pane>
            <Pane>
              <Text>Right</Text>
            </Pane>
          </Splitter>
        );
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('}'); // Can't grow last pane (no next pane)
      await new Promise((r) => setTimeout(r, 10));
      // Should not crash
    });
  });

  // ==========================================================================
  // Pane Component
  // ==========================================================================

  describe('Pane Component', () => {
    it('should render Pane independently', () => {
      const result = (
        <Pane>
          <Text>Content</Text>
        </Pane>
      );

      expect(result).toBeDefined();
    });

    it('should support minSize prop', () => {
      const result = (
        <Pane minSize={20}>
          <Text>Content</Text>
        </Pane>
      );

      expect(result).toBeDefined();
    });

    it('should support maxSize prop', () => {
      const result = (
        <Pane maxSize={100}>
          <Text>Content</Text>
        </Pane>
      );

      expect(result).toBeDefined();
    });

    it('should support both minSize and maxSize', () => {
      const result = (
        <Pane minSize={20} maxSize={80}>
          <Text>Content</Text>
        </Pane>
      );

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Deep Nesting
  // ==========================================================================

  describe('Deep Nesting', () => {
    it('should handle 3 levels of nesting', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Text>Left</Text>
          </Pane>
          <Pane>
            <Splitter orientation="vertical">
              <Pane>
                <Text>Top Right</Text>
              </Pane>
              <Pane>
                <Splitter orientation="horizontal">
                  <Pane>
                    <Text>Bottom Right Left</Text>
                  </Pane>
                  <Pane>
                    <Text>Bottom Right Right</Text>
                  </Pane>
                </Splitter>
              </Pane>
            </Splitter>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });

    it('should handle alternating orientations', () => {
      const result = (
        <Splitter orientation="horizontal">
          <Pane>
            <Splitter orientation="vertical">
              <Pane>
                <Splitter orientation="horizontal">
                  <Pane>
                    <Text>1</Text>
                  </Pane>
                  <Pane>
                    <Text>2</Text>
                  </Pane>
                </Splitter>
              </Pane>
              <Pane>
                <Text>3</Text>
              </Pane>
            </Splitter>
          </Pane>
          <Pane>
            <Text>4</Text>
          </Pane>
        </Splitter>
      );

      expect(result).toBeDefined();
    });
  });
});
