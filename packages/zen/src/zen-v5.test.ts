/**
 * Zen V5 - Quick Tests
 */

import { describe, expect, it } from 'vitest';
import { signal, computed } from './zen-v5';

describe('Zen V5 - Basic', () => {
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
});
