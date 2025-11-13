import { describe, bench } from 'vitest';
import { zen, computed, batch, subscribe } from './dist/index.js';
import { createSignal, createEffect, createMemo, batch as solidBatch } from 'solid-js';

describe('Detailed Performance Benchmark: Zen v3.2 vs SolidJS', () => {

  bench('Zen Signal Creation - 1M ops', () => {
    for (let i = 0; i < 1000000; i++) {
      zen(i);
    }
  });

  bench('SolidJS Signal Creation - 1M ops', () => {
    for (let i = 0; i < 1000000; i++) {
      createSignal(i);
    }
  });

  bench('Zen Signal Read - 10M ops', () => {
    const signal = zen(42);
    for (let i = 0; i < 10000000; i++) {
      const _ = signal.value;
    }
  });

  bench('SolidJS Signal Read - 10M ops', () => {
    const [signal] = createSignal(42);
    for (let i = 0; i < 10000000; i++) {
      const _ = signal();
    }
  });

  bench('Zen Signal Write - 1M ops', () => {
    const signal = zen(0);
    for (let i = 0; i < 1000000; i++) {
      signal.value = i;
    }
  });

  bench('SolidJS Signal Write - 1M ops', () => {
    const [signal, setSignal] = createSignal(0);
    for (let i = 0; i < 1000000; i++) {
      setSignal(() => i);
    }
  });

  bench('Zen Computed Creation - 100K ops', () => {
    const baseSignals = Array.from({ length: 100 }, (_, i) => zen(i));
    for (let i = 0; i < 100000; i++) {
      const idx = i % 10;
      computed(() => baseSignals[idx].value * 2);
    }
  });

  bench('SolidJS Computed Creation - 100K ops', () => {
    const baseSignals = Array.from({ length: 100 }, (_, i) => createSignal(i));
    for (let i = 0; i < 100000; i++) {
      const idx = i % 10;
      createMemo(() => baseSignals[idx][0]() * 2);
    }
  });

  bench('Zen Computed Read - 1M ops', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);
    for (let i = 0; i < 1000000; i++) {
      const _ = sum.value;
    }
  });

  bench('SolidJS Computed Read - 1M ops', () => {
    const [a] = createSignal(1);
    const [b] = createSignal(2);
    const sum = createMemo(() => a() + b());
    for (let i = 0; i < 1000000; i++) {
      const _ = sum();
    }
  });

  bench('Zen Batch Updates - 100K batches', () => {
    const signals = Array.from({ length: 10 }, () => zen(0));
    for (let i = 0; i < 100000; i++) {
      batch(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j].value = i + j;
        }
      });
    }
  });

  bench('SolidJS Batch Updates - 100K batches', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    for (let i = 0; i < 100000; i++) {
      solidBatch(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j][1](() => i + j);
        }
      });
    }
  });

  bench('Zen Subscribe/Unsubscribe - 100K ops', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));
    for (let i = 0; i < 100000; i++) {
      const idx = i % signals.length;
      let value = 0;
      const unsub = subscribe(signals[idx], (v) => { value = v; });
      signals[idx].value = i;
      unsub();
    }
  });

  bench('SolidJS Effect/Cleanup - 100K ops', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));
    for (let i = 0; i < 100000; i++) {
      const idx = i % signals.length;
      let value = 0;
      const dispose = createEffect(() => { value = signals[idx][0](); });
      signals[idx][1](() => i);
      dispose();
    }
  });
});