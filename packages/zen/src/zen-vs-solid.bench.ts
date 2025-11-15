/**
 * Comprehensive benchmark comparing Zen vs Solid Signals
 *
 * This benchmark suite tests various reactive programming patterns
 * to identify performance characteristics and optimization opportunities.
 */

import { bench, describe } from 'vitest';

// Zen imports
import { zen, batch as zenBatch, computed as zenComputed, effect as zenEffect } from '@sylphx/zen';

// Solid imports
import { createEffect, createMemo, createSignal, batch as solidBatch } from 'solid-js';

// ============================================================================
// 1. BASIC SIGNAL OPERATIONS
// ============================================================================

describe('Basic Signal: Read/Write Performance', () => {
  bench('Zen: 10k signal writes', () => {
    const signal = zen(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }
  });

  bench('Solid: 10k signal writes', () => {
    const [_value, setValue] = createSignal(0);
    for (let i = 0; i < 10000; i++) {
      setValue(i);
    }
  });

  bench('Zen: 10k signal reads', () => {
    const signal = zen(42);
    let _sum = 0;
    for (let i = 0; i < 10000; i++) {
      _sum += signal.value;
    }
  });

  bench('Solid: 10k signal reads', () => {
    const [value] = createSignal(42);
    let _sum = 0;
    for (let i = 0; i < 10000; i++) {
      _sum += value();
    }
  });

  bench('Zen: alternating read/write (10k)', () => {
    const signal = zen(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
      const _ = signal.value;
    }
  });

  bench('Solid: alternating read/write (10k)', () => {
    const [value, setValue] = createSignal(0);
    for (let i = 0; i < 10000; i++) {
      setValue(i);
      const _ = value();
    }
  });
});

// ============================================================================
// 2. COMPUTED VALUES (DERIVED STATE)
// ============================================================================

describe('Computed: Single Dependency', () => {
  bench('Zen: computed with 1 source, 1k updates', () => {
    const source = zen(0);
    const derived = zenComputed([source], ([v]: [number]) => v * 2);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = derived._value; // Access computed value
    }
  });

  bench('Solid: memo with 1 source, 1k updates', () => {
    const [source, setSource] = createSignal(0);
    const derived = createMemo(() => source() * 2);

    for (let i = 0; i < 1000; i++) {
      setSource(i);
      const _ = derived();
    }
  });
});

describe('Computed: Multiple Dependencies', () => {
  bench('Zen: computed with 5 sources, 1k updates', () => {
    const sources = Array.from({ length: 5 }, () => zen(0));
    const sum = zenComputed(sources, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));

    for (let i = 0; i < 1000; i++) {
      sources[i % 5].value = i;
      const _ = sum._value;
    }
  });

  bench('Solid: memo with 5 sources, 1k updates', () => {
    const signals = Array.from({ length: 5 }, () => createSignal(0));
    const sum = createMemo(() => signals.reduce((acc, [get]) => acc + get(), 0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 5][1](i);
      const _ = sum();
    }
  });

  bench('Zen: computed with 10 sources, 1k updates', () => {
    const sources = Array.from({ length: 10 }, () => zen(0));
    const sum = zenComputed(sources, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));

    for (let i = 0; i < 1000; i++) {
      sources[i % 10].value = i;
      const _ = sum._value;
    }
  });

  bench('Solid: memo with 10 sources, 1k updates', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    const sum = createMemo(() => signals.reduce((acc, [get]) => acc + get(), 0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 10][1](i);
      const _ = sum();
    }
  });
});

describe('Computed: Deep Chains', () => {
  bench('Zen: 5-level deep chain, 500 updates', () => {
    const base = zen(0);
    const c1 = zenComputed([base], ([v]: [number]) => v * 2);
    const c2 = zenComputed([c1], ([v]: [number]) => v + 1);
    const c3 = zenComputed([c2], ([v]: [number]) => v * 3);
    const c4 = zenComputed([c3], ([v]: [number]) => v - 5);
    const c5 = zenComputed([c4], ([v]: [number]) => v * 2);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = c5._value;
    }
  });

  bench('Solid: 5-level deep chain, 500 updates', () => {
    const [base, setBase] = createSignal(0);
    const c1 = createMemo(() => base() * 2);
    const c2 = createMemo(() => c1() + 1);
    const c3 = createMemo(() => c2() * 3);
    const c4 = createMemo(() => c3() - 5);
    const c5 = createMemo(() => c4() * 2);

    for (let i = 0; i < 500; i++) {
      setBase(i);
      const _ = c5();
    }
  });

  bench('Zen: 10-level deep chain, 200 updates', () => {
    const base = zen(0);
    let prev = base;
    const chain: any[] = [];

    for (let i = 0; i < 10; i++) {
      const next = zenComputed([prev], ([v]: [number]) => v * 2 + 1);
      chain.push(next);
      prev = next as any;
    }

    const final = chain[chain.length - 1];
    for (let i = 0; i < 200; i++) {
      base.value = i;
      const _ = final._value;
    }
  });

  bench('Solid: 10-level deep chain, 200 updates', () => {
    const [base, setBase] = createSignal(0);
    let prev: any = base;
    const chain: any[] = [];

    for (let i = 0; i < 10; i++) {
      const next = createMemo(() => prev() * 2 + 1);
      chain.push(next);
      prev = next;
    }

    const final = chain[chain.length - 1];
    for (let i = 0; i < 200; i++) {
      setBase(i);
      const _ = final();
    }
  });
});

describe('Computed: Diamond Pattern', () => {
  bench('Zen: diamond pattern, 1k updates', () => {
    const base = zen(0);
    const left = zenComputed([base], ([v]: [number]) => v * 2);
    const right = zenComputed([base], ([v]: [number]) => v * 3);
    const final = zenComputed([left, right], ([l, r]: [number, number]) => l + r);

    for (let i = 0; i < 1000; i++) {
      base.value = i;
      const _ = final._value;
    }
  });

  bench('Solid: diamond pattern, 1k updates', () => {
    const [base, setBase] = createSignal(0);
    const left = createMemo(() => base() * 2);
    const right = createMemo(() => base() * 3);
    const final = createMemo(() => left() + right());

    for (let i = 0; i < 1000; i++) {
      setBase(i);
      const _ = final();
    }
  });

  bench('Zen: wide diamond (4->2->1), 500 updates', () => {
    const base = zen(0);
    const a = zenComputed([base], ([v]: [number]) => v * 2);
    const b = zenComputed([base], ([v]: [number]) => v * 3);
    const c = zenComputed([base], ([v]: [number]) => v * 4);
    const d = zenComputed([base], ([v]: [number]) => v * 5);
    const e = zenComputed([a, b], ([x, y]: [number, number]) => x + y);
    const f = zenComputed([c, d], ([x, y]: [number, number]) => x + y);
    const final = zenComputed([e, f], ([x, y]: [number, number]) => x + y);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = final._value;
    }
  });

  bench('Solid: wide diamond (4->2->1), 500 updates', () => {
    const [base, setBase] = createSignal(0);
    const a = createMemo(() => base() * 2);
    const b = createMemo(() => base() * 3);
    const c = createMemo(() => base() * 4);
    const d = createMemo(() => base() * 5);
    const e = createMemo(() => a() + b());
    const f = createMemo(() => c() + d());
    const final = createMemo(() => e() + f());

    for (let i = 0; i < 500; i++) {
      setBase(i);
      const _ = final();
    }
  });
});

// ============================================================================
// 3. BATCHING PERFORMANCE
// ============================================================================

describe('Batching: Multiple Updates', () => {
  bench('Zen: batch 100 signal updates', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));

    for (let i = 0; i < 100; i++) {
      zenBatch(() => {
        signals.forEach((s, idx) => {
          s.value = i + idx;
        });
      });
    }
  });

  bench('Solid: batch 100 signal updates', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        signals.forEach(([_, set], idx) => {
          set(i + idx);
        });
      });
    }
  });

  bench('Zen: batch with computed, 100 updates', () => {
    const base = Array.from({ length: 10 }, () => zen(0));
    const sum = zenComputed(base, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));

    for (let i = 0; i < 100; i++) {
      zenBatch(() => {
        base.forEach((s) => {
          s.value = i;
        });
      });
      const _ = sum._value;
    }
  });

  bench('Solid: batch with memo, 100 updates', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    const sum = createMemo(() => signals.reduce((acc, [get]) => acc + get(), 0));

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        signals.forEach(([_, set]) => {
          set(i);
        });
      });
      const _ = sum();
    }
  });
});

// ============================================================================
// 4. COMPLEX SCENARIOS
// ============================================================================

describe('Complex: Large Dependency Graph', () => {
  bench('Zen: 100 signals, 50 computed, diamond patterns', () => {
    // Create base signals
    const bases = Array.from({ length: 100 }, () => zen(0));

    // Create first layer of computed (50 computed, each depends on 2 bases)
    const layer1 = Array.from({ length: 50 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return zenComputed([bases[idx1], bases[idx2]], ([a, b]: [number, number]) => a + b);
    });

    // Create second layer (25 computed, each depends on 2 from layer1)
    const layer2 = Array.from({ length: 25 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return zenComputed([layer1[idx1], layer1[idx2]], ([a, b]: [number, number]) => a * b);
    });

    // Final aggregation
    const final = zenComputed(layer2, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));

    // Update and read
    for (let i = 0; i < 100; i++) {
      bases[i % 100].value = i;
      const _ = final._value;
    }
  });

  bench('Solid: 100 signals, 50 memos, diamond patterns', () => {
    // Create base signals
    const bases = Array.from({ length: 100 }, () => createSignal(0));

    // Create first layer of memos (50 memos, each depends on 2 bases)
    const layer1 = Array.from({ length: 50 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return createMemo(() => bases[idx1][0]() + bases[idx2][0]());
    });

    // Create second layer (25 memos, each depends on 2 from layer1)
    const layer2 = Array.from({ length: 25 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return createMemo(() => layer1[idx1]() * layer1[idx2]());
    });

    // Final aggregation
    const final = createMemo(() => layer2.reduce((acc, memo) => acc + memo(), 0));

    // Update and read
    for (let i = 0; i < 100; i++) {
      bases[i % 100][1](i);
      const _ = final();
    }
  });
});

// ============================================================================
// 5. CREATION/DISPOSAL OVERHEAD
// ============================================================================

describe('Creation: Signal/Computed Instantiation', () => {
  bench('Zen: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = zen(i);
    }
  });

  bench('Solid: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = createSignal(i);
    }
  });

  bench('Zen: create 1000 computed', () => {
    const base = zen(0);
    for (let i = 0; i < 1000; i++) {
      const _ = zenComputed([base], ([v]: [number]) => v * i);
    }
  });

  bench('Solid: create 1000 memos', () => {
    const [base] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      const _ = createMemo(() => base() * i);
    }
  });
});

// ============================================================================
// 6. STRESS TESTS
// ============================================================================

describe('Stress: High-Frequency Updates', () => {
  bench('Zen: 10k rapid updates to single signal', () => {
    const signal = zen(0);
    const derived = zenComputed([signal], ([v]: [number]) => v * 2);

    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }

    const _ = derived._value;
  });

  bench('Solid: 10k rapid updates to single signal', () => {
    const [signal, setSignal] = createSignal(0);
    const derived = createMemo(() => signal() * 2);

    for (let i = 0; i < 10000; i++) {
      setSignal(i);
    }

    const _ = derived();
  });

  bench('Zen: 1k updates across 100 signals', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 100].value = i;
    }
  });

  bench('Solid: 1k updates across 100 signals', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 100][1](i);
    }
  });
});

// ============================================================================
// 7. REAL-WORLD PATTERNS
// ============================================================================

describe('Real-World: Shopping Cart Pattern', () => {
  bench('Zen: shopping cart with computed totals', () => {
    // Item prices
    const items = Array.from({ length: 10 }, (_, i) => zen(10 + i));

    // Item quantities
    const quantities = Array.from({ length: 10 }, () => zen(1));

    // Subtotals for each item
    const subtotals = items.map((price, i) =>
      zenComputed([price, quantities[i]], ([p, q]: [number, number]) => p * q),
    );

    // Total
    const total = zenComputed(subtotals, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));

    // Simulate user interactions
    for (let i = 0; i < 100; i++) {
      quantities[i % 10].value = (i % 5) + 1;
      const _ = total._value;
    }
  });

  bench('Solid: shopping cart with computed totals', () => {
    // Item prices
    const items = Array.from({ length: 10 }, (_, i) => createSignal(10 + i));

    // Item quantities
    const quantities = Array.from({ length: 10 }, () => createSignal(1));

    // Subtotals for each item
    const subtotals = items.map((price, i) => createMemo(() => price[0]() * quantities[i][0]()));

    // Total
    const total = createMemo(() => subtotals.reduce((acc, st) => acc + st(), 0));

    // Simulate user interactions
    for (let i = 0; i < 100; i++) {
      quantities[i % 10][1]((i % 5) + 1);
      const _ = total();
    }
  });
});

describe('Real-World: Form Validation Pattern', () => {
  bench('Zen: form with validation', () => {
    const email = zen('');
    const password = zen('');
    const confirmPassword = zen('');

    const emailValid = zenComputed([email], ([e]: [string]) => e.includes('@') && e.length > 5);

    const passwordValid = zenComputed([password], ([p]: [string]) => p.length >= 8);

    const passwordsMatch = zenComputed(
      [password, confirmPassword],
      ([p, c]: [string, string]) => p === c && p.length > 0,
    );

    const formValid = zenComputed(
      [emailValid, passwordValid, passwordsMatch],
      ([e, p, m]: [boolean, boolean, boolean]) => e && p && m,
    );

    // Simulate form filling
    for (let i = 0; i < 100; i++) {
      email.value = `user${i}@example.com`;
      password.value = `password${i}`;
      confirmPassword.value = `password${i}`;
      const _ = formValid._value;
    }
  });

  bench('Solid: form with validation', () => {
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [confirmPassword, setConfirmPassword] = createSignal('');

    const emailValid = createMemo(() => email().includes('@') && email().length > 5);

    const passwordValid = createMemo(() => password().length >= 8);

    const passwordsMatch = createMemo(
      () => password() === confirmPassword() && password().length > 0,
    );

    const formValid = createMemo(() => emailValid() && passwordValid() && passwordsMatch());

    // Simulate form filling
    for (let i = 0; i < 100; i++) {
      setEmail(`user${i}@example.com`);
      setPassword(`password${i}`);
      setConfirmPassword(`password${i}`);
      const _ = formValid();
    }
  });
});
