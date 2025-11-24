import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('should create divider node with Text component', () => {
    const node = Divider({});

    expect(node).toBeDefined();
    expect(node.type).toBe('text');
  });

  it('should use default character (─)', () => {
    const node = Divider({});

    expect(node.children).toBeDefined();
    if (typeof node.children === 'string') {
      expect(node.children).toContain('─');
    }
  });

  it('should use custom character', () => {
    const node = Divider({ character: '=' });

    if (typeof node.children === 'string') {
      expect(node.children).toContain('=');
      expect(node.children).not.toContain('─');
    }
  });

  it('should use default width (80)', () => {
    const node = Divider({});

    if (typeof node.children === 'string') {
      expect(node.children.length).toBe(80);
    }
  });

  it('should use custom width', () => {
    const node = Divider({ width: 40 });

    if (typeof node.children === 'string') {
      expect(node.children.length).toBe(40);
    }
  });

  it('should apply color', () => {
    const node = Divider({ color: 'cyan' });

    expect(node.props?.color).toBe('cyan');
  });

  it('should apply dim by default', () => {
    const node = Divider({});

    expect(node.props?.dim).toBe(true);
  });

  it('should apply padding', () => {
    const node = Divider({ padding: 2 });

    expect(node.style?.marginTop).toBe(2);
    expect(node.style?.marginBottom).toBe(2);
  });

  it('should default to zero padding', () => {
    const node = Divider({});

    expect(node.style?.marginTop).toBe(0);
    expect(node.style?.marginBottom).toBe(0);
  });

  it('should apply custom styles', () => {
    const node = Divider({ style: { marginLeft: 5 } });

    expect(node.style?.marginLeft).toBe(5);
  });

  it('should create full width line with single character', () => {
    const node = Divider({ character: '─', width: 10 });

    if (typeof node.children === 'string') {
      expect(node.children).toBe('──────────');
    }
  });

  it('should handle different divider characters', () => {
    const dash = Divider({ character: '-', width: 5 });
    const equal = Divider({ character: '=', width: 5 });
    const asterisk = Divider({ character: '*', width: 5 });

    if (typeof dash.children === 'string') {
      expect(dash.children).toBe('-----');
    }
    if (typeof equal.children === 'string') {
      expect(equal.children).toBe('=====');
    }
    if (typeof asterisk.children === 'string') {
      expect(asterisk.children).toBe('*****');
    }
  });
});
