import { bench, describe } from 'vitest';
import { zen, set, computed, subscribe } from './zen';

describe('Computed Version Tracking - Deep Chains', () => {
  bench('shallow computed chain (2 levels), 100 updates', () => {
    const base = zen(0);
    const level1 = computed([base], ([v]: [number]) => v * 2);
    subscribe(level1, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('deep computed chain (5 levels), 100 updates', () => {
    const base = zen(0);
    const level1 = computed([base], ([v]: [number]) => v * 2);
    const level2 = computed([level1], ([v]: [number]) => v * 2);
    const level3 = computed([level2], ([v]: [number]) => v * 2);
    const level4 = computed([level3], ([v]: [number]) => v * 2);
    const level5 = computed([level4], ([v]: [number]) => v * 2);
    subscribe(level5, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('very deep computed chain (10 levels), 100 updates', () => {
    const base = zen(0);
    const level1 = computed([base], ([v]: [number]) => v * 2);
    const level2 = computed([level1], ([v]: [number]) => v * 2);
    const level3 = computed([level2], ([v]: [number]) => v * 2);
    const level4 = computed([level3], ([v]: [number]) => v * 2);
    const level5 = computed([level4], ([v]: [number]) => v * 2);
    const level6 = computed([level5], ([v]: [number]) => v * 2);
    const level7 = computed([level6], ([v]: [number]) => v * 2);
    const level8 = computed([level7], ([v]: [number]) => v * 2);
    const level9 = computed([level8], ([v]: [number]) => v * 2);
    const level10 = computed([level9], ([v]: [number]) => v * 2);
    subscribe(level10, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });
});

describe('Computed Version Tracking - Multiple Sources', () => {
  bench('computed with 2 sources, update one source', () => {
    const a = zen(0);
    const b = zen(10);
    const sum = computed([a, b], ([x, y]: [number, number]) => x + y);
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      set(a, i); // Only update a, b stays constant
    }
  });

  bench('computed with 5 sources, update one source', () => {
    const a = zen(0);
    const b = zen(10);
    const c = zen(20);
    const d = zen(30);
    const e = zen(40);
    const sum = computed([a, b, c, d, e], ([x, y, z, w, v]: [number, number, number, number, number]) => x + y + z + w + v);
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      set(a, i); // Only update a, others stay constant
    }
  });

  bench('computed with 10 sources, update one source', () => {
    const sources = Array.from({ length: 10 }, (_, i) => zen(i * 10));
    const sum = computed(sources, (...vals: number[]) => vals.reduce((acc, v) => acc + v, 0));
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      set(sources[0], i); // Only update first source
    }
  });
});

describe('Computed Version Tracking - Diamond Dependencies', () => {
  bench('diamond: base -> 2 computed -> 1 final, 100 updates', () => {
    const base = zen(0);
    const left = computed([base], ([v]: [number]) => v * 2);
    const right = computed([base], ([v]: [number]) => v * 3);
    const final = computed([left, right], ([l, r]: [number, number]) => l + r);
    subscribe(final, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('complex diamond: base -> 4 computed -> 2 computed -> 1 final', () => {
    const base = zen(0);
    const a = computed([base], ([v]: [number]) => v * 2);
    const b = computed([base], ([v]: [number]) => v * 3);
    const c = computed([base], ([v]: [number]) => v * 4);
    const d = computed([base], ([v]: [number]) => v * 5);
    const e = computed([a, b], ([x, y]: [number, number]) => x + y);
    const f = computed([c, d], ([x, y]: [number, number]) => x + y);
    const final = computed([e, f], ([x, y]: [number, number]) => x + y);
    subscribe(final, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });
});
