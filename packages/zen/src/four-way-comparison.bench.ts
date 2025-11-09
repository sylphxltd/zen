/**
 * Comprehensive Four-Way Comparison Benchmark
 * Zen V1 vs V2 vs V3 vs SolidJS
 */

import { bench, describe } from 'vitest';
import { createSignal, createMemo, batch as solidBatch } from 'solid-js';

// Zen V1 (current)
import { zen, get, set, batch, subscribe } from './zen';
import { computed } from './computed';

// Zen V2 (bound function, push-based)
import { signal as signalV2, computed as computedV2, batch as batchV2 } from './zen-v2';

// Zen V3 (bound function + pull-based + graph coloring)
import { signal as signalV3, computed as computedV3, batch as batchV3 } from './zen-v3';

// ============================================================================
// 1. Read Performance (1000x)
// ============================================================================

describe('Read Performance (1000x) - All Versions', () => {
  const z1 = zen(0);
  const z2 = signalV2(0);
  const z3 = signalV3(0);
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

  bench('Solid: getter()', () => {
    for (let i = 0; i < 1000; i++) {
      s();
    }
  });
});

// ============================================================================
// 2. Write Performance (1000x)
// ============================================================================

describe('Write Performance (1000x) - All Versions', () => {
  const z1 = zen(0);
  const z2 = signalV2(0);
  const z3 = signalV3(0);
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

  bench('Solid: setter()', () => {
    for (let i = 0; i < 1000; i++) {
      setS(i);
    }
  });
});

// ============================================================================
// 3. Computed - Cached Read (1000x)
// ============================================================================

describe('Computed - Cached Read (1000x) - All Versions', () => {
  const count1 = zen(5);
  const doubled1 = computed([count1], (n) => n * 2);

  const count2 = signalV2(5);
  const doubled2 = computedV2(() => count2() * 2);

  const count3 = signalV3(5);
  const doubled3 = computedV3(() => count3() * 2);

  const [count4] = createSignal(5);
  const doubled4 = createMemo(() => count4() * 2);

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

  bench('Zen V3: computed', () => {
    for (let i = 0; i < 1000; i++) {
      doubled3();
    }
  });

  bench('Solid: createMemo', () => {
    for (let i = 0; i < 1000; i++) {
      doubled4();
    }
  });
});

// ============================================================================
// 4. Computed - Update Source (100x)
// ============================================================================

describe('Computed - Update Source (100x) - All Versions', () => {
  bench('Zen V1: update source', () => {
    const count = zen(0);
    const doubled = computed([count], (n) => n * 2);

    for (let i = 0; i < 100; i++) {
      set(count, i);
      get(doubled);
    }
  });

  bench('Zen V2: update source', () => {
    const count = signalV2(0);
    const doubled = computedV2(() => count() * 2);

    for (let i = 0; i < 100; i++) {
      count.set(i);
      doubled();
    }
  });

  bench('Zen V3: update source', () => {
    const count = signalV3(0);
    const doubled = computedV3(() => count() * 2);

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
// 5. 3-Level Chained Computed (CRITICAL TEST)
// ============================================================================

describe('🔥 3-Level Chain (1000x) - All Versions', () => {
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
    const a = signalV2(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => b()! + 10);
    const d = computedV2(() => c()! / 2);

    for (let i = 0; i < 1000; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V3: 3-level chain', () => {
    const a = signalV3(1);
    const b = computedV3(() => a() * 2);
    const c = computedV3(() => b()! + 10);
    const d = computedV3(() => c()! / 2);

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
// 6. Diamond Dependency (CRITICAL TEST)
// ============================================================================

describe('🔥 Diamond Dependency - All Versions', () => {
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
    const a = signalV2(1);
    const b = computedV2(() => a() * 2);
    const c = computedV2(() => a() + 10);
    const d = computedV2(() => b()! + c()!);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      d();
    }
  });

  bench('Zen V3: diamond graph', () => {
    const a = signalV3(1);
    const b = computedV3(() => a() * 2);
    const c = computedV3(() => a() + 10);
    const d = computedV3(() => b()! + c()!);

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
// 7. 5-Level Deep Tree
// ============================================================================

describe('🔥 5-Level Deep Tree - All Versions', () => {
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

  bench('Zen V3: 5-level tree', () => {
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

// ============================================================================
// 8. Batching
// ============================================================================

describe('Batching - 100 Updates - All Versions', () => {
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
    const count = signalV2(0);
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

  bench('Zen V3: batch', () => {
    const count = signalV3(0);
    const doubled = computedV3(() => count() * 2);
    let result = 0;

    doubled.subscribe((v) => {
      result = v!;
    });

    batchV3(() => {
      for (let i = 0; i < 100; i++) {
        count.set(i);
      }
    });
  });

  bench('Solid: batch', () => {
    const [count, setCount] = createSignal(0);
    const doubled = createMemo(() => count() * 2);
    let result = 0;

    // Solid doesn't have subscribe, use createEffect
    // For benchmark fairness, we'll just track the value
    doubled();

    solidBatch(() => {
      for (let i = 0; i < 100; i++) {
        setCount(i);
      }
    });
  });
});

// ============================================================================
// 9. 10 Sources (Dependency Collection)
// ============================================================================

describe('10 Sources - Dependency Collection - All Versions', () => {
  bench('Zen V1: 10 sources', () => {
    const sources = Array.from({ length: 10 }, (_, i) => zen(i));
    const derived = computed(sources, (...vals) => vals.reduce((a, b) => a + b, 0));

    for (let i = 0; i < 100; i++) {
      set(sources[i % 10], i);
      get(derived);
    }
  });

  bench('Zen V2: 10 sources', () => {
    const sources = Array.from({ length: 10 }, (_, i) => signalV2(i));
    const derived = computedV2(() => sources.reduce((sum, s) => sum + s(), 0));

    for (let i = 0; i < 100; i++) {
      sources[i % 10].set(i);
      derived();
    }
  });

  bench('Zen V3: 10 sources', () => {
    const sources = Array.from({ length: 10 }, (_, i) => signalV3(i));
    const derived = computedV3(() => sources.reduce((sum, s) => sum + s(), 0));

    for (let i = 0; i < 100; i++) {
      sources[i % 10].set(i);
      derived();
    }
  });

  bench('Solid: 10 sources', () => {
    const sources = Array.from({ length: 10 }, (_, i) => createSignal(i));
    const derived = createMemo(() => sources.reduce((sum, [get]) => sum + get(), 0));

    for (let i = 0; i < 100; i++) {
      sources[i % 10][1](i);
      derived();
    }
  });
});
