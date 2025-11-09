/**
 * Final Comparison: Zen V1 vs V2 vs V3 vs V4 vs Solid
 * Focus on critical performance tests
 */

import { bench, describe } from 'vitest';
import { createSignal, createMemo } from 'solid-js';

import { zen, get, set } from './zen';
import { computed } from './computed';
import { signal as signalV2, computed as computedV2 } from './zen-v2';
import { signal as signalV3, computed as computedV3 } from './zen-v3';
import { signal as signalV4, computed as computedV4 } from './zen-v4';

// ============================================================================
// 🔥 CRITICAL TEST: 3-Level Chained Computed
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

  bench('Zen V2', () => {
    const a = signalV2(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => b()! + 10);
    const d = computedV2(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V3', () => {
    const a = signalV3(1);
    const b = computedV3(() => a() * 2);
    const c = computedV3(() => b()! + 10);
    const d = computedV3(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
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
// 🔥 CRITICAL TEST: Diamond Dependency
// ============================================================================

describe('🔥 Diamond Dependency (100x)', () => {
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

  bench('Zen V2', () => {
    const a = signalV2(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => a() + 10);
    const d = computedV2(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V3', () => {
    const a = signalV3(1);
    const b = computedV3(() => a() * 2);
    const c = computedV3(() => a() + 10);
    const d = computedV3(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
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
// 🔥 CRITICAL TEST: 5-Level Deep Tree
// ============================================================================

describe('🔥 5-Level Deep Tree (100x)', () => {
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

  bench('Zen V2', () => {
    const a = signalV2(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => b()! * 2);
    const d = computedV2(() => c()! * 2);
    const e = computedV2(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Zen V3', () => {
    const a = signalV3(1);
    const b = computedV3(() => a() * 2);
    const c = computedV3(() => b()! * 2);
    const d = computedV3(() => c()! * 2);
    const e = computedV3(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
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
// Read/Write Performance
// ============================================================================

describe('Read Performance (1000x)', () => {
  const z1 = zen(0);
  const z2 = signalV2(0);
  const z3 = signalV3(0);
  const z4 = signalV4(0);
  const [s] = createSignal(0);

  bench('Zen V1: get()', () => {
    for (let i = 0; i < 1000; i++) {
      get(z1);
    }
  });

  bench('Zen V2: signal()', () => {
    for (let i = 0; i < 1000; i++) {
      z2();
    }
  });

  bench('Zen V3: signal()', () => {
    for (let i = 0; i < 1000; i++) {
      z3();
    }
  });

  bench('Zen V4: signal()', () => {
    for (let i = 0; i < 1000; i++) {
      z4();
    }
  });

  bench('Solid: getter()', () => {
    for (let i = 0; i < 1000; i++) {
      s();
    }
  });
});

describe('Write Performance (1000x)', () => {
  const z1 = zen(0);
  const z2 = signalV2(0);
  const z3 = signalV3(0);
  const z4 = signalV4(0);
  const [, setS] = createSignal(0);

  bench('Zen V1: set()', () => {
    for (let i = 0; i < 1000; i++) {
      set(z1, i);
    }
  });

  bench('Zen V2: signal.set()', () => {
    for (let i = 0; i < 1000; i++) {
      z2.set(i);
    }
  });

  bench('Zen V3: signal.set()', () => {
    for (let i = 0; i < 1000; i++) {
      z3.set(i);
    }
  });

  bench('Zen V4: signal.set()', () => {
    for (let i = 0; i < 1000; i++) {
      z4.set(i);
    }
  });

  bench('Solid: setter()', () => {
    for (let i = 0; i < 1000; i++) {
      setS(i);
    }
  });
});

// ============================================================================
// Computed Cached Read
// ============================================================================

describe('Computed Cached Read (1000x)', () => {
  const count1 = zen(5);
  const doubled1 = computed([count1], (n) => n * 2);

  const count2 = signalV2(5);
  const doubled2 = computedV2(() => count2() * 2);

  const count3 = signalV3(5);
  const doubled3 = computedV3(() => count3() * 2);

  const count4 = signalV4(5);
  const doubled4 = computedV4(() => count4() * 2);

  const [count5] = createSignal(5);
  const doubled5 = createMemo(() => count5() * 2);

  bench('Zen V1', () => {
    for (let i = 0; i < 1000; i++) {
      get(doubled1);
    }
  });

  bench('Zen V2', () => {
    for (let i = 0; i < 1000; i++) {
      doubled2();
    }
  });

  bench('Zen V3', () => {
    for (let i = 0; i < 1000; i++) {
      doubled3();
    }
  });

  bench('Zen V4', () => {
    for (let i = 0; i < 1000; i++) {
      doubled4();
    }
  });

  bench('Solid', () => {
    for (let i = 0; i < 1000; i++) {
      doubled5();
    }
  });
});
