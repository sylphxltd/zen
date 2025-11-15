/**
 * Comprehensive benchmarks: Zen vs SolidJS
 * Tests signal creation, computed, effects, and complex dependency graphs
 */

import { batch, computed, effect, zen } from '@sylphx/zen';
import { bench, describe } from 'vitest';

// SolidJS imports
import { createEffect, createMemo, createSignal, batch as solidBatch } from 'solid-js';

describe('Signal Creation & Updates', () => {
  bench('Zen: Create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      zen(i);
    }
  });

  bench('SolidJS: Create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      createSignal(i);
    }
  });

  bench('Zen: Update signal 1000 times', () => {
    const count = zen(0);
    for (let i = 0; i < 1000; i++) {
      count.value = i;
    }
  });

  bench('SolidJS: Update signal 1000 times', () => {
    const [_count, setCount] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      setCount(i);
    }
  });
});

describe('Computed Values', () => {
  bench('Zen: Create 1000 computed', () => {
    const count = zen(0);
    for (let i = 0; i < 1000; i++) {
      computed(() => count.value * 2);
    }
  });

  bench('SolidJS: Create 1000 computed', () => {
    const [count] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      createMemo(() => count() * 2);
    }
  });

  bench('Zen: Computed chain depth 100', () => {
    const count = zen(0);
    let current: any = count;
    for (let i = 0; i < 100; i++) {
      const prev = current;
      current = computed(() => prev.value + 1);
    }
    count.value = 1;
    current.value; // Force evaluation
  });

  bench('SolidJS: Computed chain depth 100', () => {
    const [count, setCount] = createSignal(0);
    let current: any = count;
    for (let i = 0; i < 100; i++) {
      const prev = current;
      current = createMemo(() => prev() + 1);
    }
    setCount(1);
    current(); // Force evaluation
  });

  bench('Zen: Diamond dependency (1 → 100 → 1)', () => {
    const root = zen(0);
    const mids = [];
    for (let i = 0; i < 100; i++) {
      mids.push(computed(() => root.value * 2));
    }
    const leaf = computed(() => mids.reduce((sum, m) => sum + m.value, 0));

    for (let i = 0; i < 100; i++) {
      root.value = i;
      leaf.value; // Force evaluation
    }
  });

  bench('SolidJS: Diamond dependency (1 → 100 → 1)', () => {
    const [root, setRoot] = createSignal(0);
    const mids = [];
    for (let i = 0; i < 100; i++) {
      mids.push(createMemo(() => root() * 2));
    }
    const leaf = createMemo(() => mids.reduce((sum, m) => sum + m(), 0));

    for (let i = 0; i < 100; i++) {
      setRoot(i);
      leaf(); // Force evaluation
    }
  });
});

describe('Effects', () => {
  bench('Zen: Effect with 1 dependency, 1000 updates', () => {
    const count = zen(0);
    let _sum = 0;
    effect(() => {
      _sum += count.value;
    });

    for (let i = 0; i < 1000; i++) {
      count.value = i;
    }
  });

  bench('SolidJS: Effect with 1 dependency, 1000 updates', () => {
    const [count, setCount] = createSignal(0);
    let _sum = 0;
    createEffect(() => {
      _sum += count();
    });

    for (let i = 0; i < 1000; i++) {
      setCount(i);
    }
  });

  bench('Zen: Effect with 10 dependencies', () => {
    const signals = Array.from({ length: 10 }, (_, i) => zen(i));
    let _sum = 0;

    effect(() => {
      _sum = signals.reduce((acc, s) => acc + s.value, 0);
    });

    for (let i = 0; i < 100; i++) {
      signals.forEach((s, idx) => {
        s.value = i + idx;
      });
    }
  });

  bench('SolidJS: Effect with 10 dependencies', () => {
    const signals = Array.from({ length: 10 }, (_, i) => createSignal(i));
    let _sum = 0;

    createEffect(() => {
      _sum = signals.reduce((acc, [s]) => acc + s(), 0);
    });

    for (let i = 0; i < 100; i++) {
      signals.forEach(([, set], idx) => {
        set(i + idx);
      });
    }
  });
});

describe('Batching', () => {
  bench('Zen: Batch 1000 updates', () => {
    const count = zen(0);
    let _runs = 0;
    effect(() => {
      count.value;
      _runs++;
    });

    batch(() => {
      for (let i = 0; i < 1000; i++) {
        count.value = i;
      }
    });
  });

  bench('SolidJS: Batch 1000 updates', () => {
    const [count, setCount] = createSignal(0);
    let _runs = 0;
    createEffect(() => {
      count();
      _runs++;
    });

    solidBatch(() => {
      for (let i = 0; i < 1000; i++) {
        setCount(i);
      }
    });
  });

  bench('Zen: Batch with 100 signals, 10 updates each', () => {
    const signals = Array.from({ length: 100 }, (_, i) => zen(i));
    let _sum = 0;

    effect(() => {
      _sum = signals.reduce((acc, s) => acc + s.value, 0);
    });

    for (let i = 0; i < 10; i++) {
      batch(() => {
        signals.forEach((s) => {
          s.value = s.value + 1;
        });
      });
    }
  });

  bench('SolidJS: Batch with 100 signals, 10 updates each', () => {
    const signals = Array.from({ length: 100 }, (_, i) => createSignal(i));
    let _sum = 0;

    createEffect(() => {
      _sum = signals.reduce((acc, [s]) => acc + s(), 0);
    });

    for (let i = 0; i < 10; i++) {
      solidBatch(() => {
        signals.forEach(([, set]) => {
          set((v) => v + 1);
        });
      });
    }
  });
});

describe('Massive Fanout', () => {
  bench('Zen: 1 signal → 1000 computed', () => {
    const root = zen(0);
    const computeds = [];

    for (let i = 0; i < 1000; i++) {
      computeds.push(computed(() => root.value * i));
    }

    for (let i = 0; i < 100; i++) {
      root.value = i;
      computeds.forEach((c) => c.value); // Force evaluation
    }
  });

  bench('SolidJS: 1 signal → 1000 computed', () => {
    const [root, setRoot] = createSignal(0);
    const computeds = [];

    for (let i = 0; i < 1000; i++) {
      computeds.push(createMemo(() => root() * i));
    }

    for (let i = 0; i < 100; i++) {
      setRoot(i);
      computeds.forEach((c) => c()); // Force evaluation
    }
  });

  bench('Zen: 1000 signals → 1 computed', () => {
    const signals = Array.from({ length: 1000 }, (_, i) => zen(i));
    const sum = computed(() => signals.reduce((acc, s) => acc + s.value, 0));

    for (let i = 0; i < 100; i++) {
      signals[i % 1000].value = i;
      sum.value; // Force evaluation
    }
  });

  bench('SolidJS: 1000 signals → 1 computed', () => {
    const signals = Array.from({ length: 1000 }, (_, i) => createSignal(i));
    const sum = createMemo(() => signals.reduce((acc, [s]) => acc + s(), 0));

    for (let i = 0; i < 100; i++) {
      signals[i % 1000][1](i);
      sum(); // Force evaluation
    }
  });
});

describe('Complex Scenarios', () => {
  bench('Zen: TodoMVC-like (100 items, mixed operations)', () => {
    const todos = Array.from({ length: 100 }, (_, i) => ({
      id: zen(i),
      text: zen(`Task ${i}`),
      completed: zen(false),
    }));

    const completedCount = computed(() => todos.filter((t) => t.completed.value).length);

    const allCompleted = computed(() => todos.length > 0 && completedCount.value === todos.length);

    // Simulate user interactions
    for (let i = 0; i < 50; i++) {
      todos[i].completed.value = true;
      completedCount.value;
      allCompleted.value;
    }
  });

  bench('SolidJS: TodoMVC-like (100 items, mixed operations)', () => {
    const todos = Array.from({ length: 100 }, (_, i) => ({
      id: createSignal(i),
      text: createSignal(`Task ${i}`),
      completed: createSignal(false),
    }));

    const completedCount = createMemo(() => todos.filter((t) => t.completed[0]()).length);

    const allCompleted = createMemo(() => todos.length > 0 && completedCount() === todos.length);

    // Simulate user interactions
    for (let i = 0; i < 50; i++) {
      todos[i].completed[1](true);
      completedCount();
      allCompleted();
    }
  });
});
