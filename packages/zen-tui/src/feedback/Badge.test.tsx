import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

// Helper to resolve reactive style values
const resolveStyle = (value: any) => (typeof value === 'function' ? value() : value);

describe('Badge', () => {
  it('should create badge node with Box component', () => {
    const node = Badge({ children: 'NEW' });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should display children text', () => {
    const node = Badge({ children: 'BETA' });

    expect(node).toBeDefined();
  });

  it('should use cyan color by default', () => {
    const node = Badge({ children: 'TAG' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('cyan');
  });

  it('should apply green color', () => {
    const node = Badge({ children: 'SUCCESS', color: 'green' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('green');
  });

  it('should apply red color', () => {
    const node = Badge({ children: 'ERROR', color: 'red' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('red');
  });

  it('should apply yellow color', () => {
    const node = Badge({ children: 'WARNING', color: 'yellow' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('yellow');
  });

  it('should apply blue color', () => {
    const node = Badge({ children: 'INFO', color: 'blue' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('blue');
  });

  it('should apply magenta color', () => {
    const node = Badge({ children: 'SPECIAL', color: 'magenta' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('magenta');
  });

  it('should apply white color', () => {
    const node = Badge({ children: 'LIGHT', color: 'white' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('white');
  });

  it('should apply gray color', () => {
    const node = Badge({ children: 'DISABLED', color: 'gray' });

    expect(resolveStyle(node.style?.backgroundColor)).toBe('gray');
  });

  it('should apply horizontal padding', () => {
    const node = Badge({ children: 'PADDED' });

    expect(node.style?.paddingX).toBe(1);
  });

  it('should apply custom styles', () => {
    const node = Badge({ children: 'CUSTOM', style: { marginLeft: 2 } });

    expect(node.style?.marginLeft).toBe(2);
  });

  it('should handle empty string', () => {
    const node = Badge({ children: '' });

    expect(node).toBeDefined();
  });

  it('should handle long text', () => {
    const node = Badge({ children: 'VERY LONG BADGE TEXT' });

    expect(node).toBeDefined();
  });
});
