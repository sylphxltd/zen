/**
 * TreeView component for TUI
 *
 * Displays hierarchical data in a tree structure with expand/collapse,
 * keyboard navigation, and optional selection.
 */

import { type MaybeReactive, type Signal, resolve, signal } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

/** Tree node data structure */
export interface TreeNode<T = unknown> {
  /** Unique identifier for this node */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Child nodes */
  children?: TreeNode<T>[];
  /** Custom data associated with this node */
  data?: T;
  /** Whether this node is initially expanded (default: false) */
  defaultExpanded?: boolean;
}

export interface TreeViewProps<T = unknown> {
  /** Root nodes of the tree - supports MaybeReactive */
  nodes: MaybeReactive<TreeNode<T>[]>;
  /** Callback when a node is selected (Enter key) */
  onSelect?: (node: TreeNode<T>) => void;
  /** Callback when a node is expanded/collapsed */
  onToggle?: (node: TreeNode<T>, expanded: boolean) => void;
  /** Component ID for focus management */
  id?: string;
  /** Whether to show lines connecting nodes (default: true) - supports MaybeReactive */
  showLines?: MaybeReactive<boolean>;
  /** Indent size per level (default: 2) - supports MaybeReactive */
  indentSize?: MaybeReactive<number>;
  /** Custom expand/collapse icons - supports MaybeReactive */
  expandIcon?: MaybeReactive<string>;
  collapseIcon?: MaybeReactive<string>;
  leafIcon?: MaybeReactive<string>;
}

/** Internal flat representation of tree for rendering */
interface FlatNode<T> {
  node: TreeNode<T>;
  level: number;
  isLast: boolean;
  parentIsLast: boolean[];
}

export function TreeView<T = unknown>(props: TreeViewProps<T>): TUINode {
  const id = props.id || `tree-${Math.random().toString(36).slice(2, 9)}`;

  // Resolve reactive options
  const getShowLines = () => resolve(props.showLines) !== false;
  const getIndentSize = () => resolve(props.indentSize) || 2;
  // Use consistent-width icons (all width=1) to prevent layout shifts
  const getExpandIcon = () => resolve(props.expandIcon) || '▸';
  const getCollapseIcon = () => resolve(props.collapseIcon) || '▾';
  const getLeafIcon = () => resolve(props.leafIcon) || '·';
  const getNodes = () => resolve(props.nodes);

  // Track expanded state for all nodes
  const expandedNodes = signal<Set<string>>(new Set(collectInitialExpanded(getNodes())));

  // Currently focused node index (in flat list)
  const focusedIndex = signal(0);

  // Flatten tree for rendering
  const flattenTree = (): FlatNode<T>[] => {
    const result: FlatNode<T>[] = [];
    const nodes = getNodes();

    const flatten = (treeNodes: TreeNode<T>[], level: number, parentIsLast: boolean[]) => {
      treeNodes.forEach((node, index) => {
        const isLast = index === treeNodes.length - 1;
        result.push({
          node,
          level,
          isLast,
          parentIsLast: [...parentIsLast],
        });

        // If expanded and has children, recurse
        if (node.children && expandedNodes.value.has(node.id)) {
          flatten(node.children, level + 1, [...parentIsLast, isLast]);
        }
      });
    };

    flatten(nodes, 0, []);
    return result;
  };

  // Toggle expanded state for a node
  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes.value);
    const isExpanded = newExpanded.has(nodeId);

    if (isExpanded) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }

    expandedNodes.value = newExpanded;

    // Find node and trigger callback
    const node = findNode(getNodes(), nodeId);
    if (node) {
      props.onToggle?.(node, !isExpanded);
    }
  };

  // Focus management
  const { isFocused } = useFocus({
    id,
    isActive: true,
  });

  // Keyboard navigation
  useInput((input, key) => {
    if (!isFocused.value) return;

    const flatNodes = flattenTree();
    if (flatNodes.length === 0) return;

    // Up/Down navigation
    if (key.upArrow) {
      focusedIndex.value = Math.max(0, focusedIndex.value - 1);
      return;
    }

    if (key.downArrow) {
      focusedIndex.value = Math.min(flatNodes.length - 1, focusedIndex.value + 1);
      return;
    }

    const currentNode = flatNodes[focusedIndex.value];
    if (!currentNode) return;

    // Right arrow - expand
    if (key.rightArrow) {
      if (currentNode.node.children && !expandedNodes.value.has(currentNode.node.id)) {
        toggleExpand(currentNode.node.id);
      }
      return;
    }

    // Left arrow - collapse or go to parent
    if (key.leftArrow) {
      if (currentNode.node.children && expandedNodes.value.has(currentNode.node.id)) {
        toggleExpand(currentNode.node.id);
      } else if (currentNode.level > 0) {
        // Find parent node index
        for (let i = focusedIndex.value - 1; i >= 0; i--) {
          if (flatNodes[i].level < currentNode.level) {
            focusedIndex.value = i;
            break;
          }
        }
      }
      return;
    }

    // Enter - select or toggle
    if (key.return) {
      if (currentNode.node.children) {
        toggleExpand(currentNode.node.id);
      } else {
        props.onSelect?.(currentNode.node);
      }
      return;
    }

    // Space - toggle expand/collapse
    if (input === ' ' && currentNode.node.children) {
      toggleExpand(currentNode.node.id);
    }
  });

  // Render a single tree row
  const renderRow = (flatNode: FlatNode<T>, index: number) => {
    const { node, level, isLast, parentIsLast } = flatNode;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.value.has(node.id);
    const isCurrentlyFocused = isFocused.value && focusedIndex.value === index;

    const showLines = getShowLines();
    const indentSize = getIndentSize();
    const expandIcon = getExpandIcon();
    const collapseIcon = getCollapseIcon();
    const leafIcon = getLeafIcon();

    // Build prefix with tree lines
    let prefix = '';
    if (showLines) {
      for (let i = 0; i < level; i++) {
        prefix += parentIsLast[i] ? '  ' : '│ ';
      }
      prefix += isLast ? '└─' : '├─';
    } else {
      prefix = ' '.repeat(level * indentSize);
    }

    // Expand/collapse icon
    const icon = hasChildren ? (isExpanded ? collapseIcon : expandIcon) : leafIcon;

    return Box({
      style: {
        flexDirection: 'row',
        backgroundColor: isCurrentlyFocused ? 'cyan' : undefined,
      },
      children: [
        // Tree structure prefix (with lines)
        Text({
          children: prefix,
          dim: true,
        }),
        // Expand/collapse icon
        Text({
          children: `${icon} `,
          color: hasChildren ? 'yellow' : 'gray',
        }),
        // Node icon (if provided)
        node.icon
          ? Text({
              children: `${node.icon} `,
            })
          : null,
        // Node label
        Text({
          children: node.label,
          color: isCurrentlyFocused ? 'white' : undefined,
          bold: isCurrentlyFocused || hasChildren,
        }),
      ].filter(Boolean),
    });
  };

  // Main render
  return Box({
    style: {
      flexDirection: 'column',
    },
    children: () => {
      const flatNodes = flattenTree();
      return flatNodes.map((flatNode, index) => renderRow(flatNode, index));
    },
  });
}

/** Collect initially expanded node IDs */
function collectInitialExpanded<T>(nodes: TreeNode<T>[]): string[] {
  const expanded: string[] = [];

  const collect = (nodes: TreeNode<T>[]) => {
    for (const node of nodes) {
      if (node.defaultExpanded) {
        expanded.push(node.id);
      }
      if (node.children) {
        collect(node.children);
      }
    }
  };

  collect(nodes);
  return expanded;
}

/** Find a node by ID in the tree */
function findNode<T>(nodes: TreeNode<T>[], id: string): TreeNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
