import { bench, describe } from 'vitest';
import { zen, set, computed, subscribe, get } from './zen';

describe('Computed Performance', () => {
  bench('computed chain depth 2, single update', () => {
    const base = zen(0);
    const level1 = computed([base], ([v]: [number]) => v * 2);
    subscribe(level1, () => {});
    set(base, 1);
  });

  bench('computed chain depth 5, single update', () => {
    const base = zen(0);
    const level1 = computed([base], ([v]: [number]) => v * 2);
    const level2 = computed([level1], ([v]: [number]) => v * 2);
    const level3 = computed([level2], ([v]: [number]) => v * 2);
    const level4 = computed([level3], ([v]: [number]) => v * 2);
    const level5 = computed([level4], ([v]: [number]) => v * 2);
    subscribe(level5, () => {});
    set(base, 1);
  });

  bench('computed 2 sources, single update', () => {
    const a = zen(0);
    const b = zen(10);
    const sum = computed([a, b], ([x, y]: [number, number]) => x + y);
    subscribe(sum, () => {});
    set(a, 1);
  });

  bench('computed 5 sources, single update', () => {
    const a = zen(0);
    const b = zen(10);
    const c = zen(20);
    const d = zen(30);
    const e = zen(40);
    const sum = computed([a, b, c, d, e], ([x, y, z, w, v]: [number, number, number, number, number]) => x + y + z + w + v);
    subscribe(sum, () => {});
    set(a, 1);
  });
});
