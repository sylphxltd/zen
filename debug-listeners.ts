import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

let _computeCount = 0;
const c = computed([a, b], (aVal, bVal) => {
  _computeCount++;
  return aVal + bVal;
});

// Activate by accessing
c.value;

// Now subscribe
const _unsub = subscribe(c, (_val) => {});

_computeCount = 0;
batch(() => {
  a.value = 10;
  b.value = 20;
});
