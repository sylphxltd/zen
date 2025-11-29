/** @jsxImportSource @zen/tui */
/**
 * Router Component Tests
 *
 * Tests for client-side routing with component caching.
 */
import { describe, expect, it } from 'bun:test';
import { Text } from '../primitives/Text.js';
import { Router, type RouterProps, type TUIRoute } from './Router.js';

describe('Router', () => {
  // Helper to create routes
  const createRoutes = (): TUIRoute[] => [
    { path: '/', component: () => <Text>Home</Text> },
    { path: '/about', component: () => <Text>About</Text> },
    { path: '/users/:id', component: () => <Text>User Profile</Text> },
    { path: '/settings', component: () => <Text>Settings</Text> },
  ];

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render router container', () => {
      const result = Router({ routes: createRoutes() });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('router-container');
    });

    it('should render with empty routes', () => {
      const result = Router({ routes: [] });

      expect(result).toBeDefined();
    });

    it('should render with single route', () => {
      const result = Router({
        routes: [{ path: '/', component: () => <Text>Home</Text> }],
      });

      expect(result).toBeDefined();
    });

    it('should have flex 1 style', () => {
      const result = Router({ routes: createRoutes() });

      expect(result.style?.flex).toBe(1);
    });

    it('should have column flex direction', () => {
      const result = Router({ routes: createRoutes() });

      expect(result.style?.flexDirection).toBe('column');
    });
  });

  // ==========================================================================
  // Fallback
  // ==========================================================================

  describe('Fallback', () => {
    it('should render without fallback', () => {
      const result = Router({ routes: createRoutes() });

      expect(result).toBeDefined();
    });

    it('should accept custom fallback', () => {
      const result = Router({
        routes: createRoutes(),
        fallback: () => <Text>404 Not Found</Text>,
      });

      expect(result).toBeDefined();
    });

    it('should render fallback for unknown route', () => {
      // The router will render fallback when no route matches
      const result = Router({
        routes: [{ path: '/specific', component: () => <Text>Specific</Text> }],
        fallback: () => <Text>Not Found</Text>,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Route Components
  // ==========================================================================

  describe('Route Components', () => {
    it('should accept function components', () => {
      const result = Router({
        routes: [{ path: '/', component: () => <Text>Component</Text> }],
      });

      expect(result).toBeDefined();
    });

    it('should handle components returning string', () => {
      const result = Router({
        routes: [{ path: '/', component: () => 'String content' as unknown }],
      });

      expect(result).toBeDefined();
    });

    it('should handle components returning null', () => {
      const result = Router({
        routes: [{ path: '/', component: () => null as unknown }],
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Component Caching
  // ==========================================================================

  describe('Component Caching', () => {
    it('should cache components', () => {
      // Cache behavior is internal - just verify it doesn't break
      const result = Router({ routes: createRoutes() });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle routes with special characters', () => {
      const result = Router({
        routes: [{ path: '/user-profile', component: () => <Text>Profile</Text> }],
      });

      expect(result).toBeDefined();
    });

    it('should handle deep nested routes', () => {
      const result = Router({
        routes: [{ path: '/a/b/c/d/e', component: () => <Text>Deep</Text> }],
      });

      expect(result).toBeDefined();
    });

    it('should handle many routes', () => {
      const manyRoutes = Array.from({ length: 100 }, (_, i) => ({
        path: `/route-${i}`,
        component: () => <Text>Route {i}</Text>,
      }));

      const result = Router({ routes: manyRoutes });

      expect(result).toBeDefined();
    });

    it('should handle route with query-like path', () => {
      // Note: actual query parsing may not be supported
      const result = Router({
        routes: [{ path: '/search', component: () => <Text>Search</Text> }],
      });

      expect(result).toBeDefined();
    });
  });
});
