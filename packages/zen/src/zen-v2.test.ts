/**
 * Zen V2 - Basic Functionality Tests
 */

import { describe, expect, it } from 'vitest';
import { signal, computed, batch } from './zen-v2';

describe('Zen V2 - Signal', () => {
  it('should create a signal with initial value', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('should update signal value', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('should support polymorphic setter', () => {
    const count = signal(0);
    count(10);
    expect(count()).toBe(10);
  });

  it('should notify subscribers', () => {
    const count = signal(0);
    let received = -1;

    count.subscribe((v) => {
      received = v;
    });

    count.set(5);
    expect(received).toBe(5);
  });

  it('should unsubscribe correctly', () => {
    const count = signal(0);
    let callCount = 0;

    const unsub = count.subscribe(() => {
      callCount++;
    });

    count.set(1);
    unsub();
    count.set(2);

    // subscribe calls immediately (1) + set(1) calls (1) = 2
    // set(2) does not call because unsub was called
    expect(callCount).toBe(2);
  });
});

describe('Zen V2 - Computed', () => {
  it('should create computed value', () => {
    const count = signal(5);
    const doubled = computed(() => count() * 2);

    expect(doubled()).toBe(10);
  });

  it('should auto-track dependencies', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a() + b());

    expect(sum()).toBe(5);

    a.set(10);
    expect(sum()).toBe(13);

    b.set(20);
    expect(sum()).toBe(30);
  });

  it('should cache computed values', () => {
    const count = signal(5);
    let computeCount = 0;

    const doubled = computed(() => {
      computeCount++;
      return count() * 2;
    });

    // First read
    expect(doubled()).toBe(10);
    expect(computeCount).toBe(1);

    // Second read (should be cached)
    expect(doubled()).toBe(10);
    expect(computeCount).toBe(1);

    // Update source
    count.set(10);

    // Read again (should recompute)
    expect(doubled()).toBe(20);
    expect(computeCount).toBe(2);
  });

  it('should support chained computed', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => b()! + 10);
    const d = computed(() => c()! / 2);

    expect(d()).toBe(6); // (1 * 2 + 10) / 2 = 6

    a.set(5);
    expect(d()).toBe(10); // (5 * 2 + 10) / 2 = 10
  });

  it('should handle diamond dependency', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => a() + 10);
    const d = computed(() => b()! + c()!);

    expect(d()).toBe(13); // (1 * 2) + (1 + 10) = 13

    a.set(5);
    expect(d()).toBe(25); // (5 * 2) + (5 + 10) = 25
  });
});

describe('Zen V2 - Batch', () => {
  it('should batch updates', () => {
    const count = signal(0);
    let callCount = 0;

    count.subscribe(() => {
      callCount++;
    });

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(3);
    });

    // subscribe calls immediately (1) + batch end calls (1) = 2
    expect(callCount).toBe(2);
    expect(count()).toBe(3);
  });

  it('should batch nested updates', () => {
    const a = signal(0);
    const b = signal(0);
    let callCount = 0;

    const sum = computed(() => a() + b());
    sum.subscribe(() => {
      callCount++;
    });

    batch(() => {
      a.set(1);
      b.set(2);
      batch(() => {
        a.set(10);
        b.set(20);
      });
    });

    // subscribe calls immediately (1) + batch end calls (1) = 2
    expect(callCount).toBe(2);
    expect(sum()).toBe(30);
  });
});

describe('Zen V2 - Bidirectional Slots', () => {
  it('should use O(1) unsubscribe with slots', () => {
    const source = signal(0);
    const c1 = computed(() => source() * 2);
    const c2 = computed(() => source() * 3);
    const c3 = computed(() => source() * 4);

    // Trigger all computeds to subscribe
    c1();
    c2();
    c3();

    // Check internal structure
    const node = source._node;
    expect(node.observers?.length).toBe(3);
    expect(node.observerSlots?.length).toBe(3);

    // This should use O(1) removal via slots
    // (implementation detail, just verify it works)
    source.set(1);
    expect(c1()).toBe(2);
    expect(c2()).toBe(3);
    expect(c3()).toBe(4);
  });
});
