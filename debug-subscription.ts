/**
 * Debug subscription state
 */

import { batch, computed, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

const c = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
batch(() => {
  a.value = 10;
  b.value = 20;
});
const _val = c.value;
