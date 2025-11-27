import { describe, expect, it } from 'vitest';
import { signal } from '../index';
import { SelectInput, type SelectOption, handleSelectInput } from './SelectInput';

// Helper to resolve reactive style values
const resolveStyle = (value: any) => (typeof value === 'function' ? value() : value);

const testOptions: SelectOption<string>[] = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
];

describe('SelectInput', () => {
  it('should create select input node', () => {
    const value = signal('opt1');
    const node = SelectInput({ options: testOptions, value });

    expect(node.type).toBe('box');
    expect(resolveStyle(node.style?.width)).toBe(40);
  });

  it('should accept initial value as string', () => {
    const node = SelectInput({ options: testOptions, value: 'opt1' });

    expect(node).toBeTruthy();
  });

  it('should accept initial value as signal', () => {
    const value = signal('opt1');
    const node = SelectInput({ options: testOptions, value });

    expect(node).toBeTruthy();
  });

  it('should use default width if not specified', () => {
    const node = SelectInput({ options: testOptions, value: signal('opt1') });

    expect(resolveStyle(node.style?.width)).toBe(40);
  });

  it('should use custom width when specified', () => {
    const node = SelectInput({ options: testOptions, value: signal('opt1'), width: 60 });

    expect(resolveStyle(node.style?.width)).toBe(60);
  });

  it('should generate unique ID if not provided', () => {
    const node1 = SelectInput({ options: testOptions, value: signal('opt1') });
    const node2 = SelectInput({ options: testOptions, value: signal('opt1') });

    expect(node1.props).toBeDefined();
    expect(node2.props).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = SelectInput({
      options: testOptions,
      value: signal('opt1'),
      id: 'custom-select',
    });

    expect(node.props).toBeDefined();
  });

  it('should display placeholder when no value', () => {
    const node = SelectInput({
      options: testOptions,
      value: signal('' as string),
      placeholder: 'Choose option',
    });

    expect(node).toBeTruthy();
  });
});

describe('handleSelectInput', () => {
  it('should open dropdown with Enter key', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\r');

    expect(handled).toBe(true);
    expect(isOpen.value).toBe(true);
  });

  it('should open dropdown with Space key', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, ' ');

    expect(handled).toBe(true);
    expect(isOpen.value).toBe(true);
  });

  it('should select highlighted option when dropdown is open', () => {
    const isOpen = signal(true);
    const highlighted = signal(1);
    const value = signal('opt1');

    handleSelectInput(isOpen, highlighted, value, testOptions, '\r');

    expect(value.value).toBe('opt2'); // Option at index 1
    expect(isOpen.value).toBe(false);
  });

  it('should call onChange when selecting option', () => {
    const isOpen = signal(true);
    const highlighted = signal(2);
    const value = signal('opt1');
    let changedValue = '';

    handleSelectInput(isOpen, highlighted, value, testOptions, '\r', (val) => {
      changedValue = val;
    });

    expect(changedValue).toBe('opt3');
  });

  it('should close dropdown with Escape key', () => {
    const isOpen = signal(true);
    const highlighted = signal(0);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b');

    expect(handled).toBe(true);
    expect(isOpen.value).toBe(false);
  });

  it('should navigate up with arrow key when open', () => {
    const isOpen = signal(true);
    const highlighted = signal(2);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[A');

    expect(handled).toBe(true);
    expect(highlighted.value).toBe(1);
  });

  it('should not navigate above 0', () => {
    const isOpen = signal(true);
    const highlighted = signal(0);
    const value = signal('opt1');

    handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[A');

    expect(highlighted.value).toBe(0);
  });

  it('should navigate down with arrow key when open', () => {
    const isOpen = signal(true);
    const highlighted = signal(0);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[B');

    expect(handled).toBe(true);
    expect(highlighted.value).toBe(1);
  });

  it('should not navigate below last option', () => {
    const isOpen = signal(true);
    const highlighted = signal(2);
    const value = signal('opt1');

    handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[B');

    expect(highlighted.value).toBe(2);
  });

  it('should change selection with up arrow when closed', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt2'); // Index 1

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[A');

    expect(handled).toBe(true);
    expect(value.value).toBe('opt1');
  });

  it('should not go below first option when closed', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1'); // Index 0

    handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[A');

    expect(value.value).toBe('opt1');
  });

  it('should change selection with down arrow when closed', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1'); // Index 0

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[B');

    expect(handled).toBe(true);
    expect(value.value).toBe('opt2');
  });

  it('should not go above last option when closed', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt3'); // Index 2

    handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[B');

    expect(value.value).toBe('opt3');
  });

  it('should call onChange when navigating with arrows closed', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1');
    let changedValue = '';

    handleSelectInput(isOpen, highlighted, value, testOptions, '\x1b[B', (val) => {
      changedValue = val;
    });

    expect(changedValue).toBe('opt2');
  });

  it('should ignore unknown keys', () => {
    const isOpen = signal(false);
    const highlighted = signal(0);
    const value = signal('opt1');

    const handled = handleSelectInput(isOpen, highlighted, value, testOptions, 'x');

    expect(handled).toBe(false);
    expect(isOpen.value).toBe(false);
    expect(value.value).toBe('opt1');
  });
});
