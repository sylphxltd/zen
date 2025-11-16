import { describe, expect, it, vi } from 'vitest';
import { zen, computed, effect, subscribe, batch } from './zen';

describe('zen', () => {
  it('should create a zen signal with initial value', () => {
    const count = zen(0);
    expect(count.value).toBe(0);
  });

  it('should update value', () => {
    const count = zen(0);
    count.value = 5;
    expect(count.value).toBe(5);
  });

  it('should not trigger on same value', () => {
    const count = zen(0);
    const listener = vi.fn();
    subscribe(count, listener);

    listener.mockClear();
    count.value = 0;
    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle +0 vs -0 as different', () => {
    const num = zen(+0);
    const listener = vi.fn();
    subscribe(num, listener);

    listener.mockClear();
    num.value = -0;
    expect(listener).toHaveBeenCalledWith(-0, +0);
  });

  it('should handle NaN as same value', () => {
    const num = zen(NaN);
    const listener = vi.fn();
    subscribe(num, listener);

    listener.mockClear();
    num.value = NaN;
    expect(listener).not.toHaveBeenCalled();
  });

});

describe('computed', () => {
  it('should compute from zen values', () => {
    const count = zen(5);
    const doubled = computed(() => count.value * 2);

    expect(doubled.value).toBe(10);
  });

  it('should auto-track dependencies', () => {
    const a = zen(2);
    const b = zen(3);
    const sum = computed(() => a.value + b.value);

    expect(sum.value).toBe(5);

    a.value = 10;
    expect(sum.value).toBe(13);

    b.value = 7;
    expect(sum.value).toBe(17);
  });

  it('should only recompute when dependencies change', () => {
    const count = zen(1);
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

    count.value = 5;
    expect(doubled.value).toBe(10);
    expect(computeCount).toBe(2);
  });

  it('should support computed chains for reading', () => {
    const count = zen(2);
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
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(10);

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
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(10);

    const dynamic = computed(() => toggle.value ? a.value : b.value);

    // Subscribe to trigger source subscriptions
    const unsub = subscribe(dynamic, vi.fn());

    expect(dynamic._sourceUnsubs?.length).toBe(2); // toggle + a

    toggle.value = false;
    expect(dynamic.value).toBe(10);
    expect(dynamic._sourceUnsubs?.length).toBe(2); // toggle + b

    unsub();
  });

  it('should mark as stale but not recompute immediately', () => {
    const count = zen(1);
    const doubled = computed(() => count.value * 2);

    // Initial access
    expect(doubled.value).toBe(2);
    expect(doubled._dirty).toBe(false);

    // Change source
    count.value = 5;

    // Fast mode: direct propagation marks computed stale without recomputing
    // Lazy evaluation - computed stays stale until accessed
    expect(doubled._dirty).toBe(true); // Marked stale, not recomputed yet

    // Access triggers lazy recomputation
    expect(doubled.value).toBe(10);
    expect(doubled._dirty).toBe(false); // Now fresh after access
  });
});

describe('subscribe', () => {
  it('should call listener immediately with current value', () => {
    const count = zen(5);
    const listener = vi.fn();

    subscribe(count, listener);

    expect(listener).toHaveBeenCalledWith(5, undefined);
  });

  it('should call listener on updates', () => {
    const count = zen(0);
    const listener = vi.fn();

    subscribe(count, listener);
    listener.mockClear();

    count.value = 5;
    expect(listener).toHaveBeenCalledWith(5, 0);
  });

  it('should support unsubscribe', () => {
    const count = zen(0);
    const listener = vi.fn();

    const unsub = subscribe(count, listener);
    listener.mockClear();

    count.value = 1;
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();

    count.value = 2;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should support multiple subscribers', () => {
    const count = zen(0);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    subscribe(count, listener1);
    subscribe(count, listener2);

    listener1.mockClear();
    listener2.mockClear();

    count.value = 5;

    expect(listener1).toHaveBeenCalledWith(5, 0);
    expect(listener2).toHaveBeenCalledWith(5, 0);
  });

  it('should subscribe to computed and trigger initial evaluation', () => {
    const count = zen(2);
    let computeCount = 0;
    const doubled = computed(() => {
      computeCount++;
      return count.value * 2;
    });

    expect(computeCount).toBe(0); // Not computed yet

    const listener = vi.fn();
    subscribe(doubled, listener);

    expect(computeCount).toBe(1); // Computed on subscribe
    expect(listener).toHaveBeenCalledWith(4, undefined);
  });

  it('should support manual subscription to computed', () => {
    const count = zen(2);
    const doubled = computed(() => count.value * 2);
    const listener = vi.fn();

    subscribe(doubled, listener);

    expect(listener).toHaveBeenCalledWith(4, undefined);

    // Manual re-access to verify lazy behavior
    expect(doubled.value).toBe(4);
  });

  it('should cleanup computed subscriptions when no listeners', () => {
    const count = zen(1);
    const doubled = computed(() => count.value * 2);

    const unsub = subscribe(doubled, vi.fn());

    expect(doubled._sourceUnsubs).toBeDefined();

    unsub();

    expect(doubled._sourceUnsubs).toBeUndefined();
  });

  it('should notify computed subscribers when upstream signal changes (Bug 1.4)', () => {
    const count = zen(1);
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
    const count = zen(1);
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
    const count = zen(1);
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
});

describe('effect', () => {
  it('should run immediately', () => {
    const spy = vi.fn();
    effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should auto-track dependencies', () => {
    const count = zen(0);
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
    const count = zen(0);

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
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(10);
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

  it('should swallow effect errors', () => {
    const count = zen(0);

    expect(() => {
      effect(() => {
        if (count.value > 0) throw new Error('Test error');
      });
    }).not.toThrow();

    expect(() => {
      count.value = 1;
    }).not.toThrow();
  });

  it('should ignore cleanup errors', () => {
    const count = zen(0);

    expect(() => {
      effect(() => {
        count.value;
        return () => {
          throw new Error('Cleanup error');
        };
      });
    }).not.toThrow();

    expect(() => {
      count.value = 1;
    }).not.toThrow();
  });
});

describe('batch', () => {
  it('should defer notifications until batch completes', () => {
    const a = zen(1);
    const b = zen(2);
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
    const count = zen(0);
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
    const count = zen(0);
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
    const count = zen(0);
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

  it('should batch computed stale marking', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);

    // Initial access
    expect(sum.value).toBe(3);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    expect(sum.value).toBe(30);
  });
});

describe('integration', () => {
  it('should handle simple reactive patterns', () => {
    const count = zen(1);
    const doubled = computed(() => count.value * 2);

    expect(doubled.value).toBe(2);

    count.value = 5;
    expect(doubled.value).toBe(10);

    const tripled = computed(() => count.value * 3);
    expect(tripled.value).toBe(15);
  });

  it('should track zen signal changes in effects', () => {
    const count = zen(1);
    const values: number[] = [];

    effect(() => {
      values.push(count.value);
    });

    expect(values[0]).toBe(1);

    count.value = 5;
    expect(values[values.length - 1]).toBe(5);
  });

  it('should optimize with lazy computed evaluation', () => {
    const count = zen(1);
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
    const count = zen(0);
    const doubled = computed(() => count.value * 2);

    const unsub1 = subscribe(doubled, vi.fn());
    const unsub2 = subscribe(doubled, vi.fn());

    expect(doubled._effectListeners.length).toBe(2);

    unsub1();
    expect(doubled._effectListeners.length).toBe(1);

    unsub2();
    expect(doubled._effectListeners.length).toBe(0);
    expect(doubled._sourceUnsubs).toBeUndefined();
  });
});
