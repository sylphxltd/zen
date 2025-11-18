/**
 * Performance Benchmarks - Real measurements
 */

import { expect, test } from 'bun:test';
import { batch, computed, effect, signal } from '../index.js';

test('Signal update performance', () => {
  const sig = signal(0);
  const iterations = 100000;

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    sig.value = i;
  }
  const end = performance.now();

  const _timePerUpdate = ((end - start) / iterations) * 1000; // microseconds

  // Should be very fast
  expect(end - start).toBeLessThan(100); // < 100ms for 100k updates
});

test('Effect execution performance', async () => {
  const sig = signal(0);
  let runCount = 0;

  effect(() => {
    sig.value;
    runCount++;
  });

  const iterations = 10000;
  const _start = performance.now();

  for (let i = 0; i < iterations; i++) {
    sig.value = i;
  }

  // Wait for microtasks to flush
  await new Promise((resolve) => setTimeout(resolve, 10));

  const _end = performance.now();

  expect(runCount).toBeGreaterThan(0);
});

test('Batch performance benefit', async () => {
  const a = signal(0);
  const b = signal(0);
  const c = signal(0);
  let normalRuns = 0;
  let batchedRuns = 0;

  // Test without batch - force microtask flush between updates
  effect(() => {
    a.value;
    b.value;
    c.value;
    normalRuns++;
  });

  const normalStart = performance.now();
  for (let i = 0; i < 100; i++) {
    a.value = i;
    await new Promise((resolve) => setTimeout(resolve, 0)); // Force effect run
    b.value = i;
    await new Promise((resolve) => setTimeout(resolve, 0)); // Force effect run
    c.value = i;
    await new Promise((resolve) => setTimeout(resolve, 0)); // Force effect run
  }
  const normalEnd = performance.now();
  const _normalTime = normalEnd - normalStart;
  const normalRunsTotal = normalRuns;

  // Reset
  normalRuns = 0;
  const a2 = signal(0);
  const b2 = signal(0);
  const c2 = signal(0);

  effect(() => {
    a2.value;
    b2.value;
    c2.value;
    batchedRuns++;
  });

  // Test with batch - synchronous execution
  const batchedStart = performance.now();
  for (let i = 0; i < 100; i++) {
    batch(() => {
      a2.value = i;
      b2.value = i;
      c2.value = i;
    });
  }
  const batchedEnd = performance.now();
  const _batchedTime = batchedEnd - batchedStart;
  const batchedRunsTotal = batchedRuns;

  const _runReduction = (((normalRunsTotal - batchedRunsTotal) / normalRunsTotal) * 100).toFixed(1);

  // Batched should run effects fewer times
  expect(batchedRunsTotal).toBeLessThan(normalRunsTotal);
});

test('Computed caching effectiveness', () => {
  const base = signal(0);
  let computeCount = 0;

  const doubled = computed(() => {
    computeCount++;
    return base.value * 2;
  });

  // Read multiple times without changing base
  const iterations = 10000;
  const _start = performance.now();

  for (let i = 0; i < iterations; i++) {
    doubled.value;
  }

  const _end = performance.now();

  // Should only compute once
  expect(computeCount).toBe(1);
});

test('Single subscriber fast path', () => {
  const sig = signal(0);
  let _runCount = 0;

  effect(() => {
    sig.value;
    _runCount++;
  });

  const iterations = 100000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    sig.value = i;
  }

  const end = performance.now();
  const _timePerUpdate = ((end - start) / iterations) * 1000; // microseconds

  // Should be very fast
  expect(end - start).toBeLessThan(50);
});

test('Many subscribers performance', async () => {
  const sig = signal(0);
  const effectCount = 1000;
  const runCounts: number[] = [];

  // Create many effects
  for (let i = 0; i < effectCount; i++) {
    runCounts[i] = 0;
    effect(() => {
      sig.value;
      runCounts[i]++;
    });
  }

  const _start = performance.now();

  // Update signal
  sig.value = 1;

  // Wait for all effects to run
  await new Promise((resolve) => setTimeout(resolve, 50));

  const _end = performance.now();

  const allRan = runCounts.every((count) => count === 2); // initial + update
  const _totalRuns = runCounts.reduce((a, b) => a + b, 0);

  expect(allRan).toBe(true);
});
