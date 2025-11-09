/**
 * Simplified Zen vs Preact Benchmark
 * Focus: Core signal operations without effects
 */

import { bench, describe } from 'vitest';
import { signal as createPreactSignal, computed as createPreactComputed } from '@preact/signals-core';
import * as ZenOptimized from './zen-optimized';
import { computed as zenComputed } from './computed';
import { subscribe } from './zen';

// ============================================================================
// BASELINE - Core Signal Operations
// ============================================================================

describe('Signal Creation', () => {
  bench('zen (optimized bind)', () => {
    ZenOptimized.zen(0);
  });

  bench('preact signals', () => {
    createPreactSignal(0);
  });
});

describe('Signal Read (no tracking)', () => {
  const zenSig = ZenOptimized.zen(42);
  const preactSig = createPreactSignal(42);

  bench('zen (optimized bind)', () => {
    zenSig.get();
  });

  bench('preact signals', () => {
    preactSig.value;
  });
});

describe('Signal Write (no listeners)', () => {
  const zenSig = ZenOptimized.zen(0);
  const preactSig = createPreactSignal(0);

  let i = 0;

  bench('zen (optimized bind)', () => {
    zenSig.set(++i);
  });

  bench('preact signals', () => {
    preactSig.value = ++i;
  });
});

// ============================================================================
// WITH LISTENERS
// ============================================================================

describe('Signal Write (with 1 listener)', () => {
  const zenSig = ZenOptimized.zen(0);
  const zenNode = (zenSig as any)._zenData;
  subscribe(zenNode, () => {});

  const preactSig = createPreactSignal(0);
  preactSig.subscribe(() => {});

  let i = 0;

  bench('zen (optimized bind)', () => {
    zenSig.set(++i);
  });

  bench('preact signals', () => {
    preactSig.value = ++i;
  });
});

describe('Signal Write (with 5 listeners)', () => {
  const zenSig = ZenOptimized.zen(0);
  const zenNode = (zenSig as any)._zenData;
  for (let i = 0; i < 5; i++) {
    subscribe(zenNode, () => {});
  }

  const preactSig = createPreactSignal(0);
  for (let i = 0; i < 5; i++) {
    preactSig.subscribe(() => {});
  }

  let i = 0;

  bench('zen (optimized bind)', () => {
    zenSig.set(++i);
  });

  bench('preact signals', () => {
    preactSig.value = ++i;
  });
});

// ============================================================================
// COMPUTED
// ============================================================================

describe('Computed Creation', () => {
  const zenBase = ZenOptimized.zen(10);
  const preactBase = createPreactSignal(10);

  bench('zen (optimized bind)', () => {
    zenComputed(() => zenBase.get() * 2);
  });

  bench('preact signals', () => {
    createPreactComputed(() => preactBase.value * 2);
  });
});

describe('Computed Read', () => {
  const zenBase = ZenOptimized.zen(10);
  const zenMemo = zenComputed(() => zenBase.get() * 2);

  const preactBase = createPreactSignal(10);
  const preactMemo = createPreactComputed(() => preactBase.value * 2);

  bench('zen (optimized bind)', () => {
    zenMemo();
  });

  bench('preact signals', () => {
    preactMemo.value;
  });
});

describe('Computed Update (via signal change)', () => {
  const zenBase = ZenOptimized.zen(0);
  const zenMemo = zenComputed(() => (zenBase as any)._zenData._value * 2);
  subscribe(zenMemo as any, () => {}); // Add listener to force updates

  const preactBase = createPreactSignal(0);
  const preactMemo = createPreactComputed(() => preactBase.value * 2);
  preactMemo.subscribe(() => {}); // Add listener

  let i = 0;

  bench('zen (optimized bind)', () => {
    zenBase.set(++i);
  });

  bench('preact signals', () => {
    preactBase.value = ++i;
  });
});

// ============================================================================
// SCALE TESTS
// ============================================================================

describe('Create 100 Signals', () => {
  bench('zen (optimized bind)', () => {
    Array.from({ length: 100 }, (_, i) => ZenOptimized.zen(i));
  });

  bench('preact signals', () => {
    Array.from({ length: 100 }, (_, i) => createPreactSignal(i));
  });
});

describe('Update 100 Signals (with listeners)', () => {
  const zenSigs = Array.from({ length: 100 }, (_, i) => ZenOptimized.zen(i));
  zenSigs.forEach(sig => subscribe((sig as any)._zenData, () => {}));

  const preactSigs = Array.from({ length: 100 }, (_, i) => createPreactSignal(i));
  preactSigs.forEach(sig => sig.subscribe(() => {}));

  let counter = 0;

  bench('zen (optimized bind)', () => {
    zenSigs.forEach(sig => sig.set(++counter));
  });

  bench('preact signals', () => {
    preactSigs.forEach(sig => sig.value = ++counter);
  });
});

describe('Create 100 Computed', () => {
  const zenBase = ZenOptimized.zen(10);
  const preactBase = createPreactSignal(10);

  bench('zen (optimized bind)', () => {
    Array.from({ length: 100 }, () => zenComputed(() => zenBase.get() * 2));
  });

  bench('preact signals', () => {
    Array.from({ length: 100 }, () => createPreactComputed(() => preactBase.value * 2));
  });
});

// ============================================================================
// COMPLEX SCENARIOS
// ============================================================================

describe('Diamond Dependency (A → B,C → D)', () => {
  const zenA = ZenOptimized.zen(0);
  const zenANode = (zenA as any)._zenData;
  const zenB = zenComputed(() => zenANode._value + 1);
  const zenC = zenComputed(() => zenANode._value + 2);
  const zenD = zenComputed(() => zenB() + zenC());
  subscribe(zenD as any, () => {}); // Add listener

  const preactA = createPreactSignal(0);
  const preactB = createPreactComputed(() => preactA.value + 1);
  const preactC = createPreactComputed(() => preactA.value + 2);
  const preactD = createPreactComputed(() => preactB.value + preactC.value);
  preactD.subscribe(() => {}); // Add listener

  let i = 0;

  bench('zen (optimized bind)', () => {
    zenA.set(++i);
  });

  bench('preact signals', () => {
    preactA.value = ++i;
  });
});
