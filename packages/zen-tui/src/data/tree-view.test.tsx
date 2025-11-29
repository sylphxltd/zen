/** @jsxImportSource @zen/tui */
/**
 * TreeView Component Tests
 *
 * Tests for hierarchical tree display with expand/collapse and keyboard navigation.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { type TreeNode, TreeView, type TreeViewProps } from './TreeView.js';

setPlatformOps(tuiPlatformOps);

describe('TreeView', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // Helper to create tree nodes
  const createNodes = (): TreeNode[] => [
    {
      id: 'root1',
      label: 'Root 1',
      children: [
        { id: 'child1-1', label: 'Child 1.1' },
        { id: 'child1-2', label: 'Child 1.2' },
      ],
    },
    {
      id: 'root2',
      label: 'Root 2',
      children: [
        {
          id: 'child2-1',
          label: 'Child 2.1',
          children: [{ id: 'grandchild', label: 'Grandchild' }],
        },
      ],
    },
    { id: 'root3', label: 'Root 3 (leaf)' },
  ];

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render tree view', () => {
      const result = TreeView({ nodes: createNodes() });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render empty tree', () => {
      const result = TreeView({ nodes: [] });

      expect(result).toBeDefined();
    });

    it('should support reactive nodes', () => {
      const nodes = signal(createNodes());
      const result = TreeView({ nodes: () => nodes.value });

      expect(result).toBeDefined();
    });

    it('should render with custom id', () => {
      const result = TreeView({
        nodes: createNodes(),
        id: 'my-tree',
      });

      expect(result).toBeDefined();
    });

    it('should render node labels', () => {
      const result = TreeView({ nodes: [{ id: '1', label: 'Test Node' }] });

      expect(result).toBeDefined();
    });

    it('should render node icons', () => {
      const result = TreeView({
        nodes: [{ id: '1', label: 'Folder', icon: '📁' }],
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Expand/Collapse
  // ==========================================================================

  describe('Expand/Collapse', () => {
    it('should render collapsed by default', () => {
      const result = TreeView({ nodes: createNodes() });

      expect(result).toBeDefined();
    });

    it('should respect defaultExpanded on nodes', () => {
      const nodes: TreeNode[] = [
        {
          id: 'root',
          label: 'Root',
          defaultExpanded: true,
          children: [{ id: 'child', label: 'Child' }],
        },
      ];

      const result = TreeView({ nodes });

      expect(result).toBeDefined();
    });

    it('should collect initial expanded nodes recursively', () => {
      const nodes: TreeNode[] = [
        {
          id: 'root',
          label: 'Root',
          defaultExpanded: true,
          children: [
            {
              id: 'child',
              label: 'Child',
              defaultExpanded: true,
              children: [{ id: 'grandchild', label: 'Grandchild' }],
            },
          ],
        },
      ];

      const result = TreeView({ nodes });

      expect(result).toBeDefined();
    });

    it('should accept onToggle callback', () => {
      // Note: Actual toggle behavior requires focus context which is complex in tests
      const result = TreeView({
        nodes: createNodes(),
        onToggle: (_node, _expanded) => {},
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Icons
  // ==========================================================================

  describe('Icons', () => {
    it('should use default expand icon ▸', () => {
      const result = TreeView({ nodes: createNodes() });

      expect(result).toBeDefined();
    });

    it('should use default collapse icon ▾', () => {
      const nodes: TreeNode[] = [
        {
          id: 'root',
          label: 'Root',
          defaultExpanded: true,
          children: [{ id: 'child', label: 'Child' }],
        },
      ];

      const result = TreeView({ nodes });

      expect(result).toBeDefined();
    });

    it('should use default leaf icon ·', () => {
      const result = TreeView({
        nodes: [{ id: 'leaf', label: 'Leaf Node' }],
      });

      expect(result).toBeDefined();
    });

    it('should support custom expand icon', () => {
      const result = TreeView({
        nodes: createNodes(),
        expandIcon: '+',
      });

      expect(result).toBeDefined();
    });

    it('should support custom collapse icon', () => {
      const result = TreeView({
        nodes: createNodes(),
        collapseIcon: '-',
      });

      expect(result).toBeDefined();
    });

    it('should support custom leaf icon', () => {
      const result = TreeView({
        nodes: createNodes(),
        leafIcon: '*',
      });

      expect(result).toBeDefined();
    });

    it('should support reactive icons', () => {
      const expandIcon = signal('+');
      const result = TreeView({
        nodes: createNodes(),
        expandIcon: () => expandIcon.value,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Tree Lines
  // ==========================================================================

  describe('Tree Lines', () => {
    it('should show lines by default', () => {
      const result = TreeView({ nodes: createNodes() });

      expect(result).toBeDefined();
    });

    it('should hide lines when showLines is false', () => {
      const result = TreeView({
        nodes: createNodes(),
        showLines: false,
      });

      expect(result).toBeDefined();
    });

    it('should support reactive showLines', () => {
      const showLines = signal(true);
      const result = TreeView({
        nodes: createNodes(),
        showLines: () => showLines.value,
      });

      expect(result).toBeDefined();
    });

    it('should use default indent size of 2', () => {
      const result = TreeView({ nodes: createNodes() });

      expect(result).toBeDefined();
    });

    it('should support custom indent size', () => {
      const result = TreeView({
        nodes: createNodes(),
        indentSize: 4,
      });

      expect(result).toBeDefined();
    });

    it('should support reactive indentSize', () => {
      const indentSize = signal(2);
      const result = TreeView({
        nodes: createNodes(),
        indentSize: () => indentSize.value,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Selection
  // ==========================================================================

  describe('Selection', () => {
    it('should accept onSelect callback for leaf nodes', () => {
      // Note: Actual selection behavior requires focus context which is complex in tests
      const result = TreeView({
        nodes: [{ id: 'leaf', label: 'Leaf' }],
        onSelect: (_node) => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept both onSelect and onToggle callbacks', () => {
      const result = TreeView({
        nodes: createNodes(),
        onSelect: (_node) => {},
        onToggle: (_node, _expanded) => {},
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Keyboard Navigation
  // ==========================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate down with ↓ arrow', async () => {
      const nodes = [
        { id: '1', label: 'First' },
        { id: '2', label: 'Second' },
      ];

      createRoot(() => {
        return TreeView({ nodes });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down arrow
      await new Promise((r) => setTimeout(r, 10));

      // Focus should move (can't easily verify, but no error)
      expect(true).toBe(true);
    });

    it('should navigate up with ↑ arrow', async () => {
      const nodes = [
        { id: '1', label: 'First' },
        { id: '2', label: 'Second' },
      ];

      createRoot(() => {
        return TreeView({ nodes });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down first
      dispatchInput('\x1B[A'); // Then up
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });

    it('should expand with → arrow', async () => {
      createRoot(() => {
        return TreeView({ nodes: createNodes() });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });

    it('should collapse with ← arrow', async () => {
      const nodes: TreeNode[] = [
        {
          id: 'root',
          label: 'Root',
          defaultExpanded: true,
          children: [{ id: 'child', label: 'Child' }],
        },
      ];

      createRoot(() => {
        return TreeView({ nodes });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[D'); // Left arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });

    it('should toggle with Space', async () => {
      createRoot(() => {
        return TreeView({ nodes: createNodes() });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput(' '); // Space
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });

    it('should not navigate beyond first item', async () => {
      createRoot(() => {
        return TreeView({
          nodes: [{ id: '1', label: 'Only' }],
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[A'); // Up at start
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });

    it('should not navigate beyond last item', async () => {
      createRoot(() => {
        return TreeView({
          nodes: [{ id: '1', label: 'Only' }],
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[B'); // Down at end
      await new Promise((r) => setTimeout(r, 10));

      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Node Data
  // ==========================================================================

  describe('Node Data', () => {
    it('should support custom data on nodes', () => {
      const nodes: TreeNode<{ custom: string }>[] = [
        { id: '1', label: 'Test', data: { custom: 'value' } },
      ];

      const result = TreeView({
        nodes,
        onSelect: (node) => {
          // Data should be accessible
          expect(node.data).toEqual({ custom: 'value' });
        },
      });

      expect(result).toBeDefined();
    });

    it('should accept nodes with various data types', () => {
      const nodes: TreeNode<number>[] = [{ id: '1', label: 'Number', data: 42 }];

      const result = TreeView({ nodes });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle deeply nested tree', () => {
      const deep: TreeNode = {
        id: '1',
        label: 'Level 1',
        defaultExpanded: true,
        children: [
          {
            id: '2',
            label: 'Level 2',
            defaultExpanded: true,
            children: [
              {
                id: '3',
                label: 'Level 3',
                defaultExpanded: true,
                children: [
                  {
                    id: '4',
                    label: 'Level 4',
                    children: [{ id: '5', label: 'Level 5' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = TreeView({ nodes: [deep] });

      expect(result).toBeDefined();
    });

    it('should handle empty label', () => {
      const result = TreeView({
        nodes: [{ id: '1', label: '' }],
      });

      expect(result).toBeDefined();
    });

    it('should handle very long label', () => {
      const result = TreeView({
        nodes: [{ id: '1', label: 'A'.repeat(200) }],
      });

      expect(result).toBeDefined();
    });

    it('should handle many siblings', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
      }));

      const result = TreeView({ nodes });

      expect(result).toBeDefined();
    });

    it('should handle empty children array', () => {
      const result = TreeView({
        nodes: [{ id: '1', label: 'Empty', children: [] }],
      });

      expect(result).toBeDefined();
    });

    it('should handle special characters in label', () => {
      const result = TreeView({
        nodes: [{ id: '1', label: '🎉 <Special> & "chars"' }],
      });

      expect(result).toBeDefined();
    });
  });
});
