/**
 * Debug the batch flow step by step
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);
const c = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
subscribe(c, (_val, _oldVal) => {});

if (a._listeners && a._listeners.length > 0) {
}
batch(() => {
  a.value = 10;
  b.value = 20;
});
