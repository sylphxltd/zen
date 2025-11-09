/**
 * Zen V4 - Quick Functionality Tests
 */

import { describe, expect, it } from 'vitest';
import { signal, computed } from './zen-v4';

describe('Zen V4 - Basic', () => {
  it('should work with signals', () => {
    const count = signal(0);
    expect(count()).toBe(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('should work with computed', () => {
    const count = signal(5);
    const doubled = computed(() => count() * 2);
    expect(doubled()).toBe(10);
  });

  it('should cache computed values', () => {
    const count = signal(5);
    let computeCount = 0;

    const doubled = computed(() => {
      computeCount++;
      return count() * 2;
    });

    doubled();
    expect(computeCount).toBe(1);

    doubled();
    expect(computeCount).toBe(1); // Cached
  });

  it('should update computed when source changes', () => {
    const count = signal(5);
    const doubled = computed(() => count() * 2);

    expect(doubled()).toBe(10);

    count.set(10);
    expect(doubled()).toBe(20);
  });

  it('should work with 3-level chain', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => b()! + 10);
    const d = computed(() => c()! / 2);

    expect(d()).toBe(6); // (1 * 2 + 10) / 2 = 6

    a.set(5);
    expect(d()).toBe(10); // (5 * 2 + 10) / 2 = 10
  });

  it('should work with diamond dependency', () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => a() + 10);
    const d = computed(() => b()! + c()!);

    expect(d()).toBe(13); // (1 * 2) + (1 + 10) = 13

    a.set(5);
    expect(d()).toBe(25); // (5 * 2) + (5 + 10) = 25
  });

  it('should NOT recompute unnecessarily (lazy)', () => {
    const a = signal(1);
    let bCount = 0;

    const b = computed(() => {
      bCount++;
      return a() * 2;
    });

    // Change a but don't read b
    a.set(5);
    expect(bCount).toBe(0); // ✅ NOT computed

    // Now read b
    expect(b()).toBe(10);
    expect(bCount).toBe(1); // ✅ Computed once
  });
});
