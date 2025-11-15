/**
 * Comprehensive Reactivity Benchmark
 * Based on js-reactivity-benchmark patterns by milomg
 * Comparing Zen vs SolidJS across multiple scenarios
 */

import { createEffect, createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { bench, describe } from 'vitest';
import { batch, computed, effect, zen } from '../dist/index.js';

// ============================================================================
// 1. DIAMOND PATTERN (Classic glitch-free test)
// ============================================================================

describe('Diamond Pattern', () => {
  bench('Zen: diamond with 1k updates', () => {
    const source = zen(0);
    const left = computed(() => source.value * 2);
    const right = computed(() => source.value + 10);
    const result = computed(() => left.value + right.value);

    let _sum = 0;
    effect(() => {
      _sum += result.value;
    });

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('Solid: diamond with 1k updates', () => {
    const [source, setSource] = createSignal(0);
    const left = createMemo(() => source() * 2);
    const right = createMemo(() => source() + 10);
    const result = createMemo(() => left() + right());

    let _sum = 0;
    createEffect(() => {
      _sum += result();
    });

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });
});

// ============================================================================
// 2. TRIANGLE PATTERN (Testing propagation efficiency)
// ============================================================================

describe('Triangle Pattern', () => {
  bench('Zen: triangle 1->2->1 pattern', () => {
    const a = zen(0);
    const b = computed(() => a.value + 1);
    const c = computed(() => a.value + 2);
    const d = computed(() => b.value + c.value);

    let _sum = 0;
    effect(() => {
      _sum += d.value;
    });

    for (let i = 0; i < 1000; i++) {
      a.value = i;
    }
  });

  bench('Solid: triangle 1->2->1 pattern', () => {
    const [a, setA] = createSignal(0);
    const b = createMemo(() => a() + 1);
    const c = createMemo(() => a() + 2);
    const d = createMemo(() => b() + c());

    let _sum = 0;
    createEffect(() => {
      _sum += d();
    });

    for (let i = 0; i < 1000; i++) {
      setA(i);
    }
  });
});

// ============================================================================
// 3. REPEATED OBSERVERS (Testing fanout performance)
// ============================================================================

describe('Repeated Observers (Fanout)', () => {
  bench('Zen: 1 source -> 100 computeds', () => {
    const source = zen(0);
    const computeds = Array.from({ length: 100 }, (_, i) => computed(() => source.value + i));

    let _sum = 0;
    for (const c of computeds) {
      effect(() => {
        _sum += c.value;
      });
    }

    for (let i = 0; i < 100; i++) {
      source.value = i;
    }
  });

  bench('Solid: 1 source -> 100 memos', () => {
    const [source, setSource] = createSignal(0);
    const memos = Array.from({ length: 100 }, (_, i) => createMemo(() => source() + i));

    let _sum = 0;
    for (const m of memos) {
      createEffect(() => {
        _sum += m();
      });
    }

    for (let i = 0; i < 100; i++) {
      setSource(i);
    }
  });
});

// ============================================================================
// 4. DEEP PROPAGATION (Testing chain efficiency)
// ============================================================================

describe('Deep Propagation', () => {
  bench('Zen: 10-level chain', () => {
    const source = zen(0);
    let current: any = source;

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = computed(() => {
        const val = prev.value ?? prev;
        return val + 1;
      });
    }

    let _sum = 0;
    effect(() => {
      _sum += current.value;
    });

    for (let i = 0; i < 200; i++) {
      source.value = i;
    }
  });

  bench('Solid: 10-level chain', () => {
    const [source, setSource] = createSignal(0);
    let current: any = source;

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = createMemo(() => prev() + 1);
    }

    let _sum = 0;
    createEffect(() => {
      _sum += current();
    });

    for (let i = 0; i < 200; i++) {
      setSource(i);
    }
  });
});

// ============================================================================
// 5. BROAD PROPAGATION (Wide dependency graph)
// ============================================================================

describe('Broad Propagation', () => {
  bench('Zen: 50 sources merged', () => {
    const sources = Array.from({ length: 50 }, () => zen(0));
    const sum = computed(() => {
      let total = 0;
      for (const s of sources) {
        total += s.value;
      }
      return total;
    });

    let _result = 0;
    effect(() => {
      _result = sum.value;
    });

    for (let i = 0; i < 100; i++) {
      sources[i % 50].value = i;
    }
  });

  bench('Solid: 50 sources merged', () => {
    const sources = Array.from({ length: 50 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of sources) {
        total += get();
      }
      return total;
    });

    let _result = 0;
    createEffect(() => {
      _result = sum();
    });

    for (let i = 0; i < 100; i++) {
      sources[i % 50][1](i);
    }
  });
});

// ============================================================================
// 6. CREATION OVERHEAD
// ============================================================================

describe('Creation Overhead', () => {
  bench('Zen: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      zen(i);
    }
  });

  bench('Solid: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      createSignal(i);
    }
  });

  bench('Zen: create 1000 computeds', () => {
    const source = zen(0);
    for (let i = 0; i < 1000; i++) {
      computed(() => source.value * i);
    }
  });

  bench('Solid: create 1000 memos', () => {
    const [source] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      createMemo(() => source() * i);
    }
  });
});

// ============================================================================
// 7. BATCHING EFFICIENCY
// ============================================================================

describe('Batching Efficiency', () => {
  bench('Zen: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));
    const sum = computed(() => {
      let total = 0;
      for (const s of signals) {
        total += s.value;
      }
      return total;
    });

    let _result = 0;
    effect(() => {
      _result = sum.value;
    });

    for (let i = 0; i < 100; i++) {
      batch(() => {
        for (const s of signals) {
          s.value = i;
        }
      });
    }
  });

  bench('Solid: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of signals) {
        total += get();
      }
      return total;
    });

    let _result = 0;
    createEffect(() => {
      _result = sum();
    });

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        for (const [_, set] of signals) {
          set(i);
        }
      });
    }
  });
});

// ============================================================================
// 8. UNSTABLE (Dynamic dependencies)
// ============================================================================

describe('Unstable Dependencies', () => {
  bench('Zen: alternating dependencies', () => {
    const a = zen(0);
    const b = zen(0);
    const toggle = zen(true);

    const result = computed(() => {
      return toggle.value ? a.value : b.value;
    });

    let _sum = 0;
    effect(() => {
      _sum += result.value;
    });

    for (let i = 0; i < 500; i++) {
      if (i % 2 === 0) {
        toggle.value = !toggle.value;
      } else {
        a.value = i;
        b.value = i * 2;
      }
    }
  });

  bench('Solid: alternating dependencies', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const [toggle, setToggle] = createSignal(true);

    const result = createMemo(() => {
      return toggle() ? a() : b();
    });

    let _sum = 0;
    createEffect(() => {
      _sum += result();
    });

    for (let i = 0; i < 500; i++) {
      if (i % 2 === 0) {
        setToggle(!toggle());
      } else {
        setA(i);
        setB(i * 2);
      }
    }
  });
});

// ============================================================================
// 9. MIXED GRAPH (Complex real-world scenario)
// ============================================================================

describe('Mixed Graph', () => {
  bench('Zen: complex mixed graph', () => {
    // 10 sources
    const sources = Array.from({ length: 10 }, () => zen(0));

    // First layer: 20 computeds (each uses 2 sources)
    const layer1 = Array.from({ length: 20 }, (_, i) => {
      const idx1 = i % 10;
      const idx2 = (i + 1) % 10;
      return computed(() => sources[idx1].value + sources[idx2].value);
    });

    // Second layer: 10 computeds (each uses 2 from layer1)
    const layer2 = Array.from({ length: 10 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return computed(() => layer1[idx1].value * layer1[idx2].value);
    });

    // Final result
    const result = computed(() => {
      let sum = 0;
      for (const c of layer2) {
        sum += c.value;
      }
      return sum;
    });

    let _finalSum = 0;
    effect(() => {
      _finalSum = result.value;
    });

    for (let i = 0; i < 50; i++) {
      sources[i % 10].value = i;
    }
  });

  bench('Solid: complex mixed graph', () => {
    // 10 sources
    const sources = Array.from({ length: 10 }, () => createSignal(0));

    // First layer: 20 memos (each uses 2 sources)
    const layer1 = Array.from({ length: 20 }, (_, i) => {
      const idx1 = i % 10;
      const idx2 = (i + 1) % 10;
      return createMemo(() => sources[idx1][0]() + sources[idx2][0]());
    });

    // Second layer: 10 memos (each uses 2 from layer1)
    const layer2 = Array.from({ length: 10 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return createMemo(() => layer1[idx1]() * layer1[idx2]());
    });

    // Final result
    const result = createMemo(() => {
      let sum = 0;
      for (const m of layer2) {
        sum += m();
      }
      return sum;
    });

    let _finalSum = 0;
    createEffect(() => {
      _finalSum = result();
    });

    for (let i = 0; i < 50; i++) {
      sources[i % 10][1](i);
    }
  });
});
