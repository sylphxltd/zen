/**
 * Benchmark: v3.3 Lazy Optimization vs v3.2
 * Test scenario: Unobserved computed (no subscribers)
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 10_000;

console.log('=== Benchmark: Lazy Evaluation (v3.3) ===\n');

// Test 1: Unobserved computed (no subscribe)
console.log('Test 1: Unobserved computed (LAZY)');
const a1 = zen(1);
const b1 = zen(2);
const c1 = computed([a1, b1], (a, b) => a + b);

let computeCount1 = 0;
const a1WithCount = zen(1);
const b1WithCount = zen(2);
const c1WithCount = computed([a1WithCount, b1WithCount], (a, b) => {
  computeCount1++;
  return a + b;
});

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value;
}

// Benchmark
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value; // Access after batch
}
const time1 = performance.now() - start1;

// Count computes during benchmark
computeCount1 = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1WithCount.value = i;
    b1WithCount.value = i * 2;
  });
  const _ = c1WithCount.value;
}

console.log(`Time: ${time1.toFixed(2)}ms`);
console.log(`Compute count: ${computeCount1} (expected: ${ITERATIONS})`);
console.log();

// Test 2: Observed computed (with subscribe)
console.log('Test 2: Observed computed (EAGER)');
const a2 = zen(1);
const b2 = zen(2);
const c2 = computed([a2, b2], (a, b) => a + b);

let computeCount2 = 0;
const a2WithCount = zen(1);
const b2WithCount = zen(2);
const c2WithCount = computed([a2WithCount, b2WithCount], (a, b) => {
  computeCount2++;
  return a + b;
});

// Subscribe to make it observed
let callCount = 0;
const unsub = subscribe(c2WithCount, () => callCount++);

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a2.value = i;
    b2.value = i * 2;
  });
  const _ = c2.value;
}

// Benchmark
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a2.value = i;
    b2.value = i * 2;
  });
  const _ = c2.value;
}
const time2 = performance.now() - start2;

// Count computes during benchmark
computeCount2 = 0;
callCount = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a2WithCount.value = i;
    b2WithCount.value = i * 2;
  });
  const _ = c2WithCount.value;
}

console.log(`Time: ${time2.toFixed(2)}ms`);
console.log(`Compute count: ${computeCount2} (expected: ${ITERATIONS + 1}, +1 for initial)`);
console.log(`Listener calls: ${callCount}`);
console.log();

// Test 3: Batch without access (FULLY LAZY)
console.log('Test 3: Batch without access (FULLY LAZY)');
const a3 = zen(1);
const b3 = zen(2);

let computeCount3 = 0;
const c3 = computed([a3, b3], (a, b) => {
  computeCount3++;
  return a + b;
});

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
}

// Benchmark
const start3 = performance.now();
computeCount3 = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
  // Don't access c3.value - should be fully lazy
}
const time3 = performance.now() - start3;

console.log(`Time: ${time3.toFixed(2)}ms`);
console.log(`Compute count: ${computeCount3} (expected: 0 for lazy, was ${ITERATIONS} in v3.2)`);
console.log();

// Summary
console.log('=== Summary ===');
console.log(`Unobserved + access: ${time1.toFixed(2)}ms (${computeCount1} computes)`);
console.log(`Observed + access: ${time2.toFixed(2)}ms (eager, with listeners)`);
console.log(`No access: ${time3.toFixed(2)}ms (${computeCount3} computes - should be 0!)`);
console.log();

if (computeCount3 === 0) {
  console.log('✅ LAZY OPTIMIZATION SUCCESSFUL!');
  console.log('Computed values without observers are not evaluated during batch.');
} else {
  console.log('❌ STILL EAGER: Computed values evaluated even without access.');
}
