/**
 * Micro-benchmark to isolate performance issue
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 10_000;

// Zen
const a1 = zen(1);
const b1 = zen(2);
const c1 = computed([a1, b1], (a, b) => a + b);
for (let i = 0; i < 1000; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value;
}
const zenStart = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value;
}
const _zenTime = performance.now() - zenStart;

// Solid
const [a2, setA2] = createSignal(1);
const [b2, setB2] = createSignal(2);
const c2 = createMemo(() => a2() + b2());
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setA2(i);
    setB2(i * 2);
  });
  const _ = c2();
}
const solidStart = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setA2(i);
    setB2(i * 2);
  });
  const _ = c2();
}
const _solidTime = performance.now() - solidStart;
