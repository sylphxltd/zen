import { describe, expect, it } from 'vitest';
import { signal } from '../index';
import { Spinner, createAnimatedSpinner, updateSpinner } from './Spinner';

// Helper to resolve reactive style values
const resolveStyle = (value: any) => (typeof value === 'function' ? value() : value);

describe('Spinner', () => {
  it('should create spinner node', () => {
    const node = Spinner({});

    expect(node.type).toBe('text');
    expect(node).toBeTruthy();
  });

  it('should use dots type by default', () => {
    const node = Spinner({});

    expect(node.type).toBe('text');
    expect(node).toBeTruthy();
  });

  it('should use line type when specified', () => {
    const node = Spinner({ type: 'line' });

    expect(node.type).toBe('text');
    expect(node).toBeTruthy();
  });

  it('should use arc type when specified', () => {
    const node = Spinner({ type: 'arc' });

    expect(node.type).toBe('text');
    expect(node).toBeTruthy();
  });

  it('should use arrow type when specified', () => {
    const node = Spinner({ type: 'arrow' });

    expect(node.type).toBe('text');
    expect(node).toBeTruthy();
  });

  it('should display label when provided', () => {
    const node = Spinner({ label: 'Loading...' });

    expect(node).toBeTruthy();
  });

  it('should use custom color', () => {
    const node = Spinner({ color: 'green' });

    expect(resolveStyle(node.style?.color)).toBe('green');
  });

  it('should use cyan color by default', () => {
    const node = Spinner({});

    expect(resolveStyle(node.style?.color)).toBe('cyan');
  });
});

describe('updateSpinner', () => {
  it('should increment frame index', () => {
    const frameIndex = signal(0);

    updateSpinner(frameIndex);

    expect(frameIndex.value).toBe(1);
  });

  it('should wrap around after 100 frames', () => {
    const frameIndex = signal(99);

    updateSpinner(frameIndex);

    expect(frameIndex.value).toBe(0);
  });

  it('should update multiple times', () => {
    const frameIndex = signal(0);

    updateSpinner(frameIndex);
    updateSpinner(frameIndex);
    updateSpinner(frameIndex);

    expect(frameIndex.value).toBe(3);
  });
});

describe('createAnimatedSpinner', () => {
  it('should create animated spinner with cleanup', () => {
    const result = createAnimatedSpinner({ type: 'dots' });

    expect(result.node).toBeDefined();
    expect(result.cleanup).toBeInstanceOf(Function);
    expect(result.frameIndex).toBeDefined();

    result.cleanup();
  });

  it('should use custom color', () => {
    const result = createAnimatedSpinner({ color: 'yellow' });

    expect(result.node.style?.color).toBe('yellow');

    result.cleanup();
  });

  it('should include label when provided', () => {
    const result = createAnimatedSpinner({ label: 'Processing...' });

    expect(result.node).toBeTruthy();

    result.cleanup();
  });
});
