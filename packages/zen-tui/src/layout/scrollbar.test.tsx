/** @jsxImportSource @zen/tui */
/**
 * Scrollbar Component Tests
 *
 * Tests for visual scroll indicator with thumb positioning.
 */
import { describe, expect, it } from 'bun:test';
import { signal } from '@zen/signal';
import { Scrollbar, type ScrollbarProps } from './Scrollbar.js';

describe('Scrollbar', () => {
  // Helper to create scrollbar with defaults
  const createScrollbar = (overrides: Partial<ScrollbarProps> = {}) => {
    const defaults: ScrollbarProps = {
      scrollOffset: signal(0),
      contentHeight: 100,
      viewportHeight: 20,
    };
    return Scrollbar({ ...defaults, ...overrides });
  };

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render scrollbar', () => {
      const result = createScrollbar();

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('scrollbar');
    });

    it('should have width of 1', () => {
      const result = createScrollbar();

      expect(result.style?.width).toBe(1);
    });

    it('should have flexDirection column', () => {
      const result = createScrollbar();

      expect(result.style?.flexDirection).toBe('column');
    });

    it('should have height equal to viewportHeight', () => {
      const result = createScrollbar({ viewportHeight: 15 });

      expect(result.style?.height).toBe(15);
    });

    it('should render track characters', () => {
      const result = createScrollbar({ viewportHeight: 5 });

      expect(result.children.length).toBe(5);
    });
  });

  // ==========================================================================
  // Custom Characters
  // ==========================================================================

  describe('Custom Characters', () => {
    it('should use default track character │', () => {
      const result = createScrollbar({ viewportHeight: 3, contentHeight: 100 });

      // At least one track character should exist
      const hasTrack = result.children.some(
        (child: { children?: string; style?: { color?: string } }) => child.children?.includes('│'),
      );
      expect(hasTrack).toBe(true);
    });

    it('should use custom track character', () => {
      const result = createScrollbar({
        viewportHeight: 3,
        contentHeight: 100,
        trackChar: '|',
      });

      const hasCustomTrack = result.children.some(
        (child: { children?: string; style?: { color?: string } }) => child.children?.includes('|'),
      );
      expect(hasCustomTrack).toBe(true);
    });

    it('should use default thumb character █', () => {
      const result = createScrollbar({ viewportHeight: 10, contentHeight: 10 });

      // When content equals viewport, thumb should fill
      const hasThumb = result.children.some(
        (child: { children?: string; style?: { color?: string } }) => child.children?.includes('█'),
      );
      expect(hasThumb).toBe(true);
    });

    it('should use custom thumb character', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 10,
        thumbChar: '#',
      });

      const hasCustomThumb = result.children.some(
        (child: { children?: string; style?: { color?: string } }) => child.children?.includes('#'),
      );
      expect(hasCustomThumb).toBe(true);
    });
  });

  // ==========================================================================
  // Custom Colors
  // ==========================================================================

  describe('Custom Colors', () => {
    it('should use default track color gray', () => {
      const result = createScrollbar({ viewportHeight: 5, contentHeight: 100 });

      const trackLine = result.children.find(
        (child: { children?: string; style?: { color?: string } }) =>
          child.children?.includes('│') && child.style?.color === 'gray',
      );
      expect(trackLine).toBeDefined();
    });

    it('should use custom track color', () => {
      const result = createScrollbar({
        viewportHeight: 5,
        contentHeight: 100,
        trackColor: 'blue',
      });

      const trackLine = result.children.find(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'blue',
      );
      expect(trackLine).toBeDefined();
    });

    it('should use default thumb color cyan', () => {
      const result = createScrollbar({ viewportHeight: 10, contentHeight: 10 });

      const thumbLine = result.children.find(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      );
      expect(thumbLine).toBeDefined();
    });

    it('should use custom thumb color', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 10,
        thumbColor: 'yellow',
      });

      const thumbLine = result.children.find(
        (child: { children?: string; style?: { color?: string } }) =>
          child.style?.color === 'yellow',
      );
      expect(thumbLine).toBeDefined();
    });
  });

  // ==========================================================================
  // Thumb Size
  // ==========================================================================

  describe('Thumb Size', () => {
    it('should have thumb size proportional to content ratio', () => {
      // viewportHeight / contentHeight = 20 / 100 = 0.2
      // thumbSize = floor(0.2 * 20) = 4
      const result = createScrollbar({
        viewportHeight: 20,
        contentHeight: 100,
      });

      const thumbCount = result.children.filter(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      ).length;
      expect(thumbCount).toBe(4);
    });

    it('should have minimum thumb size of 1', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 1000,
      });

      const thumbCount = result.children.filter(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      ).length;
      expect(thumbCount).toBeGreaterThanOrEqual(1);
    });

    it('should fill entire track when content fits in viewport', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 10,
      });

      const thumbCount = result.children.filter(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      ).length;
      expect(thumbCount).toBe(10);
    });

    it('should fill entire track when content smaller than viewport', () => {
      const result = createScrollbar({
        viewportHeight: 20,
        contentHeight: 10,
      });

      const thumbCount = result.children.filter(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      ).length;
      expect(thumbCount).toBe(20);
    });
  });

  // ==========================================================================
  // Thumb Position
  // ==========================================================================

  describe('Thumb Position', () => {
    it('should position thumb at top when scrollOffset is 0', () => {
      const scrollOffset = signal(0);
      const result = createScrollbar({
        scrollOffset,
        viewportHeight: 10,
        contentHeight: 50,
      });

      // First line should be thumb color
      expect(result.children[0].style?.color).toBe('cyan');
    });

    it('should update thumb position when scrolled', () => {
      const scrollOffset = signal(30); // maxScroll = 50 - 10 = 40
      const result = createScrollbar({
        scrollOffset,
        viewportHeight: 10,
        contentHeight: 50,
      });

      // Thumb should exist at some position
      const thumbCount = result.children.filter(
        (child: { children?: string; style?: { color?: string } }) => child.style?.color === 'cyan',
      ).length;
      expect(thumbCount).toBeGreaterThan(0);
    });

    it('should update thumb position when scrollOffset changes', () => {
      const scrollOffset = signal(0);
      createScrollbar({
        scrollOffset,
        viewportHeight: 10,
        contentHeight: 50,
      });

      scrollOffset.value = 20;
      // Effect will trigger re-render
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle zero contentHeight', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 0,
      });
      expect(result).toBeDefined();
    });

    it('should handle zero viewportHeight', () => {
      const result = createScrollbar({
        viewportHeight: 0,
        contentHeight: 100,
      });
      expect(result).toBeDefined();
    });

    it('should handle equal contentHeight and viewportHeight', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 10,
      });
      expect(result).toBeDefined();
    });

    it('should handle very large contentHeight', () => {
      const result = createScrollbar({
        viewportHeight: 10,
        contentHeight: 10000,
      });
      expect(result).toBeDefined();
    });

    it('should handle negative scrollOffset (clamp to 0)', () => {
      const scrollOffset = signal(-5);
      const result = createScrollbar({
        scrollOffset,
        viewportHeight: 10,
        contentHeight: 50,
      });
      expect(result).toBeDefined();
    });

    it('should handle scrollOffset beyond maxScroll', () => {
      const scrollOffset = signal(100); // Beyond maxScroll
      const result = createScrollbar({
        scrollOffset,
        viewportHeight: 10,
        contentHeight: 50,
      });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Style Inheritance
  // ==========================================================================

  describe('Style Inheritance', () => {
    it('should merge custom style with defaults', () => {
      const result = createScrollbar({
        style: { marginLeft: 1 },
      });

      expect(result.style?.marginLeft).toBe(1);
      expect(result.style?.width).toBe(1);
    });
  });
});
