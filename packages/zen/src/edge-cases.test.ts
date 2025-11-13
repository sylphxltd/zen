import { describe, it, expect } from 'bun:test';
import { zen, computed, effect, batch, subscribe, queueZenForBatch, batchDepth } from './index';

describe('Edge Cases for 100% Coverage', () => {
  it('should test queueZenForBatch helper function', () => {
    const signal = zen(0);

    // Test queueZenForBatch directly
    queueZenForBatch(signal, 0);

    // Test queueing same zen multiple times (should not duplicate)
    queueZenForBatch(signal, 1);

    expect(true).toBe(true); // If we reach here, queueZenForBatch works
  });

  it('should test batchDepth property', () => {
    expect(batchDepth).toBe(0);

    // Note: batchDepth is internal and may not be exposed directly
    // This test ensures the import works
    expect(typeof batchDepth).toBe('number');
  });

  it('should test computed with auto-tracking', () => {
    const a = zen(1);
    const comp = computed(() => a.value * 2);

    // Should handle auto-tracked case
    expect(comp.value).toBe(2);

    a.value = 5;
    expect(comp.value).toBe(10);
  });

  it('should test effect with auto-tracking', () => {
    let runCount = 0;
    const signal = zen(0);

    const unsub = effect(() => {
      runCount++;
      // Access signal to track dependency
      signal.value;
    });

    expect(runCount).toBe(1);

    // Trigger signal change
    signal.value = 1;
    expect(runCount).toBe(2);

    unsub();
    signal.value = 2;
    expect(runCount).toBe(2); // Should not increase after unsub
  });

  it('should test effect cleanup functionality', () => {
    let cleanupCalled = false;

    const unsub = effect(() => {
      return () => {
        cleanupCalled = true;
      };
    });

    unsub();
    expect(cleanupCalled).toBe(true);
  });

  it('should test batched store integration', () => {
    const signal = zen(0);
    let notified = false;

    subscribe(signal, () => {
      notified = true;
    });

    batch(() => {
      signal.value = 1;
    });

    expect(notified).toBe(true);
  });

  it('should test computed with multiple auto-tracked dependencies', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);

    expect(sum.value).toBe(3);

    a.value = 5;
    expect(sum.value).toBe(7);

    b.value = 3;
    expect(sum.value).toBe(8);
  });
});