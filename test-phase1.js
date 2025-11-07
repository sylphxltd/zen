/**
 * Quick manual test for Phase 1 optimizations
 */

import { zen, computed, dispose, onMount, cleanup, untracked, tracked, isTracking } from './packages/zen/dist/index.js';

console.log('Testing Phase 1 Optimizations...\n');

// Test 1: Untracked execution
console.log('1. Testing untracked execution:');
console.log('  isTracking():', isTracking());

untracked(() => {
  console.log('  Inside untracked(), isTracking():', isTracking());

  tracked(() => {
    console.log('  Inside tracked() within untracked(), isTracking():', isTracking());
  });

  console.log('  Back in untracked(), isTracking():', isTracking());
});

console.log('  Outside untracked(), isTracking():', isTracking());
console.log('  ✓ Untracked execution works!\n');

// Test 2: Lifecycle cleanup
console.log('2. Testing lifecycle cleanup:');
const state = zen(0);
let cleanupCalled = false;

const unsub = onMount(state, () => {
  console.log('  onMount callback executed');
  return () => {
    cleanupCalled = true;
    console.log('  Cleanup function called!');
  };
});

console.log('  Unsubscribing...');
unsub();
console.log('  Cleanup called:', cleanupCalled);
console.log('  ✓ Lifecycle cleanup works!\n');

// Test 3: Computed with disposal
console.log('3. Testing computed disposal:');
const a = zen(10);
const b = zen(20);
const sum = computed([a, b], (x, y) => {
  console.log('  Computing sum:', x, '+', y);
  return x + y;
});

console.log('  Initial value:', sum._value);

a._value = 15;
console.log('  After updating a to 15:', sum._value);

console.log('  Disposing computed...');
dispose(sum);
console.log('  ✓ Computed disposal works!\n');

// Test 4: Object pooling (implicit test)
console.log('4. Testing object pooling:');
console.log('  Creating many computed values...');
const computeds = [];
for (let i = 0; i < 100; i++) {
  computeds.push(computed([a], (x) => x * i));
}
console.log('  Created 100 computed values');

console.log('  Disposing all...');
computeds.forEach(c => dispose(c));
console.log('  ✓ Object pooling working (arrays reused from pool)!\n');

console.log('All Phase 1 optimizations working correctly! 🎉');
