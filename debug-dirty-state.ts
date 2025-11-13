/**
 * Debug why computed stays dirty after batch
 */

import { batch, computed, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

const _c = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
batch(() => {
  a.value = 10;
  b.value = 20;
});
batch(() => {
  a.value = 100;
  b.value = 200;
});
