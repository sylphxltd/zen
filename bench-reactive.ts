/**
 * Benchmark reactive case (with subscription)
 */

import { createEffect, createMemo, createSignal, on, batch as solidBatch } from 'solid-js';
import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

// Zen
const a1 = zen(1);
const b1 = zen(2);
const c1 = computed([a1, b1], (a, b) => a + b);

let _zenComputeCount = 0;
subscribe(c1, () => {
  _zenComputeCount++;
});
const zenStart = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
}
const _zenTime = performance.now() - zenStart;

// Solid
const [a2, setA2] = createSignal(1);
const [b2, setB2] = createSignal(2);
const c2 = createMemo(() => a2() + b2());

let _solidComputeCount = 0;
createEffect(
  on(
    c2,
    () => {
      _solidComputeCount++;
    },
    { defer: true },
  ),
);
const solidStart = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setA2(i);
    setB2(i * 2);
  });
}
const _solidTime = performance.now() - solidStart;
