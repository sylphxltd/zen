/**
 * Debug single iteration in detail
 */

import { batch, computed, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

let _computeCount = 0;
const c = computed([a, b], (aVal, bVal) => {
  _computeCount++;
  return aVal + bVal;
});
const _initial = c.value;

_computeCount = 0;

batch(() => {
  a.value = 10;
  b.value = 20;
});
const _val1 = c.value;

_computeCount = 0;

batch(() => {
  a.value = 100;
  b.value = 200;
});
const _val2 = c.value;
