/**
 * Debug listener function type
 */

import { computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

const c = computed([a, b], (aVal, bVal) => aVal + bVal);

subscribe(c, (_val) => {});

if (a._listeners && a._listeners.length > 0) {
  const listener = a._listeners[0];

  // Check if it's been set on the function
  for (const _key in listener) {
  }
}
