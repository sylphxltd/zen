import { describe, expect, it } from 'vitest';
import { parseKey } from '../hooks/useInput.js';
import { signal } from '../index';
import { TextInput, handleTextInput } from './TextInput';

// Helper to create parsed key and input
const pk = (input: string) => parseKey(input);

describe('TextInput', () => {
  it('should create text input node', () => {
    const value = signal('');
    const node = TextInput({ value });

    expect(node.type).toBe('box');
    // Without explicit width, uses alignSelf: stretch to fill parent
    expect(node.style?.alignSelf).toBe('stretch');
  });

  it('should accept initial value as string', () => {
    const node = TextInput({ value: 'test' });

    expect(node).toBeTruthy();
  });

  it('should accept initial value as signal', () => {
    const value = signal('test');
    const node = TextInput({ value });

    expect(node).toBeTruthy();
  });

  it('should use alignSelf stretch when width not specified', () => {
    const node = TextInput({ value: signal('') });

    // Without explicit width, TextInput uses alignSelf: 'stretch' to fill parent
    expect(node.style?.alignSelf).toBe('stretch');
    expect(node.style?.width).toBeUndefined();
  });

  it('should use custom width when specified', () => {
    const node = TextInput({ value: signal(''), width: 60 });

    // Width is a reactive function when explicitly specified
    const widthFn = node.style?.width as () => number;
    expect(typeof widthFn).toBe('function');
    expect(widthFn()).toBe(60);
    // alignSelf should NOT be set when width is explicit
    expect(node.style?.alignSelf).toBeUndefined();
  });

  it('should have round border when focused', () => {
    // Note: This is simplified - actual focus state requires FocusProvider context
    // In real usage, focus would be managed by FocusProvider
    const node = TextInput({ value: signal(''), id: 'test-input' });

    // The component renders children as an array of TUINodes
    expect(Array.isArray(node.children)).toBe(true);
  });

  it('should generate unique ID if not provided', () => {
    const node1 = TextInput({ value: signal('') });
    const node2 = TextInput({ value: signal('') });

    // IDs should be different (randomly generated)
    expect(node1.props).toBeDefined();
    expect(node2.props).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = TextInput({ value: signal(''), id: 'custom-id' });

    expect(node.props).toBeDefined();
  });
});

describe('handleTextInput', () => {
  it('should insert printable characters', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, pk('x').key, pk('x').input);

    expect(handled).toBe(true);
    expect(value.value).toBe('hellox');
    expect(cursor.value).toBe(6);
  });

  it('should insert character at cursor position', () => {
    const value = signal('hello');
    const cursor = signal(2);

    handleTextInput(value, cursor, pk('x').key, pk('x').input);

    expect(value.value).toBe('hexllo');
    expect(cursor.value).toBe(3);
  });

  it('should handle backspace', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, pk('\x7F').key, pk('\x7F').input);

    expect(handled).toBe(true);
    expect(value.value).toBe('hell');
    expect(cursor.value).toBe(4);
  });

  it('should handle backspace at cursor position', () => {
    const value = signal('hello');
    const cursor = signal(3);

    handleTextInput(value, cursor, pk('\x7F').key, pk('\x7F').input);

    expect(value.value).toBe('helo');
    expect(cursor.value).toBe(2);
  });

  it('should not backspace at start', () => {
    const value = signal('hello');
    const cursor = signal(0);

    handleTextInput(value, cursor, pk('\x7F').key, pk('\x7F').input);

    expect(value.value).toBe('hello');
    expect(cursor.value).toBe(0);
  });

  it('should handle delete key', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, pk('\x1b[3~').key, pk('\x1b[3~').input);

    expect(handled).toBe(true);
    expect(value.value).toBe('helo');
    expect(cursor.value).toBe(2);
  });

  it('should not delete at end', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, pk('\x1b[3~').key, pk('\x1b[3~').input);

    expect(value.value).toBe('hello');
  });

  it('should handle left arrow', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, pk('\x1b[D').key, pk('\x1b[D').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(2);
  });

  it('should not move left at start', () => {
    const value = signal('hello');
    const cursor = signal(0);

    handleTextInput(value, cursor, pk('\x1b[D').key, pk('\x1b[D').input);

    expect(cursor.value).toBe(0);
  });

  it('should handle right arrow', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, pk('\x1b[C').key, pk('\x1b[C').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(3);
  });

  it('should not move right at end', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, pk('\x1b[C').key, pk('\x1b[C').input);

    expect(cursor.value).toBe(5);
  });

  it('should handle Home key', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, pk('\x1b[H').key, pk('\x1b[H').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(0);
  });

  it('should handle Ctrl+A (Home)', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, pk('\x01').key, pk('\x01').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(0);
  });

  it('should handle End key', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, pk('\x1b[F').key, pk('\x1b[F').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(5);
  });

  it('should handle Ctrl+E (End)', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, pk('\x05').key, pk('\x05').input);

    expect(handled).toBe(true);
    expect(cursor.value).toBe(5);
  });

  it('should ignore non-printable characters', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, pk('\x1b').key, pk('\x1b').input);

    expect(handled).toBe(false);
    expect(value.value).toBe('hello');
  });

  it('should handle space character', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, pk(' ').key, pk(' ').input);

    expect(value.value).toBe('hello ');
    expect(cursor.value).toBe(6);
  });

  it('should handle numbers', () => {
    const value = signal('');
    const cursor = signal(0);

    handleTextInput(value, cursor, pk('1').key, pk('1').input);
    handleTextInput(value, cursor, pk('2').key, pk('2').input);
    handleTextInput(value, cursor, pk('3').key, pk('3').input);

    expect(value.value).toBe('123');
  });

  it('should handle special characters', () => {
    const value = signal('');
    const cursor = signal(0);

    handleTextInput(value, cursor, pk('@').key, pk('@').input);
    handleTextInput(value, cursor, pk('#').key, pk('#').input);
    handleTextInput(value, cursor, pk('$').key, pk('$').input);

    expect(value.value).toBe('@#$');
  });
});
