/**
 * Count how many times computed actually runs
 */

import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 1000;

const a = zen(1);
const b = zen(2);

let _computeCount = 0;
const c = computed([a, b], (aVal, bVal) => {
  _computeCount++;
  return aVal + bVal;
});
const _initial = c.value;

_computeCount = 0; // Reset counter

for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
  const _ = c.value;
}
