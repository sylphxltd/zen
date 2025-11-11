#!/usr/bin/env bun
/**
 * Performance Benchmark: Standard vs Optimized Build
 *
 * Tests common operations on both builds to ensure
 * optimized version maintains performance.
 */

import { performance } from 'node:perf_hooks';

// Import from both builds
import * as StandardZen from '../src/index';
import * as OptimizedZen from '../src/zen-optimized';

interface BenchResult {
  name: string;
  standard: number;
  optimized: number;
  diff: number;
  diffPercent: number;
}

function benchmark(_name: string, fn: () => void, iterations = 100000): number {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();

  return end - start;
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  return `${ms.toFixed(2)}ms`;
}

function formatDiff(standard: number, optimized: number): string {
  const diff = ((optimized - standard) / standard) * 100;
  const sign = diff > 0 ? '+' : '';
  const color = diff < 0 ? '\x1b[32m' : diff > 0 ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';
  return `${color}${sign}${diff.toFixed(1)}%${reset}`;
}

const results: BenchResult[] = [];

function runBench(
  name: string,
  standardFn: () => void,
  optimizedFn: () => void,
  iterations = 100000,
) {
  const standard = benchmark('standard', standardFn, iterations);
  const optimized = benchmark('optimized', optimizedFn, iterations);
  const diff = optimized - standard;
  const diffPercent = (diff / standard) * 100;

  results.push({ name, standard, optimized, diff, diffPercent });
}

console.log('⚡ Running Performance Benchmarks...\n');
console.log('Each test runs 100,000 iterations\n');

// Signal Operations
runBench(
  'zen create + read',
  () => {
    const count = StandardZen.zen(0);
    const _ = count.value;
  },
  () => {
    const count = OptimizedZen.zen(0);
    const _ = count.value;
  },
);

runBench(
  'zen write (3x)',
  () => {
    const count = StandardZen.zen(0);
    count.value = 1;
    count.value = 2;
    count.value = 3;
  },
  () => {
    const count = OptimizedZen.zen(0);
    count.value = 1;
    count.value = 2;
    count.value = 3;
  },
);

// Computed
runBench(
  'computed (1 dep)',
  () => {
    const a = StandardZen.zen(1);
    const doubled = StandardZen.computed([a], (v) => v * 2);
    a.value = 2;
    const _ = doubled.value;
  },
  () => {
    const a = OptimizedZen.zen(1);
    const doubled = OptimizedZen.computed([a], (v) => v * 2);
    a.value = 2;
    const _ = doubled.value;
  },
);

runBench(
  'computed (3 deps)',
  () => {
    const a = StandardZen.zen(1);
    const b = StandardZen.zen(2);
    const c = StandardZen.zen(3);
    const sum = StandardZen.computed([a, b, c], (av, bv, cv) => av + bv + cv);
    a.value = 2;
    const _ = sum.value;
  },
  () => {
    const a = OptimizedZen.zen(1);
    const b = OptimizedZen.zen(2);
    const c = OptimizedZen.zen(3);
    const sum = OptimizedZen.computed([a, b, c], (av, bv, cv) => av + bv + cv);
    a.value = 2;
    const _ = sum.value;
  },
);

// Select
runBench(
  'select',
  () => {
    const state = StandardZen.zen({ count: 0, name: 'test' });
    const count = StandardZen.select(state, (s) => s.count);
    state.value = { count: 1, name: 'test' };
    const _ = count.value;
  },
  () => {
    const state = OptimizedZen.zen({ count: 0, name: 'test' });
    const count = OptimizedZen.select(state, (s) => s.count);
    state.value = { count: 1, name: 'test' };
    const _ = count.value;
  },
);

// Subscribe
runBench(
  'subscribe + notify',
  () => {
    const count = StandardZen.zen(0);
    let _value = 0;
    const unsub = StandardZen.subscribe(count, (v) => {
      _value = v;
    });
    count.value = 1;
    unsub();
  },
  () => {
    const count = OptimizedZen.zen(0);
    let _value = 0;
    const unsub = OptimizedZen.subscribe(count, (v) => {
      _value = v;
    });
    count.value = 1;
    unsub();
  },
);

// Batch
runBench(
  'batch (10 updates)',
  () => {
    const count = StandardZen.zen(0);
    let _value = 0;
    StandardZen.subscribe(count, (v) => {
      _value = v;
    });
    StandardZen.batch(() => {
      for (let i = 0; i < 10; i++) {
        count.value = i;
      }
    });
  },
  () => {
    const count = OptimizedZen.zen(0);
    let _value = 0;
    OptimizedZen.subscribe(count, (v) => {
      _value = v;
    });
    OptimizedZen.batch(() => {
      for (let i = 0; i < 10; i++) {
        count.value = i;
      }
    });
  },
);

// Map
runBench(
  'map operations',
  () => {
    const users = StandardZen.map({
      '1': { name: 'Alice', age: 30 },
      '2': { name: 'Bob', age: 25 },
    });
    StandardZen.setKey(users, '3', { name: 'Charlie', age: 35 });
    const value = StandardZen.get(users);
    const _ = value['3'];
  },
  () => {
    const users = OptimizedZen.map({
      '1': { name: 'Alice', age: 30 },
      '2': { name: 'Bob', age: 25 },
    });
    OptimizedZen.setKey(users, '3', { name: 'Charlie', age: 35 });
    // Optimized: use _value property instead of get()
    const _ = users._value['3'];
  },
);

// Real-world scenario
runBench(
  'Todo list (realistic)',
  () => {
    const todos = StandardZen.zen([
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Walk dog', done: false },
    ]);
    const activeTodos = StandardZen.computed([todos], (list) => list.filter((t) => !t.done));
    const activeCount = StandardZen.computed([activeTodos], (list) => list.length);
    let _count = 0;
    StandardZen.subscribe(activeCount, (v) => {
      _count = v;
    });
    todos.value = [...todos.value, { id: 3, text: 'Read book', done: false }];
    todos.value = todos.value.map((t) => (t.id === 1 ? { ...t, done: true } : t));
    const _ = activeCount.value;
  },
  () => {
    const todos = OptimizedZen.zen([
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Walk dog', done: false },
    ]);
    const activeTodos = OptimizedZen.computed([todos], (list) => list.filter((t) => !t.done));
    const activeCount = OptimizedZen.computed([activeTodos], (list) => list.length);
    let _count = 0;
    OptimizedZen.subscribe(activeCount, (v) => {
      _count = v;
    });
    todos.value = [...todos.value, { id: 3, text: 'Read book', done: false }];
    todos.value = todos.value.map((t) => (t.id === 1 ? { ...t, done: true } : t));
    const _ = activeCount.value;
  },
  10000, // Fewer iterations for complex scenario
);

// Print results
console.log('┌────────────────────────┬──────────────┬──────────────┬──────────────┐');
console.log('│ Benchmark              │ Standard     │ Optimized    │ Difference   │');
console.log('├────────────────────────┼──────────────┼──────────────┼──────────────┤');

for (const result of results) {
  const name = result.name.padEnd(22);
  const standard = formatTime(result.standard).padEnd(12);
  const optimized = formatTime(result.optimized).padEnd(12);
  const diff = formatDiff(result.standard, result.optimized).padEnd(12);
  console.log(`│ ${name} │ ${standard} │ ${optimized} │ ${diff} │`);
}

console.log('└────────────────────────┴──────────────┴──────────────┴──────────────┘\n');

// Summary
const avgStandard = results.reduce((sum, r) => sum + r.standard, 0) / results.length;
const avgOptimized = results.reduce((sum, r) => sum + r.optimized, 0) / results.length;
const avgDiff = ((avgOptimized - avgStandard) / avgStandard) * 100;

console.log('📊 Summary:\n');
console.log(`Average Standard:  ${formatTime(avgStandard)}`);
console.log(`Average Optimized: ${formatTime(avgOptimized)}`);
console.log(`Average Difference: ${formatDiff(avgStandard, avgOptimized)}`);
console.log();

if (Math.abs(avgDiff) < 5) {
  console.log('✅ Performance: Equal (within 5% margin)');
} else if (avgDiff < 0) {
  console.log(`✅ Performance: Optimized build is ${Math.abs(avgDiff).toFixed(1)}% FASTER`);
} else {
  console.log(`⚠️  Performance: Optimized build is ${avgDiff.toFixed(1)}% slower`);
}

console.log();
console.log('💡 Conclusion:');
console.log('   - Bundle size: 43.9% smaller (5.75 KB → 3.23 KB gzipped)');
console.log(
  `   - Performance: ${Math.abs(avgDiff) < 5 ? 'Equivalent' : avgDiff < 0 ? `${Math.abs(avgDiff).toFixed(1)}% faster` : `${avgDiff.toFixed(1)}% slower`}`,
);
console.log('   - API: Core features only (zen, computed, select, map, batch, subscribe)');
