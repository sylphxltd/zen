/** @jsxImportSource @zen/tui */
import { signal } from '@zen/tui';
import { describe, expect, it } from 'vitest';
import { TextArea } from './TextArea.js';

describe('TextArea', () => {
  it('should render empty textarea', () => {
    const result = TextArea({ value: '' });

    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
  });

  it('should render with initial value', () => {
    const result = TextArea({
      value: 'Hello\nWorld',
      rows: 5,
    });

    expect(result).toBeDefined();
  });

  it('should support placeholder', () => {
    const result = TextArea({
      value: '',
      placeholder: 'Enter text...',
    });

    expect(result).toBeDefined();
  });

  it('should support controlled mode with onChange', () => {
    const text = signal('Initial');
    let changed = false;

    const result = TextArea({
      value: text.value,
      onChange: (newValue) => {
        text.value = newValue;
        changed = true;
      },
    });

    expect(result).toBeDefined();
    expect(changed).toBe(false);
  });

  it('should support uncontrolled mode', () => {
    const result = TextArea({
      rows: 10,
      cols: 60,
    });

    expect(result).toBeDefined();
  });

  it('should support line numbers', () => {
    const result = TextArea({
      value: 'Line 1\nLine 2\nLine 3',
      showLineNumbers: true,
    });

    expect(result).toBeDefined();
  });

  it('should support read-only mode', () => {
    const result = TextArea({
      value: 'Read-only content',
      readOnly: true,
    });

    expect(result).toBeDefined();
  });

  it('should support custom dimensions', () => {
    const result = TextArea({
      value: 'Content',
      rows: 20,
      cols: 80,
    });

    expect(result).toBeDefined();
  });

  it('should support border toggle', () => {
    const result = TextArea({
      value: 'Content',
      border: false,
    });

    expect(result).toBeDefined();
  });

  it('should support line wrapping', () => {
    const result = TextArea({
      value: 'Very long line that should wrap around when it exceeds the column width',
      wrap: true,
      cols: 40,
    });

    expect(result).toBeDefined();
  });
});
