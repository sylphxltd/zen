import { describe, expect, it } from 'vitest';
import type { TUINode } from '../types';
import { Box } from './Box';

describe('Box', () => {
  it('should create box node with default props', () => {
    const node = Box({});

    expect(node.type).toBe('box');
    expect(node.tagName).toBe('box');
    expect(node.children).toEqual([]);
    expect(node.style).toEqual({});
  });

  it('should apply style props', () => {
    const style = {
      width: 80,
      height: 20,
      borderStyle: 'single' as const,
      padding: 1,
    };
    const node = Box({ style });

    expect(node.style).toEqual(style);
  });

  it('should handle string children', () => {
    const node = Box({ children: 'Hello' });

    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe('Hello');
  });

  it('should handle array of children', () => {
    const child1: TUINode = {
      type: 'text',
      tagName: 'text',
      props: {},
      children: ['Hello'],
      style: {},
    };
    const child2: TUINode = {
      type: 'text',
      tagName: 'text',
      props: {},
      children: ['World'],
      style: {},
    };

    const node = Box({ children: [child1, child2] });

    expect(node.children).toHaveLength(2);
    expect(node.children[0]).toBe(child1);
    expect(node.children[1]).toBe(child2);
  });

  it('should handle nested Box components', () => {
    const innerBox = Box({ children: 'Inner' });
    const outerBox = Box({ children: innerBox });

    expect(outerBox.children).toHaveLength(1);
    expect(outerBox.children[0]).toBe(innerBox);
  });

  it('should handle flexDirection style', () => {
    const node = Box({ style: { flexDirection: 'row' } });

    expect(node.style?.flexDirection).toBe('row');
  });

  it('should handle border styles', () => {
    const node = Box({
      style: {
        borderStyle: 'round',
        borderColor: 'cyan',
      },
    });

    expect(node.style?.borderStyle).toBe('round');
    expect(node.style?.borderColor).toBe('cyan');
  });

  it('should handle padding styles', () => {
    const node = Box({
      style: {
        padding: 2,
        paddingX: 3,
        paddingY: 1,
      },
    });

    expect(node.style?.padding).toBe(2);
    expect(node.style?.paddingX).toBe(3);
    expect(node.style?.paddingY).toBe(1);
  });

  it('should handle background color', () => {
    const node = Box({ style: { backgroundColor: 'blue' } });

    expect(node.style?.backgroundColor).toBe('blue');
  });

  it('should handle flexbox properties', () => {
    const node = Box({
      style: {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: 'auto',
      },
    });

    expect(node.style?.flexGrow).toBe(1);
    expect(node.style?.flexShrink).toBe(0);
    expect(node.style?.flexBasis).toBe('auto');
  });
});
