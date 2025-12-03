import { describe, expect, it, vi } from 'vitest';
import { parseKey } from '../hooks/useInput.js';
import { signal } from '../index';
import { MultiSelect, type MultiSelectOption, handleMultiSelectInput } from './MultiSelect';

// Helper to create parsed key and input
const pk = (input: string) => ({ key: parseKey(input).key, input });

const items: MultiSelectOption[] = [
  { label: 'Item 1', value: 'item1' },
  { label: 'Item 2', value: 'item2' },
  { label: 'Item 3', value: 'item3' },
  { label: 'Item 4', value: 'item4' },
];

describe('MultiSelect', () => {
  it('should create multiselect node with Box component', () => {
    const node = MultiSelect({ items });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should accept selected as array', () => {
    const node = MultiSelect({ items, selected: ['item1', 'item2'] });

    expect(node).toBeDefined();
  });

  it('should accept selected as signal', () => {
    const selected = signal<string[]>(['item1']);
    const node = MultiSelect({ items, selected });

    expect(node).toBeDefined();
  });

  it('should default to empty selection', () => {
    const node = MultiSelect({ items });

    expect(node).toBeDefined();
  });

  it('should generate unique ID if not provided', () => {
    const node1 = MultiSelect({ items });
    const node2 = MultiSelect({ items });

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = MultiSelect({ items, id: 'custom-multiselect' });

    expect(node).toBeDefined();
  });

  it('should accept limit prop', () => {
    const node = MultiSelect({ items, limit: 2 });

    expect(node).toBeDefined();
  });

  it('should accept highlightedIndex signal', () => {
    const highlightedIndex = signal(1);
    const node = MultiSelect({ items, highlightedIndex });

    expect(node).toBeDefined();
  });

  it('should apply custom styles', () => {
    const node = MultiSelect({ items, style: { borderColor: 'green' } });

    expect(node).toBeDefined();
    expect(node.style?.borderColor).toBeDefined();
  });
});

describe('handleMultiSelectInput', () => {
  it('should move highlight up with up key', () => {
    const highlightedIndex = signal(2);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    const handled = handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'up');

    expect(handled).toBe(true);
    expect(highlightedIndex.value).toBe(1);
  });

  it('should move highlight up with k key', () => {
    const highlightedIndex = signal(2);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'k');

    expect(highlightedIndex.value).toBe(1);
  });

  it('should not move highlight before first item', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'up');

    expect(highlightedIndex.value).toBe(0);
  });

  it('should move highlight down with down key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    const handled = handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'down');

    expect(handled).toBe(true);
    expect(highlightedIndex.value).toBe(1);
  });

  it('should move highlight down with j key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'j');

    expect(highlightedIndex.value).toBe(1);
  });

  it('should not move highlight past last item', () => {
    const highlightedIndex = signal(3);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'down');

    expect(highlightedIndex.value).toBe(3);
  });

  it('should toggle selection with space key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    const handled = handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, ' ');

    expect(handled).toBe(true);
    expect(selected.value).toContain('item1');
  });

  it('should toggle selection with space string', () => {
    const highlightedIndex = signal(1);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'space');

    expect(selected.value).toContain('item2');
  });

  it('should deselect already selected item', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>(['item1', 'item2']);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, ' ');

    expect(selected.value).not.toContain('item1');
    expect(selected.value).toContain('item2');
  });

  it('should submit selection with enter key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>(['item1', 'item3']);
    const scrollOffset = signal(0);
    const onSubmit = vi.fn();

    const handled = handleMultiSelectInput(
      highlightedIndex,
      selected,
      scrollOffset,
      items,
      'enter',
      4,
      onSubmit,
    );

    expect(handled).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith(['item1', 'item3']);
  });

  it('should submit selection with return key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>(['item2']);
    const scrollOffset = signal(0);
    const onSubmit = vi.fn();

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'return', 4, onSubmit);

    expect(onSubmit).toHaveBeenCalledWith(['item2']);
  });

  it('should select all with a key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    const handled = handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'a');

    expect(handled).toBe(true);
    expect(selected.value).toEqual(['item1', 'item2', 'item3', 'item4']);
  });

  it('should clear all with c key', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>(['item1', 'item2']);
    const scrollOffset = signal(0);

    const handled = handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'c');

    expect(handled).toBe(true);
    expect(selected.value).toEqual([]);
  });

  it('should scroll down when highlighting beyond visible area', () => {
    const highlightedIndex = signal(1);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);
    const limit = 2;

    // Move to item 2 (index 2), should trigger scroll
    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'down', limit);

    expect(highlightedIndex.value).toBe(2);
    expect(scrollOffset.value).toBe(1);
  });

  it('should scroll up when highlighting before visible area', () => {
    const highlightedIndex = signal(2);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(1);
    const limit = 2;

    // Move to item 1 (index 1), should trigger scroll up
    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'up', limit);

    expect(highlightedIndex.value).toBe(1);
    expect(scrollOffset.value).toBe(1);
  });

  it('should ignore unknown keys', () => {
    const highlightedIndex = signal(1);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);
    const onSubmit = vi.fn();

    const handled = handleMultiSelectInput(
      highlightedIndex,
      selected,
      scrollOffset,
      items,
      'x',
      4,
      onSubmit,
    );

    expect(handled).toBe(false);
    expect(highlightedIndex.value).toBe(1);
    expect(selected.value).toEqual([]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should work without onSubmit callback', () => {
    const highlightedIndex = signal(0);
    const selected = signal<string[]>([]);
    const scrollOffset = signal(0);

    expect(() =>
      handleMultiSelectInput(highlightedIndex, selected, scrollOffset, items, 'enter'),
    ).not.toThrow();
  });

  it('should handle numeric values', () => {
    const numericItems: MultiSelectOption<number>[] = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
      { label: 'Three', value: 3 },
    ];
    const highlightedIndex = signal(0);
    const selected = signal<number[]>([]);
    const scrollOffset = signal(0);

    handleMultiSelectInput(highlightedIndex, selected, scrollOffset, numericItems, ' ');

    expect(selected.value).toContain(1);
  });
});
