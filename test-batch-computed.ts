/**
 * Debug the batch computed updates test
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);
const sum = computed([a, b], (aVal, bVal) => aVal + bVal);

let _callCount = 0;
const listener = (_val: number, _oldVal: number | undefined) => {
  _callCount++;
};

subscribe(sum, listener);
const _initial = sum.value;

_callCount = 0; // Reset
batch(() => {
  a.value = 10;
  b.value = 20;
});
