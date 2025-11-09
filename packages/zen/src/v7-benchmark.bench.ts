/**
 * V7 Benchmark: V4 vs V6 vs V7a vs V7b vs Solid
 * Testing if removing duplicate check helps
 */

import { bench, describe } from 'vitest';
import { createSignal, createMemo } from 'solid-js';

import { zen, get, set } from './zen';
import { computed } from './computed';
import { signal as signalV4, computed as computedV4 } from './zen-v4';
import { signal as signalV6, computed as computedV6 } from './zen-v6';
import { signal as signalV7a, computed as computedV7a } from './zen-v7a';
import { signal as signalV7b, computed as computedV7b } from './zen-v7b';

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

  bench('Zen V7a', () => {
    const a = signalV7a(1);
    const b = computedV7a(() => a() * 2);
    const c = computedV7a(() => b()! + 10);
    const d = computedV7a(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V7b', () => {
    const a = signalV7b(1);
    const b = computedV7b(() => a() * 2);
    const c = computedV7b(() => b()! + 10);
    const d = computedV7b(() => c()! / 2);

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

  bench('Zen V7a', () => {
    const a = signalV7a(1);
    const b = computedV7a(() => a() * 2);
    const c = computedV7a(() => a() + 10);
    const d = computedV7a(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V7b', () => {
    const a = signalV7b(1);
    const b = computedV7b(() => a() * 2);
    const c = computedV7b(() => a() + 10);
    const d = computedV7b(() => b()! + c()!);

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

  bench('Zen V7a', () => {
    const a = signalV7a(1);
    const b = computedV7a(() => a() * 2);
    const c = computedV7a(() => b()! * 2);
    const d = computedV7a(() => c()! * 2);
    const e = computedV7a(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Zen V7b', () => {
    const a = signalV7b(1);
    const b = computedV7b(() => a() * 2);
    const c = computedV7b(() => b()! * 2);
    const d = computedV7b(() => c()! * 2);
    const e = computedV7b(() => d()! * 2);

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
  const z6 = signalV6(0);
  const z7a = signalV7a(0);
  const z7b = signalV7b(0);
  const [s] = createSignal(0);

  bench('Zen V1', () => {
    for (let i = 0; i < 1000; i++) get(z1);
  });

  bench('Zen V4', () => {
    for (let i = 0; i < 1000; i++) z4();
  });

  bench('Zen V6', () => {
    for (let i = 0; i < 1000; i++) z6();
  });

  bench('Zen V7a', () => {
    for (let i = 0; i < 1000; i++) z7a();
  });

  bench('Zen V7b', () => {
    for (let i = 0; i < 1000; i++) z7b();
  });

  bench('Solid', () => {
    for (let i = 0; i < 1000; i++) s();
  });
});

describe('Write (1000x)', () => {
  const z1 = zen(0);
  const z4 = signalV4(0);
  const z6 = signalV6(0);
  const z7a = signalV7a(0);
  const z7b = signalV7b(0);
  const [, setS] = createSignal(0);

  bench('Zen V1', () => {
    for (let i = 0; i < 1000; i++) set(z1, i);
  });

  bench('Zen V4', () => {
    for (let i = 0; i < 1000; i++) z4.set(i);
  });

  bench('Zen V6', () => {
    for (let i = 0; i < 1000; i++) z6.set(i);
  });

  bench('Zen V7a', () => {
    for (let i = 0; i < 1000; i++) z7a.set(i);
  });

  bench('Zen V7b', () => {
    for (let i = 0; i < 1000; i++) z7b.set(i);
  });

  bench('Solid', () => {
    for (let i = 0; i < 1000; i++) setS(i);
  });
});
