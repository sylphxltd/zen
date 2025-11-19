/**
 * Props utilities - mergeProps and splitProps
 *
 * Type-safe props manipulation for component development.
 */

/**
 * Merge multiple props objects
 * Later objects override earlier ones
 *
 * @example
 * ```tsx
 * const merged = mergeProps(
 *   { a: 1, b: 2 },     // defaults
 *   props,               // user props
 *   { c: 3 }            // forced values
 * );
 * ```
 */
export function mergeProps<T extends readonly object[]>(...sources: T): T[number] {
  const result: any = {};

  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = (source as any)[key];
      }
    }
  }

  return result;
}

/**
 * Split props into multiple objects based on keys
 *
 * @example
 * ```tsx
 * const [local, dom, rest] = splitProps(
 *   props,
 *   ['value', 'onChange'],  // local
 *   ['class', 'style']      // dom
 * );
 * ```
 */
export function splitProps<
  T extends Record<string, any>,
  K1 extends readonly (keyof T)[],
  K2 extends readonly Exclude<keyof T, K1[number]>[] = [],
>(
  props: T,
  ...keys: [K1, K2?]
): [
  Pick<T, K1[number]>,
  K2 extends readonly any[] ? Pick<T, K2[number]> : {},
  Omit<T, K1[number] | (K2 extends readonly any[] ? K2[number] : never)>,
] {
  const result: any[] = [];
  const rest: any = {};

  // Create objects for each key group
  for (let i = 0; i < keys.length; i++) {
    result[i] = {};
  }

  // Distribute props
  for (const key in props) {
    if (!Object.prototype.hasOwnProperty.call(props, key)) continue;

    let found = false;
    for (let i = 0; i < keys.length; i++) {
      const keyGroup = keys[i];
      if (keyGroup?.includes(key as any)) {
        result[i][key] = props[key];
        found = true;
        break;
      }
    }

    if (!found) {
      rest[key] = props[key];
    }
  }

  // Add rest object
  result.push(rest);

  return result as any;
}
