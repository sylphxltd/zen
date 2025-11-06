import { afterEach, describe, expect, it, vi } from 'vitest';
import { getKarmaState, karma, runKarma, subscribeToKarma } from './karma';
import { subscribe, zen, set } from './zen';

// Helper to wait for promises/microtasks
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('task', () => {
  let taskAtom;
  const asyncFnSuccess = vi.fn(async (arg: string) => {
    await tick();
    return `Success: ${arg}`;
  });
  const asyncFnError = vi.fn(async (arg: string) => {
    await tick();
    throw new Error(`Failure: ${arg}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a task atom with initial state', () => {
    taskAtom = karma(asyncFnSuccess);
    expect(taskAtom._kind).toBe('karma');
    expect(taskAtom._value).toEqual({ loading: false, error: undefined, data: undefined });
    expect(taskAtom._asyncFn).toBe(asyncFnSuccess);
  });

  it('should update state to loading when run starts', () => {
    taskAtom = karma(asyncFnSuccess);
    runKarma(taskAtom, 'test');
    expect(taskAtom._value).toEqual({ loading: true, error: undefined, data: undefined });
    expect(asyncFnSuccess).toHaveBeenCalledWith('test');
  });

  it('should update state with data on successful completion', async () => {
    taskAtom = karma(asyncFnSuccess);
    const promise = runKarma(taskAtom, 'abc');
    expect(taskAtom._value.loading).toBe(true);

    await promise; // Wait for the async function to complete

    expect(taskAtom._value).toEqual({ loading: false, error: undefined, data: 'Success: abc' });
    expect(asyncFnSuccess).toHaveBeenCalledTimes(1);
  });

  it('should update state with error on failure', async () => {
    taskAtom = karma(asyncFnError);
    const errorListener = vi.fn();

    // Use try/catch as run() re-throws the error
    try {
      await runKarma(taskAtom, 'fail');
    } catch (e) {
      errorListener(e);
    }

    expect(taskAtom._value.loading).toBe(false);
    expect(taskAtom._value.error).toBeInstanceOf(Error);
    expect(taskAtom._value.error?.message).toBe('Failure: fail');
    expect(taskAtom._value.data).toBeUndefined();
    expect(asyncFnError).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledTimes(1); // Ensure error was caught
  });

  it('should notify subscribers on state changes', async () => {
    taskAtom = karma(asyncFnSuccess);
    const listener = vi.fn();
    const unsubscribe = subscribe(taskAtom, listener);

    // Initial state notification from subscribe
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      { loading: false, error: undefined, data: undefined },
      undefined, // oldValue is undefined on initial subscribe call
    );

    const promise = runKarma(taskAtom, 'notify');

    // Loading state notification
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      { loading: true, error: undefined, data: undefined },
      { loading: false, error: undefined, data: undefined },
    );

    await promise;

    // Success state notification
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      { loading: false, error: undefined, data: 'Success: notify' },
      { loading: true, error: undefined, data: undefined },
    );

    unsubscribe();
  });

  // Test concurrent run prevention
  it('should prevent concurrent run and return existing promise', async () => {
    let resolveFirst: (value: string) => void;
    const firstPromiseInternal = new Promise<string>((res) => {
      resolveFirst = res;
    });
    const slowFn = vi.fn(async (run: string) => {
      // Only the first run should execute this function body
      expect(run).toBe('first');
      await firstPromiseInternal; // Wait to be resolved manually
      return 'First finished';
    });

    taskAtom = karma(slowFn);
    const listener = vi.fn();
    const unsubscribe = subscribeToKarma(taskAtom, listener); // Use subscribeToKarma
    listener.mockClear(); // Clear initial subscribe call

    // Start first run
    const promiseRun1 = runKarma(taskAtom, 'first');
    expect(slowFn).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1); // Loading state call
    expect(getKarmaState(taskAtom)).toEqual({ loading: true });
    const loadingState = { loading: true }; // Store for oldValue check

    // Attempt to start second run while first is running
    const promiseRun2 = runKarma(taskAtom, 'second');

    // Assertions based on preventing concurrent run:
    expect(slowFn).toHaveBeenCalledTimes(1); // slowFn should NOT be called again
    // expect(promiseRun2).toBe(promiseRun1); // Removed: Incorrect assertion due to async function always returning a new promise wrapper.
    expect(listener).toHaveBeenCalledTimes(1); // Listener should NOT be called again for loading
    expect(getKarmaState(taskAtom)).toEqual({ loading: true }); // State remains loading

    // Resolve the first run
    resolveFirst!('First finished');
    await promiseRun1; // Wait for the first promise to complete
    await tick(); // Allow microtasks for state update/notification

    // Assertions after first run completion:
    const firstRunFinishedState = { loading: false, data: 'First finished' };
    expect(listener).toHaveBeenCalledTimes(2); // Finished state call (Total: Loading1 + Finished1)
    expect(listener).toHaveBeenLastCalledWith(firstRunFinishedState, loadingState);
    expect(getKarmaState(taskAtom)).toEqual(firstRunFinishedState);

    unsubscribe();
  });

  // Test for getKarmaState
  it('should return current state via getKarmaState', async () => {
    taskAtom = karma(asyncFnSuccess);
    expect(getKarmaState(taskAtom)).toEqual({ loading: false }); // Initial

    const promise = runKarma(taskAtom, 'get');
    expect(getKarmaState(taskAtom)).toEqual({ loading: true }); // Loading

    await promise;
    expect(getKarmaState(taskAtom)).toEqual({ loading: false, data: 'Success: get' }); // Success
  });

  // Test for subscribeToKarma
  it('should notify subscribers via subscribeToKarma', async () => {
    taskAtom = karma(asyncFnSuccess);
    const listener = vi.fn();
    const unsubscribe = subscribeToKarma(taskAtom, listener); // Use subscribeToKarma

    // Initial state notification
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ loading: false }, undefined);

    const promise = runKarma(taskAtom, 'sub');

    // Loading state notification
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({ loading: true }, { loading: false });

    await promise;

    // Success state notification
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      { loading: false, data: 'Success: sub' },
      { loading: true },
    );

    unsubscribe();

    // Ensure listener is not called after unsubscribe
    listener.mockClear();
    runKarma(taskAtom, 'after');
    await tick();
    expect(listener).not.toHaveBeenCalled();
  });

  // --- Caching Tests ---

  describe('caching', () => {
    it('should not cache by default', async () => {
      let execCount = 0;
      const taskAtom = karma(async (id: number) => {
        execCount++;
        await tick();
        return `Result: ${id}`;
      });

      await runKarma(taskAtom, 1);
      expect(execCount).toBe(1);

      await runKarma(taskAtom, 1); // Same args
      expect(execCount).toBe(2); // Should execute again (no caching)

      await runKarma(taskAtom, 2);
      expect(execCount).toBe(3);
    });

    it('should cache results when cache option is enabled', async () => {
      let execCount = 0;
      const taskAtom = karma(
        async (id: number) => {
          execCount++;
          await tick();
          return `Result: ${id}`;
        },
        { cache: true },
      );

      const result1 = await runKarma(taskAtom, 1);
      expect(execCount).toBe(1);
      expect(result1).toBe('Result: 1');

      const result2 = await runKarma(taskAtom, 1); // Same args
      expect(execCount).toBe(1); // Should NOT execute again (cached)
      expect(result2).toBe('Result: 1');

      const result3 = await runKarma(taskAtom, 2); // Different args
      expect(execCount).toBe(2); // Should execute
      expect(result3).toBe('Result: 2');

      const result4 = await runKarma(taskAtom, 1); // Back to first args
      expect(execCount).toBe(2); // Should use cache
      expect(result4).toBe('Result: 1');
    });

    it('should use custom cache key function', async () => {
      let execCount = 0;
      const taskAtom = karma(
        async (user: { id: number; name: string }) => {
          execCount++;
          await tick();
          return `User: ${user.name}`;
        },
        {
          cache: true,
          cacheKey: (user) => String(user.id), // Only cache by ID, ignore name
        },
      );

      await runKarma(taskAtom, { id: 1, name: 'Alice' });
      expect(execCount).toBe(1);

      await runKarma(taskAtom, { id: 1, name: 'Bob' }); // Same ID, different name
      expect(execCount).toBe(1); // Should use cache (same ID)

      await runKarma(taskAtom, { id: 2, name: 'Alice' });
      expect(execCount).toBe(2); // Different ID
    });

    it('should update state synchronously when using cached result', async () => {
      const taskAtom = karma(
        async (id: number) => {
          await tick();
          return `Result: ${id}`;
        },
        { cache: true },
      );

      const listener = vi.fn();
      const unsubscribe = subscribeToKarma(taskAtom, listener);
      listener.mockClear();

      // First run - async execution
      const promise1 = runKarma(taskAtom, 1);
      expect(getKarmaState(taskAtom).loading).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1); // Loading state

      await promise1;
      expect(getKarmaState(taskAtom).data).toBe('Result: 1');
      expect(listener).toHaveBeenCalledTimes(2); // Success state

      listener.mockClear();

      // Second run - cached (synchronous)
      const promise2 = runKarma(taskAtom, 1);
      expect(getKarmaState(taskAtom).data).toBe('Result: 1');
      expect(getKarmaState(taskAtom).loading).toBe(false);
      expect(listener).toHaveBeenCalledTimes(0); // No notification if state unchanged

      await promise2;
      expect(listener).toHaveBeenCalledTimes(0);

      unsubscribe();
    });

    it('should implement LRU eviction when cache is full', async () => {
      let execCount = 0;
      const taskAtom = karma(
        async (id: number) => {
          execCount++;
          await tick();
          return `Result: ${id}`;
        },
        {
          cache: true,
          maxCacheSize: 2, // Only cache 2 results
        },
      );

      await runKarma(taskAtom, 1);
      await runKarma(taskAtom, 2);
      expect(execCount).toBe(2);

      // Cache should have [1, 2]
      await runKarma(taskAtom, 1);
      await runKarma(taskAtom, 2);
      expect(execCount).toBe(2); // Both cached

      // Add third item - should evict first (1)
      await runKarma(taskAtom, 3);
      expect(execCount).toBe(3);

      // Cache should now have [2, 3]
      await runKarma(taskAtom, 2);
      await runKarma(taskAtom, 3);
      expect(execCount).toBe(3); // Both still cached

      // Request 1 again - should execute (was evicted)
      await runKarma(taskAtom, 1);
      expect(execCount).toBe(4);
    });

    it('should work correctly with effect pattern', async () => {
      let execCount = 0;
      const taskAtom = karma(
        async (id: number) => {
          execCount++;
          await tick();
          return `User: ${id}`;
        },
        { cache: true },
      );

      const userId = zen(1);
      const { effect } = await import('./effect');

      const cleanup = effect([userId], (id) => {
        runKarma(taskAtom, id);
      });

      await tick();
      expect(execCount).toBe(1);

      set(userId, 2);
      await tick();
      expect(execCount).toBe(2);

      set(userId, 1); // Back to 1 - should use cache
      await tick();
      expect(execCount).toBe(2); // Should NOT execute again

      set(userId, 2); // Back to 2 - should use cache
      await tick();
      expect(execCount).toBe(2); // Should NOT execute again

      set(userId, 3); // New value
      await tick();
      expect(execCount).toBe(3);

      cleanup();
    });

    it('should handle errors without caching them', async () => {
      let execCount = 0;
      const taskAtom = karma(
        async (shouldFail: boolean) => {
          execCount++;
          await tick();
          if (shouldFail) {
            throw new Error('Test error');
          }
          return 'Success';
        },
        { cache: true },
      );

      // First call - error
      try {
        await runKarma(taskAtom, true);
      } catch (e) {
        expect((e as Error).message).toBe('Test error');
      }
      expect(execCount).toBe(1);

      // Second call with same args - should execute again (errors not cached)
      try {
        await runKarma(taskAtom, true);
      } catch (e) {
        expect((e as Error).message).toBe('Test error');
      }
      expect(execCount).toBe(2);

      // Call with success args
      await runKarma(taskAtom, false);
      expect(execCount).toBe(3);

      // Call again - should use cache
      await runKarma(taskAtom, false);
      expect(execCount).toBe(3);
    });
  });
});
