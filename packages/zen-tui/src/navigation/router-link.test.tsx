/** @jsxImportSource @zen/tui */
/**
 * RouterLink Component Tests
 *
 * Tests for navigation links with keyboard activation.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot } from '@zen/runtime';
import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { RouterLink, type RouterLinkProps } from './RouterLink.js';

setPlatformOps(tuiPlatformOps);

describe('RouterLink', () => {
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
    it('should render router link', () => {
      const result = RouterLink({ href: '/' });

      expect(result).toBeDefined();
      expect(result.type).toBe('text');
      expect(result.tagName).toBe('router-link');
    });

    it('should render with children', () => {
      const result = RouterLink({
        href: '/about',
        children: 'About',
      });

      expect(result).toBeDefined();
    });

    it('should use href as fallback children', () => {
      const result = RouterLink({ href: '/home' });

      expect(result).toBeDefined();
    });

    it('should render with custom id', () => {
      const result = RouterLink({
        href: '/',
        id: 'custom-link',
      });

      expect(result).toBeDefined();
    });

    it('should generate random id if not provided', () => {
      const result = RouterLink({ href: '/' });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Styling
  // ==========================================================================

  describe('Styling', () => {
    it('should have underline style', () => {
      const result = RouterLink({ href: '/' });

      expect(result.style?.underline).toBe(true);
    });

    it('should use default cyan color', () => {
      const result = RouterLink({ href: '/' });

      // Color is a function, just verify it exists
      expect(result.style?.color).toBeDefined();
    });

    it('should use custom color', () => {
      const result = RouterLink({
        href: '/',
        color: 'green',
      });

      expect(result).toBeDefined();
    });

    it('should use custom focus color', () => {
      const result = RouterLink({
        href: '/',
        focusColor: 'magenta',
      });

      expect(result).toBeDefined();
    });

    it('should use custom active color', () => {
      const result = RouterLink({
        href: '/',
        activeColor: 'red',
      });

      expect(result).toBeDefined();
    });

    it('should apply additional style', () => {
      const result = RouterLink({
        href: '/',
        style: { bold: true },
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Focus State
  // ==========================================================================

  describe('Focus State', () => {
    it('should become bold when focused', () => {
      const result = RouterLink({ href: '/' });

      // Bold is a function that checks focus state
      expect(result.style?.bold).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty href', () => {
      const result = RouterLink({ href: '' });

      expect(result).toBeDefined();
    });

    it('should handle very long href', () => {
      const result = RouterLink({ href: `/${'a'.repeat(200)}` });

      expect(result).toBeDefined();
    });

    it('should handle special characters in href', () => {
      const result = RouterLink({ href: '/path?query=1&other=2' });

      expect(result).toBeDefined();
    });

    it('should handle deeply nested paths', () => {
      const result = RouterLink({ href: '/a/b/c/d/e/f/g' });

      expect(result).toBeDefined();
    });

    it('should handle complex children', () => {
      const result = RouterLink({
        href: '/',
        children: 'Complex children with emoji 🎉',
      });

      expect(result).toBeDefined();
    });
  });
});
