import { describe, expect, it } from 'vitest';
import { Static } from './Static';
import { Text } from './Text';

describe('Static', () => {
  it('should create static node with empty items', () => {
    const node = Static({ items: [], children: () => 'item' });

    expect(node.type).toBe('box');
    expect(node.tagName).toBe('static');
    expect(node.children).toEqual([]);
  });

  it('should render items using children function', () => {
    const items = ['a', 'b', 'c'];
    const node = Static({
      items,
      children: (item) => item,
    });

    expect(node.children).toHaveLength(3);
    expect(node.children[0]).toBe('a');
    expect(node.children[1]).toBe('b');
    expect(node.children[2]).toBe('c');
  });

  it('should pass index to children function', () => {
    const items = ['x', 'y'];
    const indices: number[] = [];

    Static({
      items,
      children: (_item, index) => {
        indices.push(index);
        return 'item';
      },
    });

    expect(indices).toEqual([0, 1]);
  });

  it('should handle complex item types', () => {
    interface LogEntry {
      time: string;
      level: string;
      message: string;
    }

    const items: LogEntry[] = [
      { time: '10:00:00', level: 'INFO', message: 'Server started' },
      { time: '10:00:01', level: 'ERROR', message: 'Connection failed' },
    ];

    const node = Static({
      items,
      children: (entry) =>
        Text({
          children: `[${entry.time}] ${entry.level} - ${entry.message}`,
        }),
    });

    expect(node.children).toHaveLength(2);
    expect(node.children[0]).toMatchObject({
      type: 'text',
    });
  });

  it('should apply style prop', () => {
    const node = Static({
      items: ['a'],
      children: (item) => item,
      style: { padding: 1 },
    });

    expect(node.style?.padding).toBe(1);
  });

  it('should handle empty children function return', () => {
    const items = [1, 2, 3];
    const node = Static({
      items,
      children: (_item) => '',
    });

    expect(node.children).toHaveLength(3);
    expect(node.children.every((child) => child === '')).toBe(true);
  });

  it('should render items statically without reactivity', () => {
    const items = ['a', 'b'];
    let renderCount = 0;

    const node = Static({
      items,
      children: (item) => {
        renderCount++;
        return item;
      },
    });

    // Items should be rendered once during creation
    expect(renderCount).toBe(2);
    expect(node.children).toHaveLength(2);

    // Accessing children again should not trigger re-render
    const _children = node.children;
    expect(renderCount).toBe(2);
  });
});
