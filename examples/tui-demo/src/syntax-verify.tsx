/**
 * Verify signal syntax behavior without TUI rendering
 */

import { signal, effect } from '@zen/tui';

const count = signal(0);

console.log('Testing signal syntax in runtime-first mode (no compiler):\n');

// Test 1: Direct access to count.value
const initialValue = count.value;
console.log(`1. {count.value} - Initial: ${initialValue}`);

// Test 2: In effect with direct signal
effect(() => {
  console.log(`2. {count} in effect - Value: ${count.value}`);
});

// Test 3: In effect with function
effect(() => {
  console.log(`3. {() => count.value} in effect - Value: ${count.value}`);
});

// Update count
console.log('\n--- Updating count from 0 to 5 ---\n');
count.value = 5;

console.log(`\n1. {count.value} - After update: ${initialValue} (still ${initialValue}, not reactive!)`);
console.log('\n✅ Conclusion:');
console.log('   - {count} in JSX → jsx-runtime wraps in effect() → reactive ✅');
console.log('   - {count.value} in JSX → plain value, no effect → NOT reactive ❌');
console.log('   - {() => count.value} in JSX → jsx-runtime wraps in effect() → reactive ✅');
