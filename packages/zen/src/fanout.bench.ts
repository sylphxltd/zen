/**
 * Fanout Performance Benchmark: Zen vs SolidJS
 *
 * Tests 1 signal → N computed updates performance
 * This is a critical performance indicator for reactive systems
 */

import { bench, describe } from 'vitest';

// Zen imports
import { zen, computed as zenComputed } from './zen';

// Solid imports
import { createMemo, createSignal } from 'solid-js';

// ============================================================================
// FANOUT TESTS: 1 Signal → N Computeds
// ============================================================================

describe('Fanout: 1 → 100 (Wide Fanout)', () => {
  // Setup once
  const zenSource = zen(0);
  const zenComputeds = Array.from({ length: 100 }, () => zenComputed(() => zenSource.value * 2));

  const [solidSource, setSolidSource] = createSignal(0);
  const solidComputeds = Array.from({ length: 100 }, () => createMemo(() => solidSource() * 2));

  bench('Zen: update + read all', () => {
    zenSource.value++;
    for (let i = 0; i < zenComputeds.length; i++) {
      const _ = zenComputeds[i].value;
    }
  });

  bench('Solid: update + read all', () => {
    setSolidSource((v) => v + 1);
    for (let i = 0; i < solidComputeds.length; i++) {
      const _ = solidComputeds[i]();
    }
  });
});

describe('Fanout: 1 → 500 (Large Fanout)', () => {
  // Setup once
  const zenSource = zen(0);
  const zenComputeds = Array.from({ length: 500 }, () => zenComputed(() => zenSource.value * 2));

  const [solidSource, setSolidSource] = createSignal(0);
  const solidComputeds = Array.from({ length: 500 }, () => createMemo(() => solidSource() * 2));

  bench('Zen: update + read all', () => {
    zenSource.value++;
    for (let i = 0; i < zenComputeds.length; i++) {
      const _ = zenComputeds[i].value;
    }
  });

  bench('Solid: update + read all', () => {
    setSolidSource((v) => v + 1);
    for (let i = 0; i < solidComputeds.length; i++) {
      const _ = solidComputeds[i]();
    }
  });
});

describe('Fanout: 1 → 1000 (Massive Fanout)', () => {
  // Setup once
  const zenSource = zen(0);
  const zenComputeds = Array.from({ length: 1000 }, () => zenComputed(() => zenSource.value * 2));

  const [solidSource, setSolidSource] = createSignal(0);
  const solidComputeds = Array.from({ length: 1000 }, () => createMemo(() => solidSource() * 2));

  bench('Zen: update + read all', () => {
    zenSource.value++;
    for (let i = 0; i < zenComputeds.length; i++) {
      const _ = zenComputeds[i].value;
    }
  });

  bench('Solid: update + read all', () => {
    setSolidSource((v) => v + 1);
    for (let i = 0; i < solidComputeds.length; i++) {
      const _ = solidComputeds[i]();
    }
  });
});

// ============================================================================
// FANOUT UPDATE ONLY (No Read): Measure notification overhead
// ============================================================================

describe('Fanout: 1 → 1000 (Update Only, No Read)', () => {
  // Setup once
  const zenSource = zen(0);
  const _zenComputeds = Array.from({ length: 1000 }, () => zenComputed(() => zenSource.value * 2));

  const [solidSource, setSolidSource] = createSignal(0);
  const _solidComputeds = Array.from({ length: 1000 }, () => createMemo(() => solidSource() * 2));

  bench('Zen: update only (eager)', () => {
    zenSource.value++;
  });

  bench('Solid: update only (lazy)', () => {
    setSolidSource((v) => v + 1);
  });
});
