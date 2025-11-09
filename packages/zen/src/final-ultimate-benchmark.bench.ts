/**
 * Final Ultimate Benchmark: V1 vs V4 vs V5 vs V6 vs Solid
 * The definitive performance comparison
 */

import { bench, describe } from 'vitest';
import { createSignal, createMemo } from 'solid-js';

import { zen, get, set } from './zen';
import { computed } from './computed';
import { signal as signalV4, computed as computedV4 } from './zen-v4';
import { signal as signalV5, computed as computedV5 } from './zen-v5';
import { signal as signalV6, computed as computedV6 } from './zen-v6';

// ============================================================================
// 🔥 CRITICAL: 3-Level Chain
// ============================================================================

describe('🔥 3-Level Chain (1000x)', () => {
  bench('Zen V1', () => {
    const a = zen(1);
    const b = computed([a], (x) => x * 2);
    const c = computed([b], (x) => x + 10);
    const d = computed([c], (x) => x / 2);

    for (let i = 0; i < 1000; i++) {
      set(a, i);
      get(d);
    }
  });

  bench('Zen V4', () => {
    const a = signalV4(1);
    const b = computedV4(() => a() * 2);
    const c = computedV4(() => b()! + 10);
    const d = computedV4(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V5', () => {
    const a = signalV5(1);
    const b = computedV5(() => a() * 2);
    const c = computedV5(() => b()! + 10);
    const d = computedV5(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V6', () => {
    const a = signalV6(1);
    const b = computedV6(() => a() * 2);
    const c = computedV6(() => b()! + 10);
    const d = computedV6(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Solid', () => {
    const [a, setA] = createSignal(1);
    const b = createMemo(() => a() * 2);
    const c = createMemo(() => b() + 10);
    const d = createMemo(() => c() / 2);

    for (let i = 0; i < 1000; i++) {
      setA(i);
      d();
    }
  });
});

// ============================================================================
// 🔥 CRITICAL: Diamond Dependency
// ============================================================================

describe('🔥 Diamond (100x)', () => {
  bench('Zen V1', () => {
    const a = zen(1);
    const b = computed([a], (x) => x * 2);
    const c = computed([a], (x) => x + 10);
    const d = computed([b, c], (x, y) => x + y);

    for (let i = 0; i < 100; i++) {
      set(a, i);
      get(d);
    }
  });

  bench('Zen V4', () => {
    const a = signalV4(1);
    const b = computedV4(() => a() * 2);
    const c = computedV4(() => a() + 10);
    const d = computedV4(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V5', () => {
    const a = signalV5(1);
    const b = computedV5(() => a() * 2);
    const c = computedV5(() => a() + 10);
    const d = computedV5(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V6', () => {
    const a = signalV6(1);
    const b = computedV6(() => a() * 2);
    const c = computedV6(() => a() + 10);
    const d = computedV6(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Solid', () => {
    const [a, setA] = createSignal(1);
    const b = createMemo(() => a() * 2);
    const c = createMemo(() => a() + 10);
    const d = createMemo(() => b() + c());

    for (let i = 0; i < 100; i++) {
      setA(i);
      d();
    }
  });
});

// ============================================================================
// 🔥 CRITICAL: 5-Level Deep
// ============================================================================

describe('🔥 5-Level Deep (100x)', () => {
  bench('Zen V1', () => {
    const a = zen(1);
    const b = computed([a], (x) => x * 2);
    const c = computed([b], (x) => x * 2);
    const d = computed([c], (x) => x * 2);
    const e = computed([d], (x) => x * 2);

    for (let i = 0; i < 100; i++) {
      set(a, i);
      get(e);
    }
  });

  bench('Zen V4', () => {
    const a = signalV4(1);
    const b = computedV4(() => a() * 2);
    const c = computedV4(() => b()! * 2);
    const d = computedV4(() => c()! * 2);
    const e = computedV4(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Zen V5', () => {
    const a = signalV5(1);
    const b = computedV5(() => a() * 2);
    const c = computedV5(() => b()! * 2);
    const d = computedV5(() => c()! * 2);
    const e = computedV5(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Zen V6', () => {
    const a = signalV6(1);
    const b = computedV6(() => a() * 2);
    const c = computedV6(() => b()! * 2);
    const d = computedV6(() => c()! * 2);
    const e = computedV6(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Solid', () => {
    const [a, setA] = createSignal(1);
    const b = createMemo(() => a() * 2);
    const c = createMemo(() => b() * 2);
    const d = createMemo(() => c() * 2);
    const e = createMemo(() => d() * 2);

    for (let i = 0; i < 100; i++) {
      setA(i);
      e();
    }
  });
});

// ============================================================================
// Read/Write
// ============================================================================

describe('Read (1000x)', () => {
  const z1 = zen(0);
  const z4 = signalV4(0);
  const z5 = signalV5(0);
  const z6 = signalV6(0);
  const [s] = createSignal(0);

  bench('Zen V1', () => {
    for (let i = 0; i < 1000; i++) get(z1);
  });

  bench('Zen V4', () => {
    for (let i = 0; i < 1000; i++) z4();
  });

  bench('Zen V5', () => {
    for (let i = 0; i < 1000; i++) z5();
  });

  bench('Zen V6', () => {
    for (let i = 0; i < 1000; i++) z6();
  });

  bench('Solid', () => {
    for (let i = 0; i < 1000; i++) s();
  });
});

describe('Write (1000x)', () => {
  const z1 = zen(0);
  const z4 = signalV4(0);
  const z5 = signalV5(0);
  const z6 = signalV6(0);
  const [, setS] = createSignal(0);

  bench('Zen V1', () => {
    for (let i = 0; i < 1000; i++) set(z1, i);
  });

  bench('Zen V4', () => {
    for (let i = 0; i < 1000; i++) z4.set(i);
  });

  bench('Zen V5', () => {
    for (let i = 0; i < 1000; i++) z5.set(i);
  });

  bench('Zen V6', () => {
    for (let i = 0; i < 1000; i++) z6.set(i);
  });

  bench('Solid', () => {
    for (let i = 0; i < 1000; i++) setS(i);
  });
});
