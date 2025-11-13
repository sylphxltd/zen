/**
 * Count Solid computes
 */

import { batch, createMemo, createSignal } from 'solid-js';

const ITERATIONS = 1000;

const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);

let _computeCount = 0;
const c = createMemo(() => {
  _computeCount++;
  return a() + b();
});

for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    setA(i);
    setB(i * 2);
  });
  const _ = c();
}
