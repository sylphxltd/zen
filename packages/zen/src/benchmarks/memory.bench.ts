/**
 * Memory Benchmarks - Real measurements
 */

import { expect, test } from 'bun:test';
import { computed, effect, signal } from '../index.js';

// Measure object size
function roughSizeOfObject(object: any): number {
  const objectList: any[] = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    if (typeof value === 'boolean') {
      bytes += 4;
    } else if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8;
    } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (const prop in value) {
        if (value.hasOwnProperty(prop)) {
          stack.push(value[prop]);
        }
      }
    }
  }
  return bytes;
}

test.skip('Signal memory - bitfield vs Set structure (internal implementation, skipped with @zen/signal)', () => {});

test('Signal creation overhead', () => {
  const count = 1000;

  const start = performance.now();
  const signals = [];
  for (let i = 0; i < count; i++) {
    signals.push(signal(i));
  }
  const end = performance.now();

  const timePerSignal = (end - start) / count;

  // Should be very fast
  expect(timePerSignal).toBeLessThan(0.1);
});

test('Computed overhead', () => {
  const count = 1000;
  const base = signal(0);

  const start = performance.now();
  const computeds = [];
  for (let i = 0; i < count; i++) {
    computeds.push(computed(() => base.value * 2));
  }
  const end = performance.now();

  const timePerComputed = (end - start) / count;

  // Should be fast
  expect(timePerComputed).toBeLessThan(0.2);
});
