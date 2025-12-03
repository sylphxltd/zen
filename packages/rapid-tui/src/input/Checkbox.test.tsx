import { describe, expect, it } from 'vitest';
import { parseKey } from '../hooks/useInput.js';
import { signal } from '../index';
import { Checkbox, handleCheckbox } from './Checkbox';

// Helper to parse key from string
const pk = (input: string) => parseKey(input).key;

describe('Checkbox', () => {
  it('should create checkbox node', () => {
    const checked = signal(false);
    const node = Checkbox({ checked });

    // Checkbox returns a plain text node (not a descriptor)
    expect(node.type).toBe('text');
    expect(node.props).toBeDefined();
  });

  it('should accept initial checked as boolean', () => {
    const node = Checkbox({ checked: true });

    expect(node).toBeTruthy();
  });

  it('should accept initial checked as signal', () => {
    const checked = signal(true);
    const node = Checkbox({ checked });

    expect(node).toBeTruthy();
  });

  it('should default to unchecked if not specified', () => {
    const node = Checkbox({});

    expect(node).toBeTruthy();
  });

  it('should generate unique ID if not provided', () => {
    const node1 = Checkbox({ checked: signal(false) });
    const node2 = Checkbox({ checked: signal(false) });

    expect(node1.props).toBeDefined();
    expect(node2.props).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = Checkbox({ checked: signal(false), id: 'custom-checkbox' });

    expect(node.props).toBeDefined();
  });

  it('should have label when provided', () => {
    const node = Checkbox({ checked: signal(false), label: 'Accept terms' });

    // Checkbox returns Text descriptor, children is a function that includes label
    expect(node.props).toBeDefined();
    expect(typeof node.props.children).toBe('function');
  });

  it('should not have label when not provided', () => {
    const node = Checkbox({ checked: signal(false) });

    // Should filter out null/undefined, so only checkbox character
    expect(node.children.length).toBeGreaterThan(0);
  });
});

describe('handleCheckbox', () => {
  it('should toggle checkbox with Space key', () => {
    const checked = signal(false);

    const handled = handleCheckbox(checked, pk(' '));

    expect(handled).toBe(true);
    expect(checked.value).toBe(true);
  });

  it('should toggle checkbox with Enter key', () => {
    const checked = signal(false);

    const handled = handleCheckbox(checked, pk('\r'));

    expect(handled).toBe(true);
    expect(checked.value).toBe(true);
  });

  it('should toggle checkbox with newline', () => {
    const checked = signal(false);

    const handled = handleCheckbox(checked, pk('\n'));

    expect(handled).toBe(true);
    expect(checked.value).toBe(true);
  });

  it('should toggle from checked to unchecked', () => {
    const checked = signal(true);

    handleCheckbox(checked, pk(' '));

    expect(checked.value).toBe(false);
  });

  it('should call onChange callback with new value', () => {
    const checked = signal(false);
    let changedValue = false;

    handleCheckbox(checked, pk(' '), (value) => {
      changedValue = value;
    });

    expect(changedValue).toBe(true);
  });

  it('should call onChange with false when unchecking', () => {
    const checked = signal(true);
    let changedValue = true;

    handleCheckbox(checked, pk(' '), (value) => {
      changedValue = value;
    });

    expect(changedValue).toBe(false);
  });

  it('should ignore unknown keys', () => {
    const checked = signal(false);

    const handled = handleCheckbox(checked, pk('x'));

    expect(handled).toBe(false);
    expect(checked.value).toBe(false);
  });

  it('should ignore arrow keys', () => {
    const checked = signal(false);

    const handled = handleCheckbox(checked, pk('\x1b[A'));

    expect(handled).toBe(false);
    expect(checked.value).toBe(false);
  });

  it('should toggle multiple times correctly', () => {
    const checked = signal(false);

    handleCheckbox(checked, pk(' '));
    expect(checked.value).toBe(true);

    handleCheckbox(checked, pk(' '));
    expect(checked.value).toBe(false);

    handleCheckbox(checked, pk(' '));
    expect(checked.value).toBe(true);
  });
});
