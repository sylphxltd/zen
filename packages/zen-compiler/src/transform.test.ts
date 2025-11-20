import { describe, expect, it } from 'bun:test';
import { transformZenJSX } from './core/transform.js';

describe('transformZenJSX', () => {
  describe('signal auto-unwrap', () => {
    it('should NOT transform {signal} (runtime handles it)', () => {
      const input = `
        const message = signal('hello');
        <Text>{message}</Text>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // Should remain as {message}, not wrapped
      expect(result!.code).toContain('{message}');
      expect(result!.code).not.toContain('() => message');
    });

    it('should transform {signal.value} to {() => signal.value}', () => {
      const input = `
        const message = signal('hello');
        <Text>{message.value}</Text>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      expect(result!.code).toContain('() => message.value');
    });

    it('should NOT transform {() => signal.value} (already a function)', () => {
      const input = `
        const message = signal('hello');
        <Text>{() => message.value}</Text>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // Should remain as arrow function, not double-wrapped
      expect(result!.code).toContain('() => message.value');
      expect(result!.code).not.toContain('() => () => message.value');
    });

    it('should only transform .value accesses', () => {
      const input = `
        const count = signal(0);
        const message = signal('hello');
        <div>
          <Text>{count}</Text>
          <Text>{message.value}</Text>
        </div>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // {count} should NOT be transformed (runtime handles it)
      expect(result!.code).toContain('{count}');
      expect(result!.code).not.toContain('() => count');
      // {message.value} should be transformed
      expect(result!.code).toContain('() => message.value');
    });

    it('should transform complex expressions containing .value', () => {
      const input = `
        const count = signal(0);
        <div>
          <Text>{count.value + 2}</Text>
          <Text>{count.value * 10}</Text>
          <Text>{count.value > 5 ? 'high' : 'low'}</Text>
        </div>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // All expressions containing .value should be transformed
      expect(result!.code).toContain('() => count.value + 2');
      expect(result!.code).toContain('() => count.value * 10');
      expect(result!.code).toContain('() => count.value > 5');
    });

    it('should NOT transform plain variables', () => {
      const input = `
        const name = 'John';
        const age = 30;
        <div>
          <Text>{name}</Text>
          <Text>{age + 5}</Text>
        </div>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // Plain variables should NOT be transformed
      expect(result!.code).toContain('{name}');
      expect(result!.code).toContain('{age + 5}');
      expect(result!.code).not.toContain('() =>');
    });
  });

  describe('auto-lazy children', () => {
    it('should transform <Show><Child /></Show> to lazy children', () => {
      const input = `
        <Show when={condition}>
          <Child />
        </Show>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // Should wrap children in arrow function
      expect(result!.code).toMatch(/=>\s*<>/); // Arrow function returning fragment
    });

    it('should transform <For> children', () => {
      const input = `
        <For each={items}>
          <Item />
        </For>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      expect(result!.code).toMatch(/=>\s*<>/);
    });

    it('should NOT transform regular components', () => {
      const input = `
        <Box>
          <Child />
        </Box>
      `;

      const result = transformZenJSX(input, 'test.tsx');
      expect(result).not.toBeNull();
      // Should not wrap in arrow function
      expect(result!.code).not.toMatch(/Box[^>]*>\s*{\s*\(\)\s*=>/);
    });
  });

  describe('options', () => {
    it('should respect autoUnwrap: false', () => {
      const input = `
        <Text>{message}</Text>
      `;

      const result = transformZenJSX(input, 'test.tsx', { autoUnwrap: false });
      expect(result).not.toBeNull();
      // Should NOT transform to arrow function
      expect(result!.code).not.toContain('() =>');
    });

    it('should respect autoLazy: false', () => {
      const input = `
        <Show when={condition}>
          <Child />
        </Show>
      `;

      const result = transformZenJSX(input, 'test.tsx', { autoLazy: false });
      expect(result).not.toBeNull();
      // Should NOT wrap children
      expect(result!.code).not.toMatch(/=>\s*<>/);
    });
  });
});
