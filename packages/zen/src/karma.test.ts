import { afterEach, describe, expect, it, vi } from 'vitest';
import { getKarmaState, karma, runKarma, subscribeToKarma, karmaCache } from './karma';

// Helper to wait for promises/microtasks
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('karma (Full Reactive)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic reactive caching', () => {
    it('should cache results per parameter', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id, name: `User ${id}` };
      });

      // First call: executes
      const result1 = await runKarma(fetchUser, 1);
      expect(result1).toEqual({ id: 1, name: 'User 1' });
      expect(execCount).toBe(1);

      // Second call (same args): returns cache immediately
      const result2 = await runKarma(fetchUser, 1);
      expect(result2).toEqual({ id: 1, name: 'User 1' });
      expect(execCount).toBe(1); // No re-execution!

      // Third call (different args): executes
      const result3 = await runKarma(fetchUser, 2);
      expect(result3).toEqual({ id: 2, name: 'User 2' });
      expect(execCount).toBe(2);
    });

    it('should return cached data synchronously', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return `Data ${id}`;
      });

      // First call
      await runKarma(fetchData, 1);

      // Second call should resolve immediately (no await needed to verify cache)
      const start = Date.now();
      const result = await runKarma(fetchData, 1);
      const duration = Date.now() - start;

      expect(result).toBe('Data 1');
      expect(duration).toBeLessThan(5); // Should be instant
    });
  });

  describe('Reactive subscriptions', () => {
    it('should notify subscribers of state changes', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id, name: `User ${id}` };
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        states.push({ ...state });
      });

      // Initial state (loading)
      await tick();
      expect(states[0]).toEqual({ loading: false }); // Initial
      expect(states[1]).toEqual({ loading: true }); // Started fetch

      await tick();
      await tick();

      // Success state
      expect(states[2]).toMatchObject({
        loading: false,
        data: { id: 1, name: 'User 1' },
      });

      unsub();
    });

    it('should auto-fetch when subscribing to empty cache', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id };
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        states.push(state);
      });

      // Subscribe triggers immediate fetch
      expect(execCount).toBe(1); // Auto-fetch triggered synchronously

      await tick();
      await tick();

      expect(states[states.length - 1]).toMatchObject({ data: { id: 1 } });

      unsub();
    });

    it('should not auto-fetch if cache exists', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id };
      });

      // Prime cache
      await runKarma(fetchUser, 1);
      expect(execCount).toBe(1);

      // Subscribe to cached data
      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        states.push(state);
      });

      await tick();
      expect(execCount).toBe(1); // No additional fetch

      // Should immediately get cached data
      expect(states[0]).toMatchObject({ data: { id: 1 } });

      unsub();
    });
  });

  describe('Auto-dispose (default)', () => {
    it('should dispose cache after cacheTime when no listeners', async () => {
      let execCount = 0;
      const fetchUser = karma(
        async (id: number) => {
          execCount++;
          await tick();
          return { id };
        },
        { cacheTime: 50 } // 50ms
      );

      // Subscribe and unsubscribe
      const unsub = subscribeToKarma(fetchUser, [1], () => {});
      await tick();
      await tick();

      expect(execCount).toBe(1);
      expect(karmaCache.stats(fetchUser).entries).toBe(1);

      unsub(); // Last listener removed

      // Wait for disposal
      await new Promise(r => setTimeout(r, 100));

      expect(karmaCache.stats(fetchUser).entries).toBe(0); // Disposed
    });

    it('should cancel disposal if listener re-added', async () => {
      const fetchUser = karma(
        async (id: number) => {
          await tick();
          return { id };
        },
        { cacheTime: 50 }
      );

      const unsub1 = subscribeToKarma(fetchUser, [1], () => {});
      await tick();
      await tick();

      unsub1(); // Start disposal timer

      // Re-add listener before disposal
      await new Promise(r => setTimeout(r, 25));
      const unsub2 = subscribeToKarma(fetchUser, [1], () => {});

      // Wait past original disposal time
      await new Promise(r => setTimeout(r, 50));

      expect(karmaCache.stats(fetchUser).entries).toBe(1); // Still cached!

      unsub2();
    });
  });

  describe('keepAlive option', () => {
    it('should keep cache alive even when no listeners', async () => {
      const fetchUser = karma(
        async (id: number) => {
          await tick();
          return { id };
        },
        { keepAlive: true }
      );

      const unsub = subscribeToKarma(fetchUser, [1], () => {});
      await tick();
      await tick();

      unsub(); // Remove listener

      // Wait (would normally dispose)
      await new Promise(r => setTimeout(r, 100));

      expect(karmaCache.stats(fetchUser).entries).toBe(1); // Still cached!
    });
  });

  describe('karmaCache.invalidate (reactive!)', () => {
    it('should trigger re-fetch for active listeners', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id, timestamp: Date.now() };
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        if (state.data) states.push(state.data);
      });

      await tick();
      await tick();

      expect(execCount).toBe(1);
      expect(states.length).toBe(1);
      const firstTimestamp = states[0].timestamp;

      // Invalidate (should trigger re-fetch)
      karmaCache.invalidate(fetchUser, 1);

      await tick();
      await tick();

      expect(execCount).toBe(2); // Re-fetched!
      expect(states.length).toBe(2);
      expect(states[1].timestamp).toBeGreaterThan(firstTimestamp);

      unsub();
    });

    it('should not re-fetch if no active listeners', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id };
      });

      await runKarma(fetchUser, 1);
      expect(execCount).toBe(1);

      // Invalidate without listeners
      karmaCache.invalidate(fetchUser, 1);

      await tick();
      expect(execCount).toBe(1); // No re-fetch
    });
  });

  describe('karmaCache.set (optimistic update)', () => {
    it('should update cache and notify listeners', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id, name: `User ${id}` };
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        if (state.data) states.push(state.data);
      });

      await tick();
      await tick();

      expect(states[0]).toEqual({ id: 1, name: 'User 1' });

      // Optimistic update
      karmaCache.set(fetchUser, [1], { id: 1, name: 'Updated User' });

      expect(states[1]).toEqual({ id: 1, name: 'Updated User' });

      unsub();
    });
  });

  describe('staleTime (stale-while-revalidate)', () => {
    it('should trigger background refetch when stale', async () => {
      let execCount = 0;
      const fetchUser = karma(
        async (id: number) => {
          execCount++;
          await tick();
          return { id, fetch: execCount };
        },
        { staleTime: 50 } // 50ms
      );

      // First fetch
      const result1 = await runKarma(fetchUser, 1);
      expect(result1).toEqual({ id: 1, fetch: 1 });
      expect(execCount).toBe(1);

      // Wait for stale
      await new Promise(r => setTimeout(r, 60));

      // Second call: returns stale cache + triggers background refetch
      const result2 = await runKarma(fetchUser, 1);
      expect(result2).toEqual({ id: 1, fetch: 1 }); // Stale cache returned immediately

      // Background refetch should complete soon
      await tick();
      await tick();

      expect(execCount).toBe(2); // Background refetch executed

      // Third call: returns fresh cache
      const result3 = await runKarma(fetchUser, 1);
      expect(result3).toEqual({ id: 1, fetch: 2 });
    });
  });

  describe('Error handling', () => {
    it('should cache error state', async () => {
      let shouldFail = true;
      const fetchUser = karma(async (id: number) => {
        await tick();
        if (shouldFail) throw new Error('Failed');
        return { id };
      });

      try {
        await runKarma(fetchUser, 1);
      } catch (e) {
        expect((e as Error).message).toBe('Failed');
      }

      // Error should be cached
      const state = karmaCache.get(fetchUser, 1);
      expect(state?.error).toBeDefined();
      expect(state?.error?.message).toBe('Failed');
    });

    it('should notify subscribers of errors', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        throw new Error('Failed');
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        states.push({ ...state });
      });

      await tick();
      await tick();

      expect(states[states.length - 1]).toMatchObject({
        loading: false,
        error: expect.objectContaining({ message: 'Failed' }),
      });

      unsub();
    });
  });

  describe('Multiple listeners per parameter', () => {
    it('should notify all listeners for same args', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const states1: any[] = [];
      const states2: any[] = [];

      const unsub1 = subscribeToKarma(fetchUser, [1], (state) => {
        if (state.data) states1.push(state.data);
      });

      const unsub2 = subscribeToKarma(fetchUser, [1], (state) => {
        if (state.data) states2.push(state.data);
      });

      await tick();
      await tick();

      // Both should receive data
      expect(states1[0]).toEqual({ id: 1 });
      expect(states2[0]).toEqual({ id: 1 });

      // Invalidate should notify both
      karmaCache.invalidate(fetchUser, 1);

      await tick();
      await tick();

      expect(states1.length).toBe(2);
      expect(states2.length).toBe(2);

      unsub1();
      unsub2();
    });
  });

  describe('Concurrent requests (same args)', () => {
    it('should prevent concurrent execution for same args', async () => {
      let execCount = 0;
      let resolveAsync: ((value: string) => void) | undefined;

      const fetchUser = karma(async (id: number) => {
        execCount++;
        // First call should wait for manual resolution
        await new Promise<string>((resolve) => {
          resolveAsync = resolve;
        });
        return { id, name: `User ${id}` };
      });

      // Start two concurrent requests with same args
      const promise1 = runKarma(fetchUser, 1);
      const promise2 = runKarma(fetchUser, 1);

      // Should only execute once
      expect(execCount).toBe(1);

      // Resolve the async operation
      resolveAsync!('done');
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same result
      expect(result1).toEqual({ id: 1, name: 'User 1' });
      expect(result2).toEqual({ id: 1, name: 'User 1' });
      expect(execCount).toBe(1); // Still only executed once
    });

    it('should allow concurrent execution for different args', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id };
      });

      // Start two concurrent requests with different args
      const promise1 = runKarma(fetchUser, 1);
      const promise2 = runKarma(fetchUser, 2);

      await Promise.all([promise1, promise2]);

      // Both should execute
      expect(execCount).toBe(2);
    });

    it('should notify all listeners only once during concurrent requests', async () => {
      let resolveAsync: ((value: { id: number }) => void) | undefined;

      const fetchUser = karma(async (id: number) => {
        await new Promise<{ id: number }>((resolve) => {
          resolveAsync = resolve;
        });
        return { id };
      });

      const states1: any[] = [];
      const states2: any[] = [];

      const unsub1 = subscribeToKarma(fetchUser, [1], (state) => {
        states1.push({ ...state });
      });

      const unsub2 = subscribeToKarma(fetchUser, [1], (state) => {
        states2.push({ ...state });
      });

      await tick();

      // Both should have initial loading state
      expect(states1[states1.length - 1].loading).toBe(true);
      expect(states2[states2.length - 1].loading).toBe(true);

      // Start concurrent requests (should use same underlying promise)
      const promise1 = runKarma(fetchUser, 1);
      const promise2 = runKarma(fetchUser, 1);

      // Resolve
      resolveAsync!({ id: 1 });
      await Promise.all([promise1, promise2]);
      await tick();

      // Both listeners should receive success notification
      expect(states1[states1.length - 1]).toMatchObject({ loading: false, data: { id: 1 } });
      expect(states2[states2.length - 1]).toMatchObject({ loading: false, data: { id: 1 } });

      unsub1();
      unsub2();
    });
  });

  describe('Effect integration', () => {
    it('should work correctly with effect pattern', async () => {
      let execCount = 0;
      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        return `User: ${id}`;
      });

      const { zen, set } = await import('./zen');
      const { effect } = await import('./effect');
      const userId = zen(1);

      const cleanup = effect([userId], (id) => {
        runKarma(fetchUser, id);
      });

      await tick();
      await tick();
      expect(execCount).toBe(1);

      // Change to different value
      set(userId, 2);
      await tick();
      await tick();
      expect(execCount).toBe(2);

      // Back to 1 - should use cache
      set(userId, 1);
      await tick();
      await tick();
      expect(execCount).toBe(2); // Should NOT execute again

      // Back to 2 - should use cache
      set(userId, 2);
      await tick();
      await tick();
      expect(execCount).toBe(2); // Should NOT execute again

      // New value
      set(userId, 3);
      await tick();
      await tick();
      expect(execCount).toBe(3);

      cleanup();
    });

    it('should reactively update when used with effect and subscribeToKarma', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id, name: `User ${id}` };
      });

      const { zen, set } = await import('./zen');
      const { effect } = await import('./effect');
      const userId = zen(1);

      const userData: any[] = [];
      let unsub: (() => void) | undefined;

      const cleanup = effect([userId], (id) => {
        // Unsubscribe from previous
        if (unsub) unsub();
        // Subscribe to new
        unsub = subscribeToKarma(fetchUser, [id], (state) => {
          if (state.data) userData.push(state.data);
        });
      });

      await tick();
      await tick();

      expect(userData[userData.length - 1]).toEqual({ id: 1, name: 'User 1' });

      // Change user ID
      set(userId, 2);
      await tick();
      await tick();

      expect(userData[userData.length - 1]).toEqual({ id: 2, name: 'User 2' });

      cleanup();
      if (unsub) unsub();
    });
  });

  describe('Error re-fetch behavior', () => {
    it('should cache error state but allow retry on next runKarma', async () => {
      let shouldFail = true;
      let execCount = 0;

      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        if (shouldFail) throw new Error('Failed');
        return { id };
      });

      // First call - should fail
      try {
        await runKarma(fetchUser, 1);
      } catch (e) {
        expect((e as Error).message).toBe('Failed');
      }

      expect(execCount).toBe(1);

      // Error should be cached
      const state1 = karmaCache.get(fetchUser, 1);
      expect(state1?.error).toBeDefined();

      // Second call with same args - should execute again (retry)
      try {
        await runKarma(fetchUser, 1);
      } catch (e) {
        expect((e as Error).message).toBe('Failed');
      }

      expect(execCount).toBe(2); // Executed again (no caching of errors)

      // Fix the error
      shouldFail = false;

      // Third call - should succeed
      const result = await runKarma(fetchUser, 1);
      expect(result).toEqual({ id: 1 });
      expect(execCount).toBe(3);

      // Fourth call - should use cache now
      await runKarma(fetchUser, 1);
      expect(execCount).toBe(3); // Not executed again
    });

    it('should notify error to subscribers then allow retry', async () => {
      let shouldFail = true;
      let execCount = 0;

      const fetchUser = karma(async (id: number) => {
        execCount++;
        await tick();
        if (shouldFail) throw new Error('API Error');
        return { id, name: `User ${id}` };
      });

      const states: any[] = [];
      const unsub = subscribeToKarma(fetchUser, [1], (state) => {
        states.push({ ...state });
      });

      await tick();
      await tick();

      // Should have error state
      expect(states[states.length - 1]).toMatchObject({
        loading: false,
        error: expect.objectContaining({ message: 'API Error' }),
      });
      expect(execCount).toBe(1);

      // Fix error and invalidate to trigger retry
      shouldFail = false;
      karmaCache.invalidate(fetchUser, 1);

      await tick();
      await tick();

      // Should have success state now
      expect(states[states.length - 1]).toMatchObject({
        loading: false,
        data: { id: 1, name: 'User 1' },
      });
      expect(execCount).toBe(2);

      unsub();
    });
  });

  describe('getKarmaState', () => {
    it('should return current state for args', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id };
      });

      // Before fetch
      const state1 = getKarmaState(fetchUser, [1]);
      expect(state1).toEqual({ loading: false });

      // During fetch
      const promise = runKarma(fetchUser, 1);
      const state2 = getKarmaState(fetchUser, [1]);
      expect(state2.loading).toBe(true);

      await promise;

      // After fetch
      const state3 = getKarmaState(fetchUser, [1]);
      expect(state3).toMatchObject({ loading: false, data: { id: 1 } });
    });
  });

  describe('karmaCache.stats', () => {
    it('should return cache statistics', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id };
      });

      await runKarma(fetchUser, 1);
      await runKarma(fetchUser, 2);

      const stats = karmaCache.stats(fetchUser);
      expect(stats.entries).toBe(2);
      expect(stats.totalListeners).toBe(0);
      expect(stats.cacheKeys.length).toBe(2);
    });

    it('should track listener count', async () => {
      const fetchUser = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsub1 = subscribeToKarma(fetchUser, [1], () => {});
      const unsub2 = subscribeToKarma(fetchUser, [1], () => {});
      const unsub3 = subscribeToKarma(fetchUser, [2], () => {});

      await tick();

      const stats = karmaCache.stats(fetchUser);
      expect(stats.totalListeners).toBe(3);

      unsub1();
      unsub2();
      unsub3();
    });
  });
});
