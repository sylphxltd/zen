import { bench, describe } from 'vitest';
import { batch, computed, zen } from './index.js';

describe('Performance Fix Validation', () => {
  bench('Computed creation and execution', () => {
    const a = zen(1);
    const b = zen(2);

    for (let i = 0; i < 100000; i++) {
      const sum = computed(() => a.value + b.value);
      const _ = sum.value;
    }
  });

  bench('Signal read operations', () => {
    const signal = zen(42);

    for (let i = 0; i < 1000000; i++) {
      const _ = signal.value;
    }
  });

  bench('Batch operations', () => {
    const signals = Array.from({ length: 10 }, () => zen(0));

    for (let i = 0; i < 100000; i++) {
      batch(() => {
        signals.forEach((s) => (s.value = i));
      });
    }
  });
});
