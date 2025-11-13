import { describe, bench } from 'vitest';
import { zen, computed, batch, subscribe } from './dist/index.js';

// SolidJS for comparison
import { createSignal, createEffect, createMemo, batch as solidBatch } from 'solid-js';

describe('Fair Dist Comparison: Zen v3.2 vs SolidJS', () => {
  // Signal Operations
  bench('Zen Signal Creation', () => {
    zen(0);
  });

  bench('SolidJS Signal Creation', () => {
    createSignal(0);
  });

  bench('Zen Signal Read', () => {
    const signal = zen(42);
    return signal.value;
  });

  bench('SolidJS Signal Read', () => {
    const [signal] = createSignal(42);
    return signal();
  });

  bench('Zen Signal Write', () => {
    const signal = zen(0);
    signal.value = 1;
    return signal.value;
  });

  bench('SolidJS Signal Write', () => {
    const [signal, setSignal] = createSignal(0);
    setSignal(() => 1);
    return signal();
  });

  // Computed Operations
  bench('Zen Computed Creation', () => {
    const a = zen(1);
    const b = zen(2);
    return computed(() => a.value + b.value);
  });

  bench('SolidJS Computed Creation', () => {
    const [a] = createSignal(1);
    const [b] = createSignal(2);
    return createMemo(() => a() + b());
  });

  bench('Zen Computed Read', () => {
    const a = zen(1);
    const b = zen(2);
    const c = computed(() => a.value + b.value);
    return c.value;
  });

  bench('SolidJS Computed Read', () => {
    const [a] = createSignal(1);
    const [b] = createSignal(2);
    const c = createMemo(() => a() + b());
    return c();
  });

  // Batch Operations
  bench('Zen Batch Updates', () => {
    const a = zen(0);
    const b = zen(0);
    const c = zen(0);

    batch(() => {
      a.value = 1;
      b.value = 2;
      c.value = 3;
    });

    return a.value + b.value + c.value;
  });

  bench('SolidJS Batch Updates', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);

    solidBatch(() => {
      setA(() => 1);
      setB(() => 2);
      setC(() => 3);
    });

    return a() + b() + c();
  });

  // Subscription Operations
  bench('Zen Subscribe/Unsubscribe', () => {
    const signal = zen(0);
    let value = 0;
    const unsub = subscribe(signal, (v) => { value = v; });
    signal.value = 1;
    unsub();
    return value;
  });

  bench('SolidJS Effect Creation/Cleanup', () => {
    const [signal, setSignal] = createSignal(0);
    let value = 0;
    const dispose = createEffect(() => { value = signal(); });
    setSignal(() => 1);
    dispose();
    return value;
  });

  // Complex Scenario: Nested Computed
  bench('Zen Nested Computed', () => {
    const base = zen(1);
    const doubled = computed(() => base.value * 2);
    const quadrupled = computed(() => doubled.value * 2);
    base.value = 2;
    return quadrupled.value;
  });

  bench('SolidJS Nested Computed', () => {
    const [base, setBase] = createSignal(1);
    const doubled = createMemo(() => base() * 2);
    const quadrupled = createMemo(() => doubled() * 2);
    setBase(() => 2);
    return quadrupled();
  });

  // Complex Scenario: Multiple Dependencies
  bench('Zen Multiple Dependencies', () => {
    const a = zen(1);
    const b = zen(2);
    const c = zen(3);
    const sum = computed(() => a.value + b.value + c.value);
    const product = computed(() => a.value * b.value * c.value);

    batch(() => {
      a.value = 4;
      b.value = 5;
      c.value = 6;
    });

    return sum.value + product.value;
  });

  bench('SolidJS Multiple Dependencies', () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    const sum = createMemo(() => a() + b() + c());
    const product = createMemo(() => a() * b() * c());

    solidBatch(() => {
      setA(() => 4);
      setB(() => 5);
      setC(() => 6);
    });

    return sum() + product();
  });
});