// Test to verify computed calculation count in diamond pattern
import { zen, computed, effect } from './dist/index.js';

let leftCount = 0;
let rightCount = 0;
let resultCount = 0;

const source = zen(0);

const left = computed(() => {
  leftCount++;
  return source.value * 2;
});

const right = computed(() => {
  rightCount++;
  return source.value + 10;
});

const result = computed(() => {
  resultCount++;
  return left.value + right.value;
});

let effectCount = 0;
effect(() => {
  effectCount++;
  const _ = result.value;
});

console.log('After setup:');
console.log('  left:', leftCount, 'right:', rightCount, 'result:', resultCount, 'effect:', effectCount);

// Reset counters
leftCount = rightCount = resultCount = effectCount = 0;

// Update source 10 times
for (let i = 0; i < 10; i++) {
  source.value = i;
}

console.log('\nAfter 10 updates:');
console.log('  left:', leftCount, 'right:', rightCount, 'result:', resultCount, 'effect:', effectCount);
console.log('\nExpected: each should be 10 (one calculation per update)');

if (leftCount > 10 || rightCount > 10 || resultCount > 10) {
  console.log('\n❌ REDUNDANT CALCULATIONS DETECTED!');
} else {
  console.log('\n✅ No redundant calculations');
}
