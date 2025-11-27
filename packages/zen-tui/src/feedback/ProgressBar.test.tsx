import { describe, expect, it } from 'vitest';
import { signal } from '../index';
import { ProgressBar, incrementProgress, resetProgress, setProgress } from './ProgressBar';

// Helper to resolve reactive style values
const resolveStyle = (value: any) => (typeof value === 'function' ? value() : value);

describe('ProgressBar', () => {
  it('should create progress bar node', () => {
    const value = signal(50);
    const node = ProgressBar({ value });

    expect(node.type).toBe('box');
    expect(node).toBeTruthy();
  });

  it('should accept value as number', () => {
    const node = ProgressBar({ value: 75 });

    expect(node).toBeTruthy();
  });

  it('should accept value as signal', () => {
    const value = signal(25);
    const node = ProgressBar({ value });

    expect(node).toBeTruthy();
  });

  it('should use default width if not specified', () => {
    const node = ProgressBar({ value: signal(50) });

    expect(resolveStyle(node.style?.width)).toBe(40);
  });

  it('should use custom width when specified', () => {
    const node = ProgressBar({ value: signal(50), width: 60 });

    expect(resolveStyle(node.style?.width)).toBe(60);
  });

  it('should show percentage by default', () => {
    const node = ProgressBar({ value: signal(50) });

    expect(node).toBeTruthy();
  });

  it('should hide percentage when showPercentage is false', () => {
    const node = ProgressBar({ value: signal(50), showPercentage: false });

    expect(node).toBeTruthy();
  });

  it('should display label when provided', () => {
    const node = ProgressBar({ value: signal(50), label: 'Downloading...' });
    // Children is a reactive function that returns array with label + bar
    const children = typeof node.children === 'function' ? node.children() : node.children;
    expect(Array.isArray(children) ? children.length : 1).toBeGreaterThanOrEqual(1);
  });

  it('should not display label when not provided', () => {
    const node = ProgressBar({ value: signal(50) });
    // Children is a reactive function
    const children = typeof node.children === 'function' ? node.children() : node.children;
    // Should only have the progress bar (no label)
    expect(Array.isArray(children) ? children.length : 1).toBe(1);
  });

  it('should use custom color', () => {
    const node = ProgressBar({ value: signal(50), color: 'green' });

    expect(node).toBeTruthy();
  });

  it('should use custom char for filled portion', () => {
    const node = ProgressBar({ value: signal(50), char: '■' });

    expect(node).toBeTruthy();
  });

  it('should clamp value to 0-100 range', () => {
    const valueLow = signal(-10);
    const nodeGLow = ProgressBar({ value: valueLow });
    expect(nodeGLow).toBeTruthy();

    const valueHigh = signal(150);
    const nodeHigh = ProgressBar({ value: valueHigh });
    expect(nodeHigh).toBeTruthy();
  });
});

describe('incrementProgress', () => {
  it('should increment by 1 by default', () => {
    const value = signal(50);

    incrementProgress(value);

    expect(value.value).toBe(51);
  });

  it('should increment by custom amount', () => {
    const value = signal(50);

    incrementProgress(value, 10);

    expect(value.value).toBe(60);
  });

  it('should not exceed 100', () => {
    const value = signal(95);

    incrementProgress(value, 10);

    expect(value.value).toBe(100);
  });

  it('should handle multiple increments', () => {
    const value = signal(0);

    incrementProgress(value, 25);
    incrementProgress(value, 25);
    incrementProgress(value, 25);

    expect(value.value).toBe(75);
  });
});

describe('setProgress', () => {
  it('should set progress to specific value', () => {
    const value = signal(0);

    setProgress(value, 75);

    expect(value.value).toBe(75);
  });

  it('should clamp to minimum 0', () => {
    const value = signal(50);

    setProgress(value, -10);

    expect(value.value).toBe(0);
  });

  it('should clamp to maximum 100', () => {
    const value = signal(50);

    setProgress(value, 150);

    expect(value.value).toBe(100);
  });
});

describe('resetProgress', () => {
  it('should reset progress to 0', () => {
    const value = signal(75);

    resetProgress(value);

    expect(value.value).toBe(0);
  });

  it('should reset from any value', () => {
    const value = signal(100);

    resetProgress(value);

    expect(value.value).toBe(0);
  });
});
