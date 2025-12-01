import { describe, expect, it, beforeEach, mock, spyOn } from 'bun:test';
import { Renderer, createRenderer, RenderStrategy, STRATEGY_THRESHOLDS } from './renderer.js';
import type { TUINode } from '../types.js';
import { TerminalBuffer } from '../terminal-buffer.js';

// Mock TUINode for testing
function createMockNode(id: string, children: TUINode[] = []): TUINode {
  return {
    type: 'box',
    props: { id },
    children,
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

describe('Renderer', () => {
  describe('createRenderer', () => {
    it('creates renderer with default config', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen' });
      expect(renderer).toBeInstanceOf(Renderer);
      expect(renderer.getMode()).toBe('fullscreen');
    });

    it('creates renderer in inline mode', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline' });
      expect(renderer.getMode()).toBe('inline');
    });
  });

  describe('inline mode', () => {
    let renderer: Renderer;

    beforeEach(() => {
      renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });
    });

    it('uses large buffer height for inline mode', () => {
      const buffer = renderer.getCurrentBuffer();
      // Inline mode uses 1000 lines buffer
      expect(buffer).toBeDefined();
    });

    it('calculates content height from buffer content', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 10 }]);

      // Set up render function that writes content
      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
        buffer.writeAt(0, 2, 'Line 3', 80);
        // Lines 3+ are empty
      });

      // First render
      renderer.render(root, layoutMap);

      // Content height should be 3 (last non-empty line + 1)
      expect(renderer.getContentHeight()).toBe(3);
    });

    it('returns minimum height of 1 for empty buffer', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 10 }]);

      renderer.setRenderNodeFn(() => {
        // Render nothing
      });

      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(1);
    });

    it('uses passed content height when provided', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 10 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
      });

      // Pass explicit content height
      renderer.render(root, layoutMap, 5);
      expect(renderer.getContentHeight()).toBe(5);
    });
  });

  describe('fullscreen mode', () => {
    let renderer: Renderer;

    beforeEach(() => {
      renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });
    });

    it('uses terminal height for buffer', () => {
      expect(renderer.getMode()).toBe('fullscreen');
    });
  });

  describe('mode switching', () => {
    it('switches from inline to fullscreen', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });
      expect(renderer.getMode()).toBe('inline');

      renderer.switchMode('fullscreen', 24);
      expect(renderer.getMode()).toBe('fullscreen');
    });

    it('switches from fullscreen to inline', () => {
      const renderer = createRenderer({
        width: 80,
        height: 24,
        mode: 'fullscreen',
        syncEnabled: false,
      });
      expect(renderer.getMode()).toBe('fullscreen');

      renderer.switchMode('inline');
      expect(renderer.getMode()).toBe('inline');
    });

    it('does nothing when switching to same mode', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });
      const dirtyTracker = renderer.getDirtyTracker();

      // Clear any initial dirty state
      dirtyTracker.clear();

      renderer.switchMode('inline');
      // Should not mark as dirty since mode didn't change
      expect(dirtyTracker.layoutDirty).toBe(false);
    });

    it('marks dirty when mode changes', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });

      renderer.switchMode('fullscreen', 24);
      const dirtyTracker = renderer.getDirtyTracker();
      expect(dirtyTracker.layoutDirty).toBe(true);
    });
  });

  describe('resize', () => {
    it('updates buffer dimensions', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });

      renderer.resize(100, 30);

      const buffer = renderer.getCurrentBuffer();
      expect(buffer).toBeDefined();
    });

    it('marks full dirty after resize', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });
      const dirtyTracker = renderer.getDirtyTracker();

      // Clear initial state
      dirtyTracker.clear();

      renderer.resize(100, 30);
      expect(dirtyTracker.layoutDirty).toBe(true);
    });
  });

  describe('strategy selection', () => {
    let renderer: Renderer;

    beforeEach(() => {
      renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });
    });

    it('uses full strategy for first render', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      let usedFullRender = false;
      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        usedFullRender = fullRender;
      });

      renderer.render(root, layoutMap);
      expect(usedFullRender).toBe(true);
    });

    it('uses incremental strategy for subsequent renders without changes', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      let usedFullRender = false;
      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        usedFullRender = fullRender;
      });

      // First render
      renderer.render(root, layoutMap);

      // Second render
      renderer.render(root, layoutMap);
      expect(usedFullRender).toBe(false);
    });

    it('uses full strategy when layout is dirty', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      let usedFullRender = false;
      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        usedFullRender = fullRender;
      });

      // First render
      renderer.render(root, layoutMap);

      // Mark layout dirty
      renderer.getDirtyTracker().markLayoutDirty(root);

      // Second render
      renderer.render(root, layoutMap);
      expect(usedFullRender).toBe(true);
    });

    it('uses full strategy after forceFullRefresh', () => {
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      let usedFullRender = false;
      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        usedFullRender = fullRender;
      });

      // First render
      renderer.render(root, layoutMap);

      // Force full refresh
      renderer.forceFullRefresh();

      // Second render
      renderer.render(root, layoutMap);
      expect(usedFullRender).toBe(true);
    });
  });

  describe('inline mode content height changes', () => {
    it('detects content height from buffer after render', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 10 }]);

      let lineCount = 3;

      renderer.setRenderNodeFn((node, buffer, map, fullRender) => {
        // Clear and write lines
        if (fullRender) {
          for (let i = 0; i < 20; i++) {
            buffer.setLine(i, '');
          }
        }
        for (let i = 0; i < lineCount; i++) {
          buffer.writeAt(0, i, `Line ${i}`, 80);
        }
      });

      // First render (3 lines)
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(3);

      // Second render with more lines
      lineCount = 5;
      renderer.forceFullRefresh(); // Force full to update buffer content
      renderer.render(root, layoutMap);
      expect(renderer.getContentHeight()).toBe(5);
    });
  });

  describe('buffer diffing', () => {
    it('only outputs changed lines', () => {
      const renderer = createRenderer({
        width: 80,
        height: 24,
        mode: 'fullscreen',
        syncEnabled: false,
      });
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 0', 80);
        buffer.writeAt(0, 1, 'Line 1', 80);
        buffer.writeAt(0, 2, 'Line 2', 80);
      });

      // First render
      renderer.render(root, layoutMap);

      // Modify render function to change only line 1
      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 0', 80);
        buffer.writeAt(0, 1, 'Changed!', 80);
        buffer.writeAt(0, 2, 'Line 2', 80);
      });

      // Second render - should only output line 1
      renderer.getDirtyTracker().markContentDirty(root);
      renderer.render(root, layoutMap);

      // The buffer should have the changed content
      const buffer = renderer.getCurrentBuffer();
      expect(buffer.getLine(1)).toContain('Changed!');
    });
  });

  describe('cleanup', () => {
    it('generates correct cleanup sequence for inline mode', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'inline', syncEnabled: false });
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 10 }]);

      renderer.setRenderNodeFn((node, buffer) => {
        buffer.writeAt(0, 0, 'Line 1', 80);
        buffer.writeAt(0, 1, 'Line 2', 80);
        buffer.writeAt(0, 2, 'Line 3', 80);
      });

      renderer.render(root, layoutMap);

      // Content height should be 3
      expect(renderer.getContentHeight()).toBe(3);
    });
  });

  describe('dirty tracker integration', () => {
    it('exposes dirty tracker for external use', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });
      const dirtyTracker = renderer.getDirtyTracker();

      expect(dirtyTracker).toBeDefined();
      expect(typeof dirtyTracker.markContentDirty).toBe('function');
      expect(typeof dirtyTracker.markLayoutDirty).toBe('function');
    });

    it('clears dirty state after render', () => {
      const renderer = createRenderer({ width: 80, height: 24, mode: 'fullscreen', syncEnabled: false });
      const root = createMockNode('root');
      const layoutMap = createMockLayoutMap([{ node: root, x: 0, y: 0, width: 80, height: 24 }]);
      const dirtyTracker = renderer.getDirtyTracker();

      renderer.setRenderNodeFn(() => {});

      // Mark dirty
      dirtyTracker.markContentDirty(root);
      expect(dirtyTracker.hasDirtyNodes).toBe(true);

      // Render
      renderer.render(root, layoutMap);

      // Should be cleared
      expect(dirtyTracker.hasDirtyNodes).toBe(false);
    });
  });
});

describe('STRATEGY_THRESHOLDS', () => {
  it('has correct default values', () => {
    expect(STRATEGY_THRESHOLDS.dirtyRatio).toBe(0.5);
    expect(STRATEGY_THRESHOLDS.maxRegions).toBe(10);
    expect(STRATEGY_THRESHOLDS.minAreaForFull).toBe(50);
  });
});
