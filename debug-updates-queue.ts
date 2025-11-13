/**
 * Debug Updates queue population during batch
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);
const c = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
let _notificationCount = 0;
subscribe(c, (_val, _oldVal) => {
  _notificationCount++;
});
if (a._listeners && a._listeners.length > 0) {
  const listener = a._listeners[0] as any;
  if (listener._computedZen) {
  }
}

batch(() => {
  a.value = 10;
  b.value = 20;
});
const _finalValue = c.value;
