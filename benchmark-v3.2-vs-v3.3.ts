/**
 * Benchmark: v3.2 vs v3.3 Lazy Optimization
 * Compare batching performance before and after lazy evaluation
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';
import { createMemo, createSignal, batch as solidBatch } from 'solid-js';

const ITERATIONS = 100_000;

console.log('=== Zen v3.3 vs Solid.js Performance Comparison ===\n');

// ============================================================================
// Test 1: Unobserved computed (no subscribe) - LAZY case
// ============================================================================
console.log('Test 1: Unobserved computed (pure lazy evaluation)');
console.log('This is where v3.3 should match Solid\'s performance\n');

// Zen v3.3
const zenA1 = zen(1);
const zenB1 = zen(2);
let zenComputes1 = 0;
const zenC1 = computed([zenA1, zenB1], (a, b) => {
  zenComputes1++;
  return a + b;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA1.value = i;
    zenB1.value = i * 2;
  });
  const _ = zenC1.value;
}

// Benchmark
zenComputes1 = 0;
const zenStart1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA1.value = i;
    zenB1.value = i * 2;
  });
  const _ = zenC1.value;
}
const zenTime1 = performance.now() - zenStart1;

// Solid
const [solidA1, setSolidA1] = createSignal(1);
const [solidB1, setSolidB1] = createSignal(2);
let solidComputes1 = 0;
const solidC1 = createMemo(() => {
  solidComputes1++;
  return solidA1() + solidB1();
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}

// Benchmark
solidComputes1 = 0;
const solidStart1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}
const solidTime1 = performance.now() - solidStart1;

console.log(`Zen v3.3:   ${zenTime1.toFixed(2)}ms (${zenComputes1.toLocaleString()} computes)`);
console.log(`Solid:      ${solidTime1.toFixed(2)}ms (${solidComputes1.toLocaleString()} computes)`);
console.log(`Ratio:      ${(zenTime1 / solidTime1).toFixed(2)}x ${zenTime1 > solidTime1 ? 'slower' : 'faster'}`);
console.log();

// ============================================================================
// Test 2: Observed computed (with subscribe) - Should be similar
// ============================================================================
console.log('Test 2: Observed computed (with subscription)');
console.log('Both should compute eagerly during batch\n');

// Zen v3.3
const zenA2 = zen(1);
const zenB2 = zen(2);
let zenComputes2 = 0;
const zenC2 = computed([zenA2, zenB2], (a, b) => {
  zenComputes2++;
  return a + b;
});
let zenListenerCalls2 = 0;
const zenUnsub2 = subscribe(zenC2, () => zenListenerCalls2++);

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA2.value = i;
    zenB2.value = i * 2;
  });
}

// Benchmark
zenComputes2 = 0;
zenListenerCalls2 = 0;
const zenStart2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA2.value = i;
    zenB2.value = i * 2;
  });
}
const zenTime2 = performance.now() - zenStart2;

// Solid
const [solidA2, setSolidA2] = createSignal(1);
const [solidB2, setSolidB2] = createSignal(2);
let solidComputes2 = 0;
const solidC2 = createMemo(() => {
  solidComputes2++;
  return solidA2() + solidB2();
});
let solidListenerCalls2 = 0;
// Create effect to simulate subscription
import { createEffect } from 'solid-js';
createEffect(() => {
  solidC2();
  solidListenerCalls2++;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}

// Benchmark
solidComputes2 = 0;
solidListenerCalls2 = 0;
const solidStart2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}
const solidTime2 = performance.now() - solidStart2;

console.log(`Zen v3.3:   ${zenTime2.toFixed(2)}ms (${zenComputes2.toLocaleString()} computes, ${zenListenerCalls2.toLocaleString()} listener calls)`);
console.log(`Solid:      ${solidTime2.toFixed(2)}ms (${solidComputes2.toLocaleString()} computes, ${solidListenerCalls2.toLocaleString()} listener calls)`);
console.log(`Ratio:      ${(zenTime2 / solidTime2).toFixed(2)}x ${zenTime2 > solidTime2 ? 'slower' : 'faster'}`);
console.log();

// ============================================================================
// Test 3: Batch without access - FULLY LAZY
// ============================================================================
console.log('Test 3: Batch without access (fully lazy)');
console.log('Neither should compute if value is never accessed\n');

// Zen v3.3
const zenA3 = zen(1);
const zenB3 = zen(2);
let zenComputes3 = 0;
const zenC3 = computed([zenA3, zenB3], (a, b) => {
  zenComputes3++;
  return a + b;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA3.value = i;
    zenB3.value = i * 2;
  });
}

// Benchmark
zenComputes3 = 0;
const zenStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA3.value = i;
    zenB3.value = i * 2;
  });
  // Don't access zenC3.value
}
const zenTime3 = performance.now() - zenStart3;

// Solid
const [solidA3, setSolidA3] = createSignal(1);
const [solidB3, setSolidB3] = createSignal(2);
let solidComputes3 = 0;
const solidC3 = createMemo(() => {
  solidComputes3++;
  return solidA3() + solidB3();
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA3(i);
    setSolidB3(i * 2);
  });
}

// Benchmark
solidComputes3 = 0;
const solidStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA3(i);
    setSolidB3(i * 2);
  });
  // Don't access solidC3()
}
const solidTime3 = performance.now() - solidStart3;

console.log(`Zen v3.3:   ${zenTime3.toFixed(2)}ms (${zenComputes3.toLocaleString()} computes - should be 0)`);
console.log(`Solid:      ${solidTime3.toFixed(2)}ms (${solidComputes3.toLocaleString()} computes - should be 0)`);
console.log(`Ratio:      ${(zenTime3 / solidTime3).toFixed(2)}x ${zenTime3 > solidTime3 ? 'slower' : 'faster'}`);
console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('=== Performance Summary ===');
console.log(`Test 1 (Unobserved): Zen ${(zenTime1 / solidTime1).toFixed(2)}x vs Solid`);
console.log(`Test 2 (Observed):   Zen ${(zenTime2 / solidTime2).toFixed(2)}x vs Solid`);
console.log(`Test 3 (No access):  Zen ${(zenTime3 / solidTime3).toFixed(2)}x vs Solid`);
console.log();

// Overall assessment
const avgRatio = ((zenTime1 / solidTime1) + (zenTime2 / solidTime2) + (zenTime3 / solidTime3)) / 3;
console.log(`Average performance: ${avgRatio.toFixed(2)}x vs Solid`);
console.log();

if (zenComputes3 === 0 && solidComputes3 === 0) {
  console.log('✅ LAZY OPTIMIZATION: Both Zen and Solid skip unnecessary computations');
} else if (zenComputes3 === 0) {
  console.log('✅ ZEN LAZY: Zen successfully skips unnecessary computations');
} else {
  console.log('❌ NOT FULLY LAZY: Some computations still happening without access');
}

console.log();
if (avgRatio < 2) {
  console.log('🎉 ZEN v3.3 IS COMPETITIVE WITH SOLID!');
} else if (avgRatio < 5) {
  console.log('✅ Good progress, but still room for improvement');
} else {
  console.log('⚠️  Significant performance gap remains');
}

zenUnsub2();
