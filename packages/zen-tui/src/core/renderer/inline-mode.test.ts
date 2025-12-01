/**
 * Inline Mode Tests
 *
 * Tests for inline mode rendering behavior:
 * - Content height calculation from buffer (not layout)
 * - Cursor positioning on exit
 * - No alternate screen exit in inline mode
 */

import { describe, expect, it, beforeEach } from 'bun:test';
import { Renderer, createRenderer } from './renderer.js';
import type { TUINode } from '../types.js';

// Mock TUINode
function createMockNode(id: string): TUINode {
  return {
    type: 'box',
    props: { id },
    children: [],
    style: {},
  } as TUINode;
}

// Mock LayoutMap
function createMockLayoutMap(
  entries: Array<{ node: TUINode; x: number; y: number; width: number; height: number }>
): Map<TUINode, { x: number; y: number; width: number; height: number }> {
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.node, {
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
    });
  }
  return map;
}

describe('Inline Mode Content Height', () => {
  let renderer: Renderer;

  beforeEach(() => {
    renderer = createRenderer({
      width: 80,
      height: 24,
      mode: 'inline',
      syncEnabled: false,
    });
  });

  describe('content height calculation', () => {
    it('calculates height from actual buffer content, not layout', () => {
      const root = createMockNode('root');
      // Layout says 1000 height (like flex: 1 container)
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 1000 }]);

      // But only render 5 lines of content
      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
        buffer.writeAt(0, 2, 'Line 3', 80);
        buffer.writeAt(0, 3, 'Line 4', 80);
        buffer.writeAt(0, 4, 'Line 5', 80);
      });

      // Don't pass content height - let renderer calculate it
      renderer.render(root, layoutMap);

      // Should be 5, not 1000
      expect(renderer.getContentHeight()).toBe(5);
    });

    it('handles single line content', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Single line', 80);
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(1);
    });

    it('handles empty buffer with minimum height of 1', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      renderer.setRenderNodeFn(() => {
        // Render nothing
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(1);
    });

    it('ignores whitespace-only lines at end', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Content', 80);
        buffer.writeAt(0, 1, 'More content', 80);
        buffer.writeAt(0, 2, '   ', 80); // Whitespace only
        buffer.writeAt(0, 3, '', 80); // Empty
      });

      renderer.render(root, layoutMap);
      // Should be 2, ignoring trailing whitespace
      expect(renderer.getContentHeight()).toBe(2);
    });

    it('includes lines with only spaces if followed by content', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, '   ', 80); // Whitespace
        buffer.writeAt(0, 2, 'Line 3', 80); // Content after whitespace
      });

      renderer.render(root, layoutMap);
      // Should be 3, including the whitespace line
      expect(renderer.getContentHeight()).toBe(3);
    });
  });

  describe('content height with explicit height parameter', () => {
    it('uses explicit height when passed (for fullscreen mode)', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
      });

      // Pass explicit height of 10
      renderer.render(root, layoutMap, 10);

      // Should use the passed value
      expect(renderer.getContentHeight()).toBe(10);
    });
  });

  describe('content height changes', () => {
    it('detects height increase after full render', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      let lineCount = 2;

      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        if (fullRender) {
          // Clear buffer on full render
          for (let i = 0; i < 20; i++) {
            buffer.setLine(i, '');
          }
        }
        for (let i = 0; i < lineCount; i++) {
          buffer.writeAt(0, i, `Line ${i}`, 80);
        }
      });

      // First render: 2 lines
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(2);

      // Second render: 5 lines (height increased)
      lineCount = 5;
      renderer.forceFullRefresh();
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(5);
    });

    it('detects height decrease after full render', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 100 }]);

      let lineCount = 5;

      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        // Clear buffer first for accurate test
        if (fullRender) {
          for (let i = 0; i < 20; i++) {
            buffer.setLine(i, '');
          }
        }
        for (let i = 0; i < lineCount; i++) {
          buffer.writeAt(0, i, `Line ${i}`, 80);
        }
      });

      // First render: 5 lines
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(5);

      // Second render: 2 lines (height decreased)
      lineCount = 2;
      renderer.forceFullRefresh();
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(2);
    });
  });

  describe('large content height values', () => {
    it('handles typical questionnaire form height (~40 lines)', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 1000 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        // Simulate a form with ~40 lines
        for (let i = 0; i < 40; i++) {
          buffer.writeAt(0, i, `Form line ${i}`, 80);
        }
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(40);
    });

    it('handles very long content', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 1000 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        // Simulate scrollable content with 200 lines
        for (let i = 0; i < 200; i++) {
          buffer.writeAt(0, i, `Line ${i}`, 80);
        }
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(200);
    });
  });
});

describe('Inline Mode vs Fullscreen Mode', () => {
  describe('mode-specific behavior', () => {
    it('inline mode calculates content height from buffer', () => {
      const inlineRenderer = createRenderer({
        width: 80,
        height: 24,
        mode: 'inline',
        syncEnabled: false,
      });

      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 1000 }]);

      inlineRenderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
        buffer.writeAt(0, 2, 'Line 3', 80);
      });

      inlineRenderer.render(root, layoutMap);
      // Should calculate from buffer content
      expect(inlineRenderer.getContentHeight()).toBe(3);
    });

    it('fullscreen mode renders to fixed height buffer', () => {
      const fullscreenRenderer = createRenderer({
        width: 80,
        height: 24,
        mode: 'fullscreen',
        syncEnabled: false,
      });

      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      fullscreenRenderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
        buffer.writeAt(0, 2, 'Line 3', 80);
      });

      // Pass explicit height (from layout)
      fullscreenRenderer.render(root, layoutMap, 24);
      // Fullscreen mode uses absolute positioning, content height tracks what's rendered
      expect(fullscreenRenderer.getMode()).toBe('fullscreen');
    });
  });

  describe('mode switching preserves correct behavior', () => {
    it('switching from fullscreen to inline uses buffer calculation', () => {
      const renderer = createRenderer({
        width: 80,
        height: 24,
        mode: 'fullscreen',
        syncEnabled: false,
      });

      // Switch to inline mode
      renderer.switchMode('inline');

      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 1000 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Inline content', 80);
        buffer.writeAt(0, 1, 'More content', 80);
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(2);
    });
  });
});
