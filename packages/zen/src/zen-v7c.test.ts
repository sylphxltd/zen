/**
 * Zen V7c - Tests (Graph Coloring + Permanent Deps)
 */

import { describe, expect, it } from 'vitest';
import { signal, computed } from './zen-v7c';

describe('Zen V7c - Basic', () => {
  it('signal basics', () => {
    const count = signal(0);
    expect(count()).toBe(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('computed basics', () => {
    const count = signal(5);
    const doubled = computed(() => count() * 2);
    expect(doubled()).toBe(10);

    count.set(10);
    expect(doubled()).toBe(20);
  });

  it('3-level chain', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => b()! + 10);
    const d = computed(() => c()! / 2);

    expect(d()).toBe(6);

    a.set(5);
    expect(d()).toBe(10);
  });

  it('diamond dependency', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => a() + 10);
    const d = computed(() => b()! + c()!);

    expect(d()).toBe(13);

    a.set(5);
    expect(d()).toBe(25);
  });

  it('lazy evaluation', () => {
    const a = signal(1);
    let bCount = 0;

    const b = computed(() => {
      bCount++;
      return a() * 2;
    });

    a.set(5);
    expect(bCount).toBe(0); // ✅ Lazy

    expect(b()).toBe(10);
    expect(bCount).toBe(1);
  });

  it('caching', () => {
    const a = signal(1);
    let bCount = 0;

    const b = computed(() => {
      bCount++;
      return a() * 2;
    });

    b();
    expect(bCount).toBe(1);

    b();
    expect(bCount).toBe(1); // ✅ Cached
  });

  it('graph coloring optimization', () => {
    const a = signal(1);
    let bCount = 0;
    let cCount = 0;
    let dCount = 0;

    const b = computed(() => {
      bCount++;
      return a() * 2;
    });

    const c = computed(() => {
      cCount++;
      return a() + 10;
    });

    const d = computed(() => {
      dCount++;
      return b()! + c()!;
    });

    // Initial read
    expect(d()).toBe(13);
    expect(bCount).toBe(1);
    expect(cCount).toBe(1);
    expect(dCount).toBe(1);

    // Update a
    a.set(5);

    // Read d again - should skip unnecessary recomputation
    expect(d()).toBe(25);
    expect(bCount).toBe(2);
    expect(cCount).toBe(2);
    expect(dCount).toBe(2);
  });

  it('GREEN state optimization', () => {
    const a = signal(1);
    const b = signal(2);

    let c1Count = 0;
    const c1 = computed(() => {
      c1Count++;
      return a() + b();
    });

    let c2Count = 0;
    const c2 = computed(() => {
      c2Count++;
      return a() * 2;
    });

    let dCount = 0;
    const d = computed(() => {
      dCount++;
      // Only reads c1, not c2
      return c1()! * 10;
    });

    // Initial
    expect(d()).toBe(30); // (1+2)*10
    expect(c1Count).toBe(1);
    expect(c2Count).toBe(0); // Not read
    expect(dCount).toBe(1);

    // Change a - c2 should be marked GREEN but not computed
    a.set(3);
    expect(c2Count).toBe(0); // Still not read

    // Read d - should only recompute c1 and d, not c2
    expect(d()).toBe(50); // (3+2)*10
    expect(c1Count).toBe(2);
    expect(c2Count).toBe(0); // Still not read!
    expect(dCount).toBe(2);
  });
});
