// Benchmark comparing select() vs computed() for single-source derivations
import { bench, describe } from 'vitest';
import { computed, get, select, subscribe, zen } from './index';

describe('select() vs computed() - Creation', () => {
  bench('select (1 source)', () => {
    const base = zen(5);
    select(base, (v: number) => v * 2);
  });

  bench('computed (1 source)', () => {
    const base = zen(5);
    computed([base], (v) => v * 2);
  });
});

describe('select() vs computed() - Get', () => {
  const baseSelect = zen(5);
  const selectDouble = select(baseSelect, (v: number) => v * 2);

  const baseComputed = zen(5);
  const computedDouble = computed([baseComputed], (v) => v * 2);

  bench('select', () => {
    get(selectDouble);
  });

  bench('computed', () => {
    get(computedDouble);
  });
});

describe('select() vs computed() - Update Propagation', () => {
  bench('select', () => {
    const base = zen(0);
    const derived = select(base, (v: number) => v * 2);
    subscribe(derived, () => {});
    base._value = 1;
  });

  bench('computed', () => {
    const base = zen(0);
    const derived = computed([base], (v) => v * 2);
    subscribe(derived, () => {});
    base._value = 1;
  });
});

describe('select() vs computed() - Subscribe/Unsubscribe', () => {
  const baseSelect = zen(5);
  const selectDouble = select(baseSelect, (v: number) => v * 2);

  const baseComputed = zen(5);
  const computedDouble = computed([baseComputed], (v) => v * 2);

  bench('select', () => {
    const unsub = subscribe(selectDouble, () => {});
    unsub();
  });

  bench('computed', () => {
    const unsub = subscribe(computedDouble, () => {});
    unsub();
  });
});

describe('select() vs computed() - Chain of Derivations', () => {
  bench('select chain (3 levels)', () => {
    const base = zen(5);
    const level1 = select(base, (v: number) => v * 2);
    const level2 = select(level1, (v: number | null) => (v || 0) + 10);
    const level3 = select(level2, (v: number | null) => (v || 0) * 3);
    subscribe(level3, () => {});
    base._value = 10;
  });

  bench('computed chain (3 levels)', () => {
    const base = zen(5);
    const level1 = computed([base], (v) => v * 2);
    const level2 = computed([level1], (v) => (v || 0) + 10);
    const level3 = computed([level2], (v) => (v || 0) * 3);
    subscribe(level3, () => {});
    base._value = 10;
  });
});
