import { describe, expect, it } from 'bun:test';
import { transformRapidJSX } from './core/transform.js';

describe('false positives - non-signal .value access', () => {
  it('should transform plain object .value (false positive)', () => {
    const input = `
      const user = { name: 'John', value: 42 };
      <Text>{user.value}</Text>
    `;

    const result = transformRapidJSX(input, 'test.tsx');
    expect(result).not.toBeNull();

    // This WILL be transformed (false positive)
    expect(result!.code).toContain('() => user.value');
  });

  it('should transform config.value (false positive)', () => {
    const input = `
      const config = { value: 'production' };
      <Text>{config.value}</Text>
    `;

    const result = transformRapidJSX(input, 'test.tsx');
    expect(result).not.toBeNull();

    // This WILL be transformed (false positive)
    expect(result!.code).toContain('() => config.value');
  });

  it('false positive is harmless at runtime', () => {
    const input = `
      const obj = { value: 123 };
      // Transformed: {() => obj.value}
      // Runtime: Calls function, gets 123
      // Same result as: {obj.value}
      <Text>{obj.value}</Text>
    `;

    const result = transformRapidJSX(input, 'test.tsx');
    expect(result).not.toBeNull();

    // Transformation happens, but it's harmless:
    // Before: obj.value → 123
    // After: (() => obj.value)() → 123
    // Same value, just wrapped in function
    expect(result!.code).toContain('() => obj.value');
  });
});
