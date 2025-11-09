/**
 * Zen V7b - Tests
 */

import { describe, expect, it } from 'vitest';
import { signal, computed } from './zen-v7b';

describe('Zen V7b - Basic', () => {
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

  it('duplicate dependency tracking (same source read multiple times)', () => {
    const a = signal(1);
    let bCount = 0;

    const b = computed(() => {
      bCount++;
      // Read 'a' multiple times in same computation
      return a() + a() + a();
    });

    expect(b()).toBe(3);
    expect(bCount).toBe(1);

    a.set(2);
    expect(b()).toBe(6);
    expect(bCount).toBe(2); // Should only recompute once
  });

  it('complex dependency graph', () => {
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
      return a() * b();
    });

    let dCount = 0;
    const d = computed(() => {
      dCount++;
      return c1()! + c2()!;
    });

    expect(d()).toBe(5); // (1+2) + (1*2) = 5
    expect(c1Count).toBe(1);
    expect(c2Count).toBe(1);
    expect(dCount).toBe(1);

    a.set(3);
    expect(d()).toBe(11); // (3+2) + (3*2) = 11
    expect(c1Count).toBe(2);
    expect(c2Count).toBe(2);
    expect(dCount).toBe(2);
  });
});
