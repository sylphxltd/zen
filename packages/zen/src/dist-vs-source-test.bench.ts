import { bench, describe } from 'vitest';
import {
  batch as batchDist,
  computed as computedDist,
  subscribe as subscribeDist,
  zen as zenDist,
} from '../dist/index.js'; // Dist version
import { batch, computed, subscribe, zen } from './index.js'; // Source version

describe('Critical: Source vs Dist Performance Comparison', () => {
  bench('Source Signal Read', () => {
    const signal = zen(42);
    for (let i = 0; i < 1000000; i++) {
      const _ = signal.value;
    }
  });

  bench('Dist Signal Read', () => {
    const signal = zenDist(42);
    for (let i = 0; i < 1000000; i++) {
      const _ = signal.value;
    }
  });

  bench('Source Computed Read', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);
    for (let i = 0; i < 500000; i++) {
      const _ = sum.value;
    }
  });

  bench('Dist Computed Read', () => {
    const a = zenDist(1);
    const b = zenDist(2);
    const sum = computedDist(() => a.value + b.value);
    for (let i = 0; i < 500000; i++) {
      const _ = sum.value;
    }
  });

  bench('Source Batch Operations', () => {
    const signals = Array.from({ length: 10 }, () => zen(0));
    for (let i = 0; i < 100000; i++) {
      batch(() => {
        signals.forEach((s) => (s.value = i));
      });
    }
  });

  bench('Dist Batch Operations', () => {
    const signals = Array.from({ length: 10 }, () => zenDist(0));
    for (let i = 0; i < 100000; i++) {
      batchDist(() => {
        signals.forEach((s) => (s.value = i));
      });
    }
  });
});
