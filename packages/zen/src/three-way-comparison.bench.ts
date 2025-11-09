/**
 * Comprehensive Three-Way Comparison Benchmark
 * Zen V1 (current) vs Zen V2 (bound function) vs SolidJS
 */

import { bench, describe } from 'vitest';
import { createSignal, createMemo, batch as solidBatch, createEffect } from 'solid-js';

// Zen V1 (current)
import { zen, get, set, batch, subscribe } from './zen';
import { computed } from './computed';

// Zen V2 (bound function)
import { signal, computed as computedV2, batch as batchV2 } from './zen-v2';

// ============================================================================
// 1. Creation Overhead
// ============================================================================

describe('Creation - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: zen(0)', () => {
    const z = zen(0);
  });

  bench('Zen V2: signal(0)', () => {
    const s = signal(0);
  });

  bench('Solid: createSignal(0)', () => {
    const [s] = createSignal(0);
  });
});

// ============================================================================
// 2. Read Performance (1000 iterations)
// ============================================================================

describe('Read Performance (1000x) - Zen V1 vs V2 vs Solid', () => {
  const z1 = zen(0);
  const z2 = signal(0);
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

  bench('Solid: getter()', () => {
    for (let i = 0; i < 1000; i++) {
      s();
    }
  });
});

// ============================================================================
// 3. Write Performance (1000 iterations)
// ============================================================================

describe('Write Performance (1000x) - Zen V1 vs V2 vs Solid', () => {
  const z1 = zen(0);
  const z2 = signal(0);
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

  bench('Solid: setter()', () => {
    for (let i = 0; i < 1000; i++) {
      setS(i);
    }
  });
});

// ============================================================================
// 4. Mixed Operations (1000 iterations)
// ============================================================================

describe('Mixed Read/Write (1000x) - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: get/set', () => {
    const a = zen(0);
    const b = zen(0);
    for (let i = 0; i < 1000; i++) {
      set(a, get(b) + 2);
    }
  });

  bench('Zen V2: signal()/set', () => {
    const a = signal(0);
    const b = signal(0);
    for (let i = 0; i < 1000; i++) {
      a.set(b() + 2);
    }
  });

  bench('Solid: getter/setter', () => {
    const [a, setA] = createSignal(0);
    const [b] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      setA(b() + 2);
    }
  });
});

// ============================================================================
// 5. Computed - Cached Read (1000 iterations)
// ============================================================================

describe('Computed - Cached Read (1000x) - Zen V1 vs V2 vs Solid', () => {
  const count1 = zen(5);
  const doubled1 = computed([count1], (n) => n * 2);

  const count2 = signal(5);
  const doubled2 = computedV2(() => count2() * 2);

  const [count3] = createSignal(5);
  const doubled3 = createMemo(() => count3() * 2);

  bench('Zen V1: computed', () => {
    for (let i = 0; i < 1000; i++) {
      get(doubled1);
    }
  });

  bench('Zen V2: computed', () => {
    for (let i = 0; i < 1000; i++) {
      doubled2();
    }
  });

  bench('Solid: createMemo', () => {
    for (let i = 0; i < 1000; i++) {
      doubled3();
    }
  });
});

// ============================================================================
// 6. Computed - Update Source (100 iterations)
// ============================================================================

describe('Computed - Update Source (100x) - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: update source', () => {
    const count = zen(0);
    const doubled = computed([count], (n) => n * 2);

    for (let i = 0; i < 100; i++) {
      set(count, i);
      get(doubled);
    }
  });

  bench('Zen V2: update source', () => {
    const count = signal(0);
    const doubled = computedV2(() => count() * 2);

    for (let i = 0; i < 100; i++) {
      count.set(i);
      doubled();
    }
  });

  bench('Solid: update source', () => {
    const [count, setCount] = createSignal(0);
    const doubled = createMemo(() => count() * 2);

    for (let i = 0; i < 100; i++) {
      setCount(i);
      doubled();
    }
  });
});

// ============================================================================
// 7. Chained Computed (3 levels, 1000 iterations)
// ============================================================================

describe('Chained Computed - 3 Levels (1000x) - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: 3-level chain', () => {
    const a = zen(1);
    const b = computed([a], (x) => x * 2);
    const c = computed([b], (x) => x + 10);
    const d = computed([c], (x) => x / 2);

    for (let i = 0; i < 1000; i++) {
      set(a, i);
      get(d);
    }
  });

  bench('Zen V2: 3-level chain', () => {
    const a = signal(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => b()! + 10);
    const d = computedV2(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Solid: 3-level chain', () => {
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
// 8. Batching (100 updates)
// ============================================================================

describe('Batching - 100 Updates - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: batch', () => {
    const count = zen(0);
    const doubled = computed([count], (n) => n * 2);
    let result = 0;

    subscribe(doubled, (v) => {
      result = v;
    });

    batch(() => {
      for (let i = 0; i < 100; i++) {
        set(count, i);
      }
    });
  });

  bench('Zen V2: batch', () => {
    const count = signal(0);
    const doubled = computedV2(() => count() * 2);
    let result = 0;

    doubled.subscribe((v) => {
      result = v!;
    });

    batchV2(() => {
      for (let i = 0; i < 100; i++) {
        count.set(i);
      }
    });
  });

  bench('Solid: batch', () => {
    const [count, setCount] = createSignal(0);
    const doubled = createMemo(() => count() * 2);
    let result = 0;

    createEffect(() => {
      result = doubled();
    });

    solidBatch(() => {
      for (let i = 0; i < 100; i++) {
        setCount(i);
      }
    });
  });
});

// ============================================================================
// 9. Subscribe/Unsubscribe Cycles (100 cycles)
// ============================================================================

describe('Subscribe/Unsubscribe (100 cycles) - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: sub/unsub cycles', () => {
    const count = zen(0);

    for (let i = 0; i < 100; i++) {
      const unsub = subscribe(count, () => {});
      set(count, i);
      unsub();
    }
  });

  bench('Zen V2: sub/unsub cycles', () => {
    const count = signal(0);

    for (let i = 0; i < 100; i++) {
      const unsub = count.subscribe(() => {});
      count.set(i);
      unsub();
    }
  });

  bench('Solid: effect disposal cycles', () => {
    const [count, setCount] = createSignal(0);

    for (let i = 0; i < 100; i++) {
      let dispose: (() => void) | undefined;
      createEffect((prev) => {
        count();
        if (prev) dispose = prev as any;
        return dispose;
      });
      setCount(i);
      if (dispose) dispose();
    }
  });
});

// ============================================================================
// 10. Diamond Dependency Graph
// ============================================================================

describe('Complex Graph - Diamond Dependency - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: diamond graph', () => {
    const a = zen(1);
    const b = computed([a], (x) => x * 2);
    const c = computed([a], (x) => x + 10);
    const d = computed([b, c], (x, y) => x + y);

    for (let i = 0; i < 100; i++) {
      set(a, i);
      get(d);
    }
  });

  bench('Zen V2: diamond graph', () => {
    const a = signal(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => a() + 10);
    const d = computedV2(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Solid: diamond graph', () => {
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
// 11. Many Independent Signals (100 signals)
// ============================================================================

describe('100 Independent Signals - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: 100 signals', () => {
    const signals = Array.from({ length: 100 }, (_, i) => zen(i));

    for (let i = 0; i < 100; i++) {
      for (const s of signals) {
        set(s, get(s) + 1);
      }
    }
  });

  bench('Zen V2: 100 signals', () => {
    const signals = Array.from({ length: 100 }, (_, i) => signal(i));

    for (let i = 0; i < 100; i++) {
      for (const s of signals) {
        s.set(s() + 1);
      }
    }
  });

  bench('Solid: 100 signals', () => {
    const signals = Array.from({ length: 100 }, (_, i) => createSignal(i));

    for (let i = 0; i < 100; i++) {
      for (const [get, set] of signals) {
        set(get() + 1);
      }
    }
  });
});

// ============================================================================
// 12. Dependency Collection Performance
// ============================================================================

describe('Dependency Collection - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: 10 sources', () => {
    const sources = Array.from({ length: 10 }, (_, i) => zen(i));
    const derived = computed(sources, (...vals) => vals.reduce((a, b) => a + b, 0));

    for (let i = 0; i < 100; i++) {
      set(sources[i % 10], i);
      get(derived);
    }
  });

  bench('Zen V2: 10 sources (auto-track)', () => {
    const sources = Array.from({ length: 10 }, (_, i) => signal(i));
    const derived = computedV2(() => sources.reduce((sum, s) => sum + s(), 0));

    for (let i = 0; i < 100; i++) {
      sources[i % 10].set(i);
      derived();
    }
  });

  bench('Solid: 10 sources (auto-track)', () => {
    const sources = Array.from({ length: 10 }, (_, i) => createSignal(i));
    const derived = createMemo(() => sources.reduce((sum, [get]) => sum + get(), 0));

    for (let i = 0; i < 100; i++) {
      sources[i % 10][1](i);
      derived();
    }
  });
});

// ============================================================================
// 13. Deep Dependency Tree (5 levels)
// ============================================================================

describe('Deep Dependency Tree - 5 Levels - Zen V1 vs V2 vs Solid', () => {
  bench('Zen V1: 5-level tree', () => {
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

  bench('Zen V2: 5-level tree', () => {
    const a = signal(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => b()! * 2);
    const d = computedV2(() => c()! * 2);
    const e = computedV2(() => d()! * 2);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      e();
    }
  });

  bench('Solid: 5-level tree', () => {
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
