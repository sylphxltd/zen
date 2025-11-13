/**
 * Debug what's in pendingNotifications
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

// Monkey-patch batch to log pendingNotifications
const _originalBatch = batch as any;

const a = zen(1);
const b = zen(2);

const c = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});

let _notificationCount = 0;
subscribe(c, (_val, _oldVal) => {
  _notificationCount++;
});
batch(() => {
  a.value = 10;
  b.value = 20;
});
