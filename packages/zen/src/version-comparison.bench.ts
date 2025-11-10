/**
 * Version Comparison Benchmark
 *
 * Compares v2.0.0 (current optimized) vs v1.2.1 (latest published)
 * Using dist files for accurate comparison
 */

import { bench, describe } from 'vitest';

// Import current version from local dist
import * as currentZen from '../dist/index.js';

// Dynamic import of published version
const publishedZen = await import('@sylphx/zen');

// ============================================================================
// Basic Signal Operations
// ============================================================================

describe('Basic Signals', () => {
  bench('v1.2.1: zen() creation', () => {
    publishedZen.zen(0);
  });

  bench('v2.0.0: zen() creation', () => {
    currentZen.zen(0);
  });

  const pubSignal = publishedZen.zen(0);
  bench('v1.2.1: get()', () => {
    publishedZen.get(pubSignal);
  });

  const curSignal = currentZen.zen(0);
  bench('v2.0.0: get()', () => {
    currentZen.get(curSignal);
  });

  bench('v1.2.1: set()', () => {
    publishedZen.set(pubSignal, Math.random());
  });

  bench('v2.0.0: set()', () => {
    currentZen.set(curSignal, Math.random());
  });

  // Getter/setter API (v2.0.0 only)
  bench('v2.0.0: signal.value (read)', () => {
    curSignal.value;
  });

  bench('v2.0.0: signal.value = x (write)', () => {
    curSignal.value = Math.random();
  });
});

// ============================================================================
// Subscriptions
// ============================================================================

describe('Subscriptions', () => {
  const pubSig = publishedZen.zen(0);
  bench('v1.2.1: subscribe()', () => {
    const unsub = publishedZen.subscribe(pubSig, () => {});
    unsub();
  });

  const curSig = currentZen.zen(0);
  bench('v2.0.0: subscribe()', () => {
    const unsub = currentZen.subscribe(curSig, () => {});
    unsub();
  });

  const pubSig2 = publishedZen.zen(0);
  let pubCount = 0;
  publishedZen.subscribe(pubSig2, () => pubCount++);
  bench('v1.2.1: notify listeners (1 subscriber)', () => {
    publishedZen.set(pubSig2, Math.random());
  });

  const curSig2 = currentZen.zen(0);
  let curCount = 0;
  currentZen.subscribe(curSig2, () => curCount++);
  bench('v2.0.0: notify listeners (1 subscriber)', () => {
    currentZen.set(curSig2, Math.random());
  });
});

// ============================================================================
// Computed Values
// ============================================================================

describe('Computed', () => {
  const pubA = publishedZen.zen(1);
  const pubB = publishedZen.zen(2);
  const pubComputed = publishedZen.computed([pubA, pubB], (a: number, b: number) => a + b);

  bench('v1.2.1: computed() creation', () => {
    publishedZen.computed([pubA, pubB], (a: number, b: number) => a + b);
  });

  const curA = currentZen.zen(1);
  const curB = currentZen.zen(2);
  const curComputed = currentZen.computed([curA, curB], (a: number, b: number) => a + b);

  bench('v2.0.0: computed() creation', () => {
    currentZen.computed([curA, curB], (a: number, b: number) => a + b);
  });

  bench('v1.2.1: computed get()', () => {
    publishedZen.get(pubComputed);
  });

  bench('v2.0.0: computed get()', () => {
    currentZen.get(curComputed);
  });

  publishedZen.subscribe(pubComputed, () => {});
  bench('v1.2.1: computed update', () => {
    publishedZen.set(pubA, Math.random());
  });

  currentZen.subscribe(curComputed, () => {});
  bench('v2.0.0: computed update', () => {
    currentZen.set(curA, Math.random());
  });
});

// ============================================================================
// Batching
// ============================================================================

describe('Batch Updates', () => {
  const pubSigs = Array.from({ length: 10 }, () => publishedZen.zen(0));
  bench('v1.2.1: batch(10 updates)', () => {
    publishedZen.batch(() => {
      pubSigs.forEach((sig, i) => publishedZen.set(sig, i));
    });
  });

  const curSigs = Array.from({ length: 10 }, () => currentZen.zen(0));
  bench('v2.0.0: batch(10 updates)', () => {
    currentZen.batch(() => {
      curSigs.forEach((sig, i) => currentZen.set(sig, i));
    });
  });
});

// ============================================================================
// Map Operations
// ============================================================================

describe('Map Operations', () => {
  const pubMap = publishedZen.map({ count: 0, name: 'test' });
  bench('v1.2.1: map() creation', () => {
    publishedZen.map({ count: 0, name: 'test' });
  });

  const curMap = currentZen.map({ count: 0, name: 'test' });
  bench('v2.0.0: map() creation', () => {
    currentZen.map({ count: 0, name: 'test' });
  });

  bench('v1.2.1: setKey()', () => {
    publishedZen.setKey(pubMap, 'count', Math.random());
  });

  bench('v2.0.0: setKey()', () => {
    currentZen.setKey(curMap, 'count', Math.random());
  });
});

// ============================================================================
// Complex Scenario: Reactive Graph
// ============================================================================

describe('Complex Reactive Graph', () => {
  // Published version
  const pubRoot = publishedZen.zen(1);
  const pubDerived1 = publishedZen.computed([pubRoot], (x: number) => x * 2);
  const pubDerived2 = publishedZen.computed([pubRoot], (x: number) => x * 3);
  const pubFinal = publishedZen.computed(
    [pubDerived1, pubDerived2],
    (a: number | null, b: number | null) => (a || 0) + (b || 0),
  );
  publishedZen.subscribe(pubFinal, () => {});

  bench('v1.2.1: update reactive graph', () => {
    publishedZen.set(pubRoot, Math.random());
  });

  // Current version
  const curRoot = currentZen.zen(1);
  const curDerived1 = currentZen.computed([curRoot], (x: number) => x * 2);
  const curDerived2 = currentZen.computed([curRoot], (x: number) => x * 3);
  const curFinal = currentZen.computed(
    [curDerived1, curDerived2],
    (a: number | null, b: number | null) => (a || 0) + (b || 0),
  );
  currentZen.subscribe(curFinal, () => {});

  bench('v2.0.0: update reactive graph', () => {
    currentZen.set(curRoot, Math.random());
  });
});

// ============================================================================
// Stress Test: Many Updates
// ============================================================================

describe('Stress Test', () => {
  const pubSig = publishedZen.zen(0);
  bench('v1.2.1: 1000 sequential updates', () => {
    for (let i = 0; i < 1000; i++) {
      publishedZen.set(pubSig, i);
    }
  });

  const curSig = currentZen.zen(0);
  bench('v2.0.0: 1000 sequential updates', () => {
    for (let i = 0; i < 1000; i++) {
      currentZen.set(curSig, i);
    }
  });
});
