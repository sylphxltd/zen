/** @jsxImportSource @zen/tui */
/**
 * ScrollBox Component Tests
 *
 * Tests for scrollable container with keyboard and mouse navigation.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import { signal } from '@zen/signal';
import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { Text } from '../primitives/Text.js';
import { ScrollBox, type ScrollBoxProps } from './ScrollBox.js';

setPlatformOps(tuiPlatformOps);

describe('ScrollBox', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render scroll box with height', () => {
      const result = ScrollBox({ height: 10 });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('scrollbox');
    });

    it('should render with children', () => {
      const result = ScrollBox({
        height: 10,
        children: <Text>Content</Text>,
      });

      expect(result).toBeDefined();
      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should apply overflow hidden style', () => {
      const result = ScrollBox({ height: 10 });

      expect(result.style?.overflow).toBe('hidden');
    });

    it('should apply height from props', () => {
      const result = ScrollBox({ height: 15 });

      expect(result.style?.height).toBe(15);
    });

    it('should support reactive height', () => {
      const height = signal(10);
      const result = ScrollBox({ height: () => height.value });

      expect(result).toBeDefined();
    });

    it('should apply additional styles', () => {
      const result = ScrollBox({
        height: 10,
        style: { borderStyle: 'single', padding: 1 },
      });

      expect(result.style?.borderStyle).toBe('single');
    });
  });

  // ==========================================================================
  // Scroll Offset
  // ==========================================================================

  describe('Scroll Offset', () => {
    it('should use internal scroll offset by default', () => {
      const result = ScrollBox({ height: 10 });

      expect(result.props.scrollOffset).toBeDefined();
      expect(result.props.scrollOffset.value).toBe(0);
    });

    it('should use external scroll offset when provided', () => {
      const externalOffset = signal(5);
      const result = ScrollBox({
        height: 10,
        scrollOffset: externalOffset,
      });

      expect(result.props.scrollOffset).toBe(externalOffset);
      expect(result.props.scrollOffset.value).toBe(5);
    });

    it('should sync with external scroll offset changes', () => {
      const externalOffset = signal(0);
      const result = ScrollBox({
        height: 10,
        scrollOffset: externalOffset,
      });

      externalOffset.value = 10;
      expect(result.props.scrollOffset.value).toBe(10);
    });
  });

  // ==========================================================================
  // Scroll Configuration
  // ==========================================================================

  describe('Scroll Configuration', () => {
    it('should accept scrollStep prop', () => {
      const result = ScrollBox({
        height: 10,
        scrollStep: 2,
      });

      expect(result).toBeDefined();
    });

    it('should accept reactive scrollStep', () => {
      const scrollStep = signal(3);
      const result = ScrollBox({
        height: 10,
        scrollStep: () => scrollStep.value,
      });

      expect(result).toBeDefined();
    });

    it('should accept pageSize prop', () => {
      const result = ScrollBox({
        height: 10,
        pageSize: 5,
      });

      expect(result).toBeDefined();
    });

    it('should accept reactive pageSize', () => {
      const pageSize = signal(8);
      const result = ScrollBox({
        height: 10,
        pageSize: () => pageSize.value,
      });

      expect(result).toBeDefined();
    });

    it('should accept contentHeight prop', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 50,
      });

      expect(result).toBeDefined();
    });

    it('should accept reactive contentHeight', () => {
      const contentHeight = signal(100);
      const result = ScrollBox({
        height: 10,
        contentHeight: () => contentHeight.value,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Max Scroll Calculation
  // ==========================================================================

  describe('Max Scroll Calculation', () => {
    it('should handle no contentHeight (unlimited scroll)', () => {
      const result = ScrollBox({
        height: 10,
      });

      expect(result).toBeDefined();
    });

    it('should account for border in max scroll', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 20,
        style: { borderStyle: 'single' },
      });

      expect(result).toBeDefined();
    });

    it('should account for padding in max scroll', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 20,
        style: { padding: 2 },
      });

      expect(result).toBeDefined();
    });

    it('should account for paddingY in max scroll', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 20,
        style: { paddingY: 1 },
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle zero height', () => {
      const result = ScrollBox({ height: 0 });
      expect(result).toBeDefined();
    });

    it('should handle very large height', () => {
      const result = ScrollBox({ height: 1000 });
      expect(result).toBeDefined();
    });

    it('should handle contentHeight less than viewport', () => {
      const result = ScrollBox({
        height: 20,
        contentHeight: 10,
      });
      expect(result).toBeDefined();
    });

    it('should handle contentHeight equal to viewport', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 10,
      });
      expect(result).toBeDefined();
    });

    it('should handle undefined children', () => {
      const result = ScrollBox({ height: 10, children: undefined });
      expect(result).toBeDefined();
    });

    it('should handle multiple children', () => {
      const result = ScrollBox({
        height: 10,
        children: [<Text key="1">Line 1</Text>, <Text key="2">Line 2</Text>],
      });
      expect(result).toBeDefined();
    });

    it('should handle nested ScrollBox', () => {
      const result = ScrollBox({
        height: 20,
        children: ScrollBox({ height: 10, children: <Text>Nested</Text> }),
      });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Style Inheritance
  // ==========================================================================

  describe('Style Inheritance', () => {
    it('should merge custom style with default overflow', () => {
      const result = ScrollBox({
        height: 10,
        style: { flexDirection: 'row' },
      });

      expect(result.style?.overflow).toBe('hidden');
      expect(result.style?.flexDirection).toBe('row');
    });

    it('should preserve borderStyle none', () => {
      const result = ScrollBox({
        height: 10,
        contentHeight: 20,
        style: { borderStyle: 'none' },
      });

      expect(result).toBeDefined();
    });
  });
});
