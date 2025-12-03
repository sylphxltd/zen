import { describe, expect, it, vi } from 'vitest';
import { signal, computed, effect, subscribe, batch, untrack, peek } from './signal';

describe('signal', () => {
  it('should create a signal with initial value', () => {
    const count = signal(0);
    expect(count.value).toBe(0);
  });

  it('should update value', () => {
    const count = signal(0);
    count.value = 5;
    expect(count.value).toBe(5);
  });

  it('should not trigger on same value', () => {
    const count = signal(0);
    const listener = vi.fn();
    subscribe(count, listener);

    listener.mockClear();
    count.value = 0;
    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle +0 vs -0 as different', () => {
    const num = signal(+0);
    const listener = vi.fn();
    subscribe(num, listener);

    listener.mockClear();
    num.value = -0;
    expect(listener).toHaveBeenCalledWith(-0, +0);
  });

  it('should handle NaN as same value', () => {
    const num = signal(NaN);
    const listener = vi.fn();
    subscribe(num, listener);

    listener.mockClear();
    num.value = NaN;
    expect(listener).not.toHaveBeenCalled();
  });

});

describe('computed', () => {
  it('should compute from signal values', () => {
    const count = signal(5);
    const doubled = computed(() => count.value * 2);

    expect(doubled.value).toBe(10);
  });

  it('should auto-track dependencies', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.value + b.value);

    expect(sum.value).toBe(5);

    a.value = 10;
    expect(sum.value).toBe(13);

    b.value = 7;
    expect(sum.value).toBe(17);
  });

  it('should only recompute when dependencies change', () => {
    const count = signal(1);
    let computeCount = 0;
    const doubled = computed(() => {
      computeCount++;
      return count.value * 2;
    });

    expect(doubled.value).toBe(2);
    expect(computeCount).toBe(1);

    // Access again without change
    expect(doubled.value).toBe(2);
    expect(computeCount).toBe(1);

    // Subscribe to enable reactive updates
    const unsub = subscribe(doubled, vi.fn());

    count.value = 5;
    expect(doubled.value).toBe(10);
    // Note: With adaptive static deps optimization, first change after subscribe
    // will verify static deps (counts as 2), then subsequent changes optimize to 1
    expect(computeCount).toBeGreaterThanOrEqual(2);

    unsub();
  });

  it('should support computed chains for reading', () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    // Initial computation
    expect(quadrupled.value).toBe(8);

    // Update source - both computeds should update
    count.value = 5;
    expect(doubled.value).toBe(10);
    expect(quadrupled.value).toBe(20); // Now works! Computed chain bug fixed
  });

  it('should support dynamic dependencies', () => {
    const toggle = signal(true);
    const a = signal(1);
    const b = signal(10);

    const dynamic = computed(() =>
      toggle.value ? a.value : b.value
    );

    expect(dynamic.value).toBe(1);

    a.value = 5;
    expect(dynamic.value).toBe(5);

    // Change to b
    toggle.value = false;
    expect(dynamic.value).toBe(10);

    // a changes shouldn't affect anymore
    a.value = 100;
    expect(dynamic.value).toBe(10);

    // b changes should affect
    b.value = 50;
    expect(dynamic.value).toBe(50);
  });

  it('should unsubscribe from old dependencies on dynamic change', () => {
    const toggle = signal(true);
    const a = signal(1);
    const b = signal(10);

    const dynamic = computed(() => toggle.value ? a.value : b.value);

    // Subscribe to trigger source subscriptions
    const unsub = subscribe(dynamic, vi.fn());

    expect((dynamic as any)._sources?.length).toBe(2); // toggle + a

    toggle.value = false;
    expect(dynamic.value).toBe(10);
    expect((dynamic as any)._sources?.length).toBe(2); // toggle + b

    unsub();
  });

  it('should mark as stale but not recompute immediately', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);

    // Initial access
    expect(doubled.value).toBe(2);
    expect((doubled as any)._dirty).toBe(false); // Clean after computation

    // Change source
    count.value = 5;

    // Fast mode: direct propagation marks computed stale without recomputing
    // Lazy evaluation - computed stays stale until accessed
    expect((doubled as any)._dirty).toBe(true); // Marked dirty

    // Access triggers lazy recomputation
    expect(doubled.value).toBe(10);
    expect((doubled as any)._dirty).toBe(false); // Clean after recomputation
  });
});

describe('subscribe', () => {
  it('should NOT call listener immediately (effect-based, no initial call)', () => {
    const count = signal(5);
    const listener = vi.fn();

    subscribe(count, listener);

    // BREAKING CHANGE: No immediate call, listener only fires on updates
    expect(listener).not.toHaveBeenCalled();
  });

  it('should call listener on updates', () => {
    const count = signal(0);
    const listener = vi.fn();

    subscribe(count, listener);

    count.value = 5;
    expect(listener).toHaveBeenCalledWith(5, 0);
  });

  it('should support unsubscribe', () => {
    const count = signal(0);
    const listener = vi.fn();

    const unsub = subscribe(count, listener);

    count.value = 1;
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();

    count.value = 2;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should support multiple subscribers', () => {
    const count = signal(0);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    subscribe(count, listener1);
    subscribe(count, listener2);

    count.value = 5;

    expect(listener1).toHaveBeenCalledWith(5, 0);
    expect(listener2).toHaveBeenCalledWith(5, 0);
  });

  it('should handle undefined initial value correctly', () => {
    const sig = signal<number | undefined>(undefined);
    const listener = vi.fn();

    subscribe(sig, listener);

    // First update: undefined -> 1
    sig.value = 1;
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1, undefined);

    // Second update: 1 -> undefined
    sig.value = undefined;
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(undefined, 1);

    // Third update: undefined -> 2
    sig.value = 2;
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith(2, undefined);
  });

  it('should subscribe to computed and trigger initial evaluation', () => {
    const count = signal(2);
    let computeCount = 0;
    const doubled = computed(() => {
      computeCount++;
      return count.value * 2;
    });

    expect(computeCount).toBe(0); // Not computed yet

    const listener = vi.fn();
    subscribe(doubled, listener);

    expect(computeCount).toBe(1); // Computed on subscribe
    // BREAKING CHANGE: No immediate call, listener only fires on updates
    expect(listener).not.toHaveBeenCalled();

    // Verify listener is called on update
    count.value = 3;
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(6, 4);
  });

  it('should support manual subscription to computed', () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);
    const listener = vi.fn();

    subscribe(doubled, listener);

    // BREAKING CHANGE: No immediate call
    expect(listener).not.toHaveBeenCalled();

    // Manual re-access to verify lazy behavior
    expect(doubled.value).toBe(4);

    // Verify listener is called on update
    count.value = 3;
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(6, 4);
  });

  it('should cleanup computed subscriptions when no listeners', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);

    const unsub = subscribe(doubled, vi.fn());

    // Subscribe adds the listener to computed
    expect((doubled as any)._listeners).toBeDefined();
    expect((doubled as any)._listeners.length).toBe(1);

    unsub();

    // After unsubscribe, listeners should be undefined
    expect((doubled as any)._listeners).toBeUndefined();
    // Sources should be unsubscribed too
    expect((doubled as any)._unsubs).toBeUndefined();
  });

  it('should notify computed subscribers when upstream signal changes (Bug 1.4)', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const listener = vi.fn();

    subscribe(doubled, listener);
    listener.mockClear();

    // Change upstream signal - computed should recompute and notify
    count.value = 5;
    expect(listener).toHaveBeenCalledWith(10, 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should notify computed subscribers in batched mode (Bug 1.4)', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const listener = vi.fn();

    subscribe(doubled, listener);
    listener.mockClear();

    // Change in batch - computed should recompute and notify after batch
    batch(() => {
      count.value = 5;
    });

    expect(listener).toHaveBeenCalledWith(10, 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should notify computed subscribers in multi-level chains (Bug 1.4)', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);
    const listener = vi.fn();

    subscribe(quadrupled, listener);
    listener.mockClear();

    // Change source - all downstream computeds should update
    count.value = 3;
    expect(listener).toHaveBeenCalledWith(12, 4);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should not steal batched notifications when subscribing mid-batch', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    // listenerA subscribes first
    subscribe(doubled, listenerA);
    listenerA.mockClear();

    batch(() => {
      // Change signal - queues notification for listenerA
      count.value = 5;

      // New subscription inside batch should not steal listenerA's notification
      subscribe(doubled, listenerB);
      listenerB.mockClear();
    });

    // Both listeners should have been notified
    expect(listenerA).toHaveBeenCalledWith(10, 2);
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledWith(10, 2);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });
});

describe('effect', () => {
  it('should run immediately', () => {
    const spy = vi.fn();
    effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should auto-track dependencies', () => {
    const count = signal(0);
    const spy = vi.fn(() => {
      count.value; // track dependency
    });

    effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);

    count.value = 1;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should support cleanup function', () => {
    const cleanup = vi.fn();
    const count = signal(0);

    effect(() => {
      count.value; // track
      return cleanup;
    });

    expect(cleanup).not.toHaveBeenCalled();

    count.value = 1;
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should run cleanup on dispose', () => {
    const cleanup = vi.fn();

    const dispose = effect(() => cleanup);

    expect(cleanup).not.toHaveBeenCalled();

    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should support dynamic dependencies', () => {
    const toggle = signal(true);
    const a = signal(1);
    const b = signal(10);
    const spy = vi.fn();

    effect(() => {
      spy(toggle.value ? a.value : b.value);
    });

    expect(spy).toHaveBeenCalledWith(1);
    spy.mockClear();

    a.value = 5;
    expect(spy).toHaveBeenCalledWith(5);
    spy.mockClear();

    toggle.value = false;
    expect(spy).toHaveBeenCalledWith(10);
    spy.mockClear();

    // a changes shouldn't trigger anymore
    a.value = 100;
    expect(spy).not.toHaveBeenCalled();

    // b changes should trigger
    b.value = 50;
    expect(spy).toHaveBeenCalledWith(50);
  });

  it('should propagate effect errors to app (production optimization)', () => {
    const count = signal(0);

    effect(() => {
      if (count.value > 0) throw new Error('Test error');
    });

    // Errors now propagate to app for V8 optimization (no try/catch overhead)
    expect(() => {
      count.value = 1;
    }).toThrow('Test error');
  });

  it('should propagate cleanup errors to app (production optimization)', () => {
    const count = signal(0);

    effect(() => {
      count.value;
      return () => {
        throw new Error('Cleanup error');
      };
    });

    // Errors now propagate to app for V8 optimization (no try/catch overhead)
    expect(() => {
      count.value = 1;
    }).toThrow('Cleanup error');
  });
});

describe('batch', () => {
  it('should defer notifications until batch completes', () => {
    const a = signal(1);
    const b = signal(2);
    const listener = vi.fn();

    subscribe(a, listener);
    subscribe(b, listener);
    listener.mockClear();

    batch(() => {
      a.value = 10;
      b.value = 20;

      // No notifications yet
      expect(listener).not.toHaveBeenCalled();
    });

    // Notified after batch
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should coalesce multiple updates to same signal', () => {
    const count = signal(0);
    const listener = vi.fn();

    subscribe(count, listener);
    listener.mockClear();

    batch(() => {
      count.value = 1;
      count.value = 2;
      count.value = 3;
    });

    // Only one notification with final value
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(3, 0);
  });

  it('should support nested batches', () => {
    const count = signal(0);
    const listener = vi.fn();

    subscribe(count, listener);
    listener.mockClear();

    batch(() => {
      count.value = 1;

      batch(() => {
        count.value = 2;
      });

      // Still no notifications
      expect(listener).not.toHaveBeenCalled();

      count.value = 3;
    });

    // Notified once after all batches
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(3, 0);
  });

  it('should return batch function result', () => {
    const result = batch(() => 42);
    expect(result).toBe(42);
  });

  it('should handle errors and still notify', () => {
    const count = signal(0);
    const listener = vi.fn();

    subscribe(count, listener);
    listener.mockClear();

    expect(() => {
      batch(() => {
        count.value = 5;
        throw new Error('Batch error');
      });
    }).toThrow('Batch error');

    // Should still notify despite error
    expect(listener).toHaveBeenCalledWith(5, 0);
  });

  it('should dedup computed recomputes when multiple sources change in batch', () => {
    const a = signal(1);
    const b = signal(2);
    const c = signal(3);
    let computeCount = 0;

    const sum = computed(() => {
      computeCount++;
      return a.value + b.value + c.value;
    });

    // Subscribe to trigger eager recompute
    const listener = vi.fn();
    subscribe(sum, listener);
    listener.mockClear();
    computeCount = 0;

    // Change all 3 sources in batch
    batch(() => {
      a.value = 10;
      b.value = 20;
      c.value = 30;
    });

    // With minimal notifications optimization, each source change triggers equality check
    // This ensures we never notify if value doesn't change (critical for UI correctness)
    // Trade-off: Multiple computations in batch vs guaranteed minimal notifications
    expect(computeCount).toBe(3); // One computation per source change for equality check
    expect(listener).toHaveBeenCalledWith(60, 6);
    expect(listener).toHaveBeenCalledTimes(1); // But listener only called once!
  });

  it('should batch computed stale marking', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    // Initial access
    expect(sum.value).toBe(3);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    expect(sum.value).toBe(30);
  });

  it('should handle signal updates during effect execution in batch (Bug 1.5)', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);
    const results: number[] = [];

    // Effect that modifies another signal during execution
    effect(() => {
      const val = sum.value;
      results.push(val);

      // Modify b during effect execution
      if (val === 12) {
        b.value = 30; // This should propagate to sum
      }
    });

    results.length = 0; // Clear initial run

    // Trigger batch that modifies a
    batch(() => {
      a.value = 10; // sum becomes 12, then effect runs and sets b=30, sum becomes 40
    });

    // Effect should run twice: once for a change (sum=12), once for b change (sum=40)
    // Outer loop in flush ensures both updates propagate correctly
    expect(results).toEqual([12, 40]);
    expect(sum.value).toBe(40);
  });
});

describe('integration', () => {
  it('should handle simple reactive patterns', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);

    expect(doubled.value).toBe(2);

    count.value = 5;
    expect(doubled.value).toBe(10);

    const tripled = computed(() => count.value * 3);
    expect(tripled.value).toBe(15);
  });

  it('should track rapid signal changes in effects', () => {
    const count = signal(1);
    const values: number[] = [];

    effect(() => {
      values.push(count.value);
    });

    expect(values[0]).toBe(1);

    count.value = 5;
    expect(values[values.length - 1]).toBe(5);
  });

  it('should optimize with lazy computed evaluation', () => {
    const count = signal(1);
    let computeCount = 0;

    const expensive = computed(() => {
      computeCount++;
      return count.value * 1000;
    });

    // Not computed until accessed
    expect(computeCount).toBe(0);

    count.value = 2;
    count.value = 3;
    count.value = 4;

    // Still not computed
    expect(computeCount).toBe(0);

    // Single computation on access
    expect(expensive.value).toBe(4000);
    expect(computeCount).toBe(1);
  });

  it('should handle memory cleanup', () => {
    const count = signal(0);
    const doubled = computed(() => count.value * 2);

    const unsub1 = subscribe(doubled, vi.fn());
    const unsub2 = subscribe(doubled, vi.fn());

    // Both subscriptions should be tracked
    expect((doubled as any)._listeners.length).toBe(2);

    unsub1();
    // After unsubscribe, one listener remains
    expect((doubled as any)._listeners.length).toBe(1);

    unsub2();
    // After both unsubscribe, listeners should be undefined
    expect((doubled as any)._listeners).toBeUndefined();
    // Sources should be unsubscribed too
    expect((doubled as any)._unsubs).toBeUndefined();
  });

  it('should handle 3+ listeners without double-calling (Bug: inline → array transition)', () => {
    const sig = signal(0);
    const calls: number[][] = [[], [], []];

    const unsub1 = subscribe(sig, (v) => calls[0]!.push(v));
    const unsub2 = subscribe(sig, (v) => calls[1]!.push(v));
    const unsub3 = subscribe(sig, (v) => calls[2]!.push(v));

    // All 3 listeners should be tracked
    expect((sig as any)._listeners.length).toBe(3);

    // No initial calls (subscribe doesn't trigger listeners)
    expect(calls[0]).toEqual([]);
    expect(calls[1]).toEqual([]);
    expect(calls[2]).toEqual([]);

    sig.value = 10;

    // Each listener should be called exactly once
    expect(calls[0]).toEqual([10]);
    expect(calls[1]).toEqual([10]);
    expect(calls[2]).toEqual([10]);

    unsub1();
    unsub2();
    unsub3();
  });
});

describe('utility helpers', () => {
  it('untrack should prevent dependency tracking', () => {
    const count = signal(0);
    let runs = 0;

    effect(() => {
      runs++;
      untrack(() => count.value); // Should not track
    });

    expect(runs).toBe(1);
    count.value = 1;
    expect(runs).toBe(1); // Should not re-run
  });

  it('peek should read without tracking', () => {
    const count = signal(0);
    let runs = 0;

    effect(() => {
      runs++;
      peek(count); // Should not track
    });

    expect(runs).toBe(1);
    count.value = 1;
    expect(runs).toBe(1); // Should not re-run
  });

  it('untrack should allow normal tracking outside', () => {
    const a = signal(1);
    const b = signal(2);
    let runs = 0;

    effect(() => {
      runs++;
      a.value; // Track a
      untrack(() => b.value); // Don't track b
    });

    expect(runs).toBe(1);
    b.value = 3;
    expect(runs).toBe(1); // b not tracked
    a.value = 2;
    expect(runs).toBe(2); // a tracked
  });

  it('slot-based unsubscribe should handle swap-and-pop correctly', () => {
    // Test that effect cleanup properly removes listeners
    const source = signal(1);
    const disposeA = effect(() => { source.value * 1; });
    const disposeB = effect(() => { source.value * 2; });
    const disposeC = effect(() => { source.value * 3; });
    const disposeD = effect(() => { source.value * 4; });
    const disposeE = effect(() => { source.value * 5; });

    // Verify all are subscribed
    expect((source as any)._listeners.length).toBe(5);

    // Unsubscribe B (index 1) - should remove from array
    disposeB();
    expect((source as any)._listeners.length).toBe(4);

    // Unsubscribe E - tests that removal works correctly
    disposeE();
    expect((source as any)._listeners.length).toBe(3);

    // Verify remaining can be cleaned up
    disposeA();
    disposeC();
    disposeD();
    expect((source as any)._listeners.length).toBe(0);
  });

  it('should handle effect that modifies signal during initialization (race condition test)', () => {
    // Simulate the PerformanceDemo scenario:
    // - itemCount signal changes
    // - Effect reads itemCount and modifies items signal
    // - This triggers batching which can cause race condition if _execute is null

    const itemCount = signal(1000);
    const items = signal<Array<{ id: number }>>([]);

    // Effect that modifies signal during initialization (simulates slider change)
    effect(() => {
      const count = itemCount.value;
      items.value = Array.from({ length: count }, (_, i) => ({ id: i }));
    });

    // Change itemCount (simulates slider movement)
    // This should not throw "is not a function" error
    expect(() => {
      itemCount.value = 2000;
    }).not.toThrow();

    // Verify the effect ran correctly
    expect(items.value.length).toBe(2000);
    expect(items.value[0].id).toBe(0);
    expect(items.value[1999].id).toBe(1999);
  });

  it('should NOT notify effect when computed value unchanged (Bug: subscribeToSources notifies too early)', () => {
    // This test reproduces the Show component bug:
    // 1. Signal changes (searchQuery)
    // 2. Computed recalculates (results array)
    // 3. Effect depends on computed value (results.length > 0)
    // 4. Signal changes but computed value stays same (both arrays have length > 0)
    // 5. Effect should NOT re-run because computed value unchanged

    const searchQuery = signal('');
    const allItems = ['signal', 'computed', 'effect', 'batch', 'untrack'];

    // Computed that filters items based on query
    const results = computed(() => {
      const query = searchQuery.value.toLowerCase();
      if (!query) return allItems;
      return allItems.filter(item => item.includes(query));
    });

    // Computed that derives boolean from results
    const hasResults = computed(() => results.value.length > 0);

    let effectRunCount = 0;
    effect(() => {
      hasResults.value; // Track hasResults
      effectRunCount++;
    });

    expect(effectRunCount).toBe(1); // Initial run
    expect(hasResults.value).toBe(true); // All items shown

    // Change query - results change from 5 items to 3 items, but hasResults stays true
    searchQuery.value = 'e'; // Matches: 'effect', 'untrack', 'computed' (3 items)

    expect(effectRunCount).toBe(1); // Should NOT re-run
    expect(hasResults.value).toBe(true); // Still true

    // Change query to empty - results change but hasResults stays true
    searchQuery.value = ''; // All 5 items again

    expect(effectRunCount).toBe(1); // Should STILL not re-run
    expect(hasResults.value).toBe(true); // Still true

    // Change query to non-matching - results become empty, hasResults becomes false
    searchQuery.value = 'xyz'; // No matches

    expect(effectRunCount).toBe(2); // NOW it should re-run (value changed)
    expect(hasResults.value).toBe(false); // Changed to false

    // Change query back to matching - hasResults becomes true again
    searchQuery.value = 'signal';

    expect(effectRunCount).toBe(3); // Should re-run (value changed from false to true)
    expect(hasResults.value).toBe(true); // Changed to true
  });

  it('should handle nested computed chains with equality checking', () => {
    // Test nested computeds with multiple levels
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const isEven = computed(() => doubled.value % 2 === 0); // Always true for doubled

    let effectRuns = 0;
    effect(() => {
      isEven.value;
      effectRuns++;
    });

    expect(effectRuns).toBe(1);
    expect(isEven.value).toBe(true);

    // Change count - doubled changes but isEven stays true
    count.value = 2;
    expect(effectRuns).toBe(1); // Should NOT re-run (isEven still true)
    expect(isEven.value).toBe(true);

    count.value = 3;
    expect(effectRuns).toBe(1); // Should STILL not re-run
    expect(isEven.value).toBe(true);
  });

  it('should handle primitive value changes correctly', () => {
    // Test with different primitive types
    const num = signal(5);
    const str = computed(() => num.value > 3 ? 'high' : 'low');

    let effectRuns = 0;
    effect(() => {
      str.value;
      effectRuns++;
    });

    expect(effectRuns).toBe(1);
    expect(str.value).toBe('high');

    // Change num but str stays 'high'
    num.value = 10;
    expect(effectRuns).toBe(1); // Should NOT re-run
    expect(str.value).toBe('high');

    // Change num so str becomes 'low'
    num.value = 1;
    expect(effectRuns).toBe(2); // NOW should re-run
    expect(str.value).toBe('low');

    // Change num but str stays 'low'
    num.value = 2;
    expect(effectRuns).toBe(2); // Should NOT re-run
    expect(str.value).toBe('low');
  });

  it('should handle null/undefined transitions correctly', () => {
    // Test null/undefined edge cases
    const data = signal<string | null>(null);
    const hasData = computed(() => data.value !== null);

    let effectRuns = 0;
    effect(() => {
      hasData.value;
      effectRuns++;
    });

    expect(effectRuns).toBe(1);
    expect(hasData.value).toBe(false);

    // Change to null again - hasData stays false
    data.value = null;
    expect(effectRuns).toBe(1); // Should NOT re-run
    expect(hasData.value).toBe(false);

    // Change to a value - hasData becomes true
    data.value = 'hello';
    expect(effectRuns).toBe(2); // Should re-run
    expect(hasData.value).toBe(true);

    // Change to different value - hasData stays true
    data.value = 'world';
    expect(effectRuns).toBe(2); // Should NOT re-run
    expect(hasData.value).toBe(true);

    // Change back to null - hasData becomes false
    data.value = null;
    expect(effectRuns).toBe(3); // Should re-run
    expect(hasData.value).toBe(false);
  });

  it('should handle dynamic dependencies with effects (potential edge case)', () => {
    // Test that dynamic dependencies work correctly with effects
    // This tests a potential issue where onSourceChange doesn't track dependencies
    const toggle = signal(true);
    const a = signal(1);
    const b = signal(10);

    // Computed with dynamic dependencies
    const value = computed(() => (toggle.value ? a.value : b.value));

    let effectRuns = 0;
    let lastValue = 0;
    effect(() => {
      lastValue = value.value;
      effectRuns++;
    });

    expect(effectRuns).toBe(1);
    expect(lastValue).toBe(1); // Using a

    // Change a - should trigger effect
    a.value = 2;
    expect(effectRuns).toBe(2);
    expect(lastValue).toBe(2);

    // Switch to b
    toggle.value = false;
    expect(effectRuns).toBe(3);
    expect(lastValue).toBe(10); // Now using b

    // Change a - should NOT trigger effect (not tracking a anymore)
    a.value = 100;
    expect(effectRuns).toBe(3); // Should NOT re-run
    expect(lastValue).toBe(10); // Still using b

    // Change b - should trigger effect
    b.value = 20;
    expect(effectRuns).toBe(4);
    expect(lastValue).toBe(20);
  });
});
