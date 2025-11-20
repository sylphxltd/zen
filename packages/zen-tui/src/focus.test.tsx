import { describe, expect, it } from 'vitest';
import { FocusProvider, useFocusContext, useFocusable } from './focus';
import { signal } from './index';

describe('FocusProvider', () => {
  it('should create a focus provider node', () => {
    const node = FocusProvider({ children: 'test' });

    expect(node.type).toBe('component');
    expect(node.tagName).toBe('FocusContext.Provider');
    expect(node.props).toHaveProperty('value');
    expect(node.props).toHaveProperty('children');
  });

  it('should provide focus context value', () => {
    const node = FocusProvider({ children: 'test' });
    const contextValue = node.props.value;

    expect(contextValue).toHaveProperty('focusedId');
    expect(contextValue).toHaveProperty('items');
    expect(contextValue).toHaveProperty('register');
    expect(contextValue).toHaveProperty('focus');
    expect(contextValue).toHaveProperty('focusNext');
    expect(contextValue).toHaveProperty('focusPrev');
  });

  it('should initialize with null focusedId', () => {
    const node = FocusProvider({ children: 'test' });
    const contextValue = node.props.value;

    expect(contextValue.focusedId.value).toBeNull();
  });

  it('should initialize with empty items array', () => {
    const node = FocusProvider({ children: 'test' });
    const contextValue = node.props.value;

    expect(contextValue.items.value).toEqual([]);
  });
});

describe('Focus Management', () => {
  it('should register focusable items', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    const unregister = ctx.register({ id: 'item1' });

    expect(ctx.items.value).toHaveLength(1);
    expect(ctx.items.value[0].id).toBe('item1');

    unregister();
  });

  it('should auto-focus first registered item', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });

    expect(ctx.focusedId.value).toBe('item1');
  });

  it('should not change focus when registering second item', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });

    expect(ctx.focusedId.value).toBe('item1');
  });

  it('should unregister items', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    const unregister1 = ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });

    expect(ctx.items.value).toHaveLength(2);

    unregister1();

    expect(ctx.items.value).toHaveLength(1);
    expect(ctx.items.value[0].id).toBe('item2');
  });

  it('should clear focusedId when unregistering focused item', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    const unregister1 = ctx.register({ id: 'item1' });

    expect(ctx.focusedId.value).toBe('item1');

    unregister1();

    expect(ctx.focusedId.value).toBeNull();
  });

  it('should call onFocus callback when item is focused', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    let focusCalled = false;
    ctx.register({
      id: 'item1',
      onFocus: () => {
        focusCalled = true;
      },
    });

    expect(focusCalled).toBe(true);
  });

  it('should call onBlur callback when item loses focus', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    let blurCalled = false;
    ctx.register({
      id: 'item1',
      onBlur: () => {
        blurCalled = true;
      },
    });
    ctx.register({ id: 'item2' });

    ctx.focus('item2');

    expect(blurCalled).toBe(true);
  });

  it('should focus specific item by id', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });

    ctx.focus('item2');

    expect(ctx.focusedId.value).toBe('item2');
  });

  it('should not trigger callbacks when focusing already focused item', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    let focusCount = 0;
    ctx.register({
      id: 'item1',
      onFocus: () => {
        focusCount++;
      },
    });

    expect(focusCount).toBe(1);

    ctx.focus('item1');

    expect(focusCount).toBe(1); // Should not increment
  });

  it('should focus next item in sequence', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });
    ctx.register({ id: 'item3' });

    expect(ctx.focusedId.value).toBe('item1');

    ctx.focusNext();

    expect(ctx.focusedId.value).toBe('item2');

    ctx.focusNext();

    expect(ctx.focusedId.value).toBe('item3');
  });

  it('should wrap around to first item when focusing next from last', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });

    ctx.focus('item2');
    ctx.focusNext();

    expect(ctx.focusedId.value).toBe('item1');
  });

  it('should focus previous item in sequence', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });
    ctx.register({ id: 'item3' });

    ctx.focus('item3');
    ctx.focusPrev();

    expect(ctx.focusedId.value).toBe('item2');

    ctx.focusPrev();

    expect(ctx.focusedId.value).toBe('item1');
  });

  it('should wrap around to last item when focusing prev from first', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    ctx.register({ id: 'item1' });
    ctx.register({ id: 'item2' });

    expect(ctx.focusedId.value).toBe('item1');

    ctx.focusPrev();

    expect(ctx.focusedId.value).toBe('item2');
  });

  it('should handle focusNext with no items', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    expect(() => ctx.focusNext()).not.toThrow();
    expect(ctx.focusedId.value).toBeNull();
  });

  it('should handle focusPrev with no items', () => {
    const node = FocusProvider({ children: 'test' });
    const ctx = node.props.value;

    expect(() => ctx.focusPrev()).not.toThrow();
    expect(ctx.focusedId.value).toBeNull();
  });
});
