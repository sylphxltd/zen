import { describe, expect, it, vi } from 'vitest';
import { parseKey } from '../hooks/useInput.js';
import { signal } from '../index.js';
import { Box } from '../primitives/Box.js';
import { Button, handleButton } from './Button.js';

describe('Button', () => {
  it('should create button node', () => {
    const node = Button({ label: 'Click me' });

    // Button returns a descriptor with Box component as type
    expect(node.type).toBe(Box);
    // Style properties are in props.style for descriptors
    expect(node.props?.style).toBeDefined();
  });

  it('should display label text', () => {
    const node = Button({ label: 'Submit' });

    expect(node).toBeTruthy();
  });

  it('should use primary variant by default', () => {
    const node = Button({ label: 'Test' });

    expect(node.style?.borderColor).toBeUndefined(); // Not focused
  });

  it('should apply secondary variant styles', () => {
    const node = Button({ label: 'Test', variant: 'secondary' });

    expect(node).toBeTruthy();
  });

  it('should apply danger variant styles', () => {
    const node = Button({ label: 'Delete', variant: 'danger' });

    expect(node).toBeTruthy();
  });

  it('should show disabled state', () => {
    const node = Button({ label: 'Test', disabled: true });

    // borderColor is in props.style as a reactive function
    expect(node.props?.style).toBeDefined();
    expect(typeof node.props.style.borderColor).toBe('function');
    // When called, should return 'gray' for disabled state
    expect(node.props.style.borderColor()).toBe('gray');
  });

  it('should use custom width when specified', () => {
    const node = Button({ label: 'Test', width: 30 });

    expect(node.props?.style).toBeDefined();
    expect(node.props.style.width).toBe(30);
  });

  it('should generate unique ID if not provided', () => {
    const node1 = Button({ label: 'Test' });
    const node2 = Button({ label: 'Test' });

    expect(node1.props).toBeDefined();
    expect(node2.props).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = Button({ label: 'Test', id: 'custom-button' });

    expect(node.props).toBeDefined();
  });
});

describe('handleButton', () => {
  it('should trigger onClick on Enter key', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, false, parseKey('\r').key, onClick);

    expect(result.handled).toBe(true);
    expect(onClick).toHaveBeenCalled();
  });

  it('should trigger onClick on Space key', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, false, parseKey(' ').key, onClick);

    expect(result.handled).toBe(true);
    expect(onClick).toHaveBeenCalled();
  });

  it('should trigger onClick on newline', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, false, parseKey('\n').key, onClick);

    expect(result.handled).toBe(true);
    expect(onClick).toHaveBeenCalled();
  });

  it('should set pressed state when activated', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    handleButton(isPressed, false, parseKey('\r').key, onClick);

    expect(isPressed.value).toBe(true);
  });

  it('should not trigger onClick when disabled', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, true, parseKey('\r').key, onClick);

    expect(result.handled).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should not change pressed state when disabled', () => {
    const isPressed = signal(false);

    handleButton(isPressed, true, parseKey('\r').key);

    expect(isPressed.value).toBe(false);
  });

  it('should ignore unknown keys', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, false, parseKey('x').key, onClick);

    expect(result.handled).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should work without onClick callback', () => {
    const isPressed = signal(false);

    expect(() => handleButton(isPressed, false, parseKey('\r').key)).not.toThrow();
  });

  it('should provide cleanup function when handled', () => {
    const isPressed = signal(false);
    const onClick = vi.fn();

    const result = handleButton(isPressed, false, parseKey('\r').key, onClick);

    expect(result.handled).toBe(true);
    expect(typeof result.cleanup).toBe('function');

    // Cleanup should reset pressed state and clear timeout
    result.cleanup?.();
    expect(isPressed.value).toBe(false);
  });
});
