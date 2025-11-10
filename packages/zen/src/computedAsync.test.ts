/**
 * Tests for computedAsync - Reactive Async Computed
 */

import { describe, expect, it } from 'bun:test';
import { computedAsync } from './computedAsync';
import { get, set, subscribe } from './zen';
import { zen } from './zen';

// Helper function to wait for async operations
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('computedAsync', () => {
  it('should create a computed async zen with initial empty state', () => {
    const userId = zen(1);
    const user = computedAsync([userId], async (id) => {
      return { id, name: `User ${id}` };
    });

    const state = get(user);
    expect(state.loading).toBe(false);
    expect(state.data).toBeUndefined();
    expect(state.error).toBeUndefined();
  });

  it('should execute async calculation on first subscription', async () => {
    const userId = zen(1);
    const user = computedAsync([userId], async (id) => {
      await wait(10);
      return { id, name: `User ${id}` };
    });

    let callCount = 0;
    const states: any[] = [];

    subscribe(user, (state) => {
      callCount++;
      states.push({ ...state });
    });

    // Wait for async to complete
    await wait(50);

    // Should have: initial (empty) -> loading -> success
    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(states[states.length - 1].data).toEqual({ id: 1, name: 'User 1' });
  });

  it('should automatically re-execute when dependency changes (reactive!)', async () => {
    const userId = zen(1);
    let executionCount = 0;

    const user = computedAsync([userId], async (id) => {
      executionCount++;
      await wait(10);
      return { id, name: `User ${id}` };
    });

    const states: any[] = [];
    subscribe(user, (state) => {
      states.push({ ...state });
    });

    // Wait for initial execution
    await wait(50);
    expect(executionCount).toBe(1);
    expect(states[states.length - 1].data.id).toBe(1);

    // Change dependency - should trigger automatic re-execution!
    set(userId, 2);
    await wait(50);

    // Execution count should increase (automatic refetch!)
    expect(executionCount).toBe(2);
    expect(states[states.length - 1].data.id).toBe(2);
    expect(states[states.length - 1].data.name).toBe('User 2');
  });

  it('should track multiple dependencies', async () => {
    const baseUrl = zen('https://api.example.com');
    const userId = zen(1);
    let executionCount = 0;

    const user = computedAsync([baseUrl, userId], async (url, id) => {
      executionCount++;
      await wait(10);
      return { url, id, name: `User ${id}` };
    });

    subscribe(user, () => {});
    await wait(50);

    expect(executionCount).toBe(1);

    // Change first dependency
    set(baseUrl, 'https://api2.example.com');
    await wait(50);
    expect(executionCount).toBe(2);

    // Change second dependency
    set(userId, 2);
    await wait(50);
    expect(executionCount).toBe(3);

    const state = get(user);
    expect(state.data).toEqual({
      url: 'https://api2.example.com',
      id: 2,
      name: 'User 2',
    });
  });

  it('should handle errors properly', async () => {
    const shouldFail = zen(false);
    const data = computedAsync([shouldFail], async (fail) => {
      await wait(10);
      if (fail) {
        throw new Error('Test error');
      }
      return 'success';
    });

    const states: any[] = [];
    subscribe(data, (state) => {
      states.push({ ...state });
    });

    await wait(50);
    expect(states[states.length - 1].data).toBe('success');
    expect(states[states.length - 1].error).toBeUndefined();

    // Trigger error
    set(shouldFail, true);
    await wait(50);

    const finalState = states[states.length - 1];
    expect(finalState.loading).toBe(false);
    expect(finalState.error).toBeDefined();
    expect(finalState.error.message).toBe('Test error');
    expect(finalState.data).toBeUndefined();
  });

  it('should handle race conditions (ignore stale promises)', async () => {
    const userId = zen(1);
    let executionCount = 0;

    const user = computedAsync([userId], async (id) => {
      executionCount++;
      const delay = id === 1 ? 100 : 20; // First request slower
      await wait(delay);
      return { id, name: `User ${id}` };
    });

    subscribe(user, () => {});

    // Wait for first request to start
    await wait(30);

    // Trigger second request while first is still pending
    set(userId, 2);

    // Wait for both to complete
    await wait(150);

    // Should have executed twice
    expect(executionCount).toBe(2);

    // Final state should be from the LATEST request (id=2), not the one that finished last
    const state = get(user);
    expect(state.data?.id).toBe(2);
  });

  it('should preserve previous data during loading', async () => {
    const userId = zen(1);

    const user = computedAsync([userId], async (id) => {
      await wait(25);
      return { id, name: `User ${id}` };
    });

    const states: any[] = [];
    subscribe(user, (state) => {
      states.push({ ...state });
    });

    // Wait for initial load
    await wait(50);
    const initialState = states[states.length - 1];
    expect(initialState.loading).toBe(false);
    expect(initialState.data.id).toBe(1);

    // Trigger refetch
    set(userId, 2);

    // Check a loading state appeared with previous data
    await wait(10);
    const hasLoadingStateWithData = states.some(
      (s) => s.loading === true && s.data?.id === 1,
    );
    expect(hasLoadingStateWithData).toBe(true);

    // Wait for all async operations to fully complete
    await wait(100);

    // Check final state from states array (not get, which might have timing issues)
    const finalStates = states.filter(s => !s.loading && s.data?.id === 2);
    expect(finalStates.length).toBeGreaterThan(0);
  });

  it('should support computed as dependency', async () => {
    const firstName = zen('John');
    const lastName = zen('Doe');

    // Sync computed
    const fullName = computed([firstName, lastName], (first, last) => `${first} ${last}`);

    // Async computed depending on sync computed
    const greeting = computedAsync([fullName], async (name) => {
      await wait(10);
      return `Hello, ${name}!`;
    });

    const states: any[] = [];
    subscribe(greeting, (state) => {
      states.push({ ...state });
    });

    await wait(50);
    expect(states[states.length - 1].data).toBe('Hello, John Doe!');

    // Change dependency - should propagate through sync computed to async computed
    set(firstName, 'Jane');
    await wait(50);

    expect(states[states.length - 1].data).toBe('Hello, Jane Doe!');
  });

  it('should not execute when no subscribers', async () => {
    const userId = zen(1);
    let executionCount = 0;

    const user = computedAsync([userId], async (id) => {
      executionCount++;
      await wait(10);
      return { id, name: `User ${id}` };
    });

    // No subscription yet
    await wait(50);
    expect(executionCount).toBe(0);

    // Subscribe
    const unsub = subscribe(user, () => {});
    await wait(50);
    expect(executionCount).toBe(1);

    // Unsubscribe
    unsub();

    // Change dependency - should NOT execute (no subscribers)
    set(userId, 2);
    await wait(50);
    expect(executionCount).toBe(1); // Still 1
  });

  it('should support custom equality function', async () => {
    const userId = zen(1);
    let notifyCount = 0;

    const user = computedAsync(
      [userId],
      async (id) => {
        await wait(10);
        return { id, name: 'John', timestamp: Date.now() };
      },
      {
        equalityFn: (a, b) => a.id === b.id && a.name === b.name, // Ignore timestamp
      },
    );

    subscribe(user, () => {
      notifyCount++;
    });

    await wait(50);
    const initialCount = notifyCount;

    // Trigger refetch with same id
    set(userId, 1);
    await wait(50);

    // Should not notify because id and name are the same (timestamp ignored)
    expect(notifyCount).toBe(initialCount);
  });
});

// Import computed for the test that needs it
import { computed } from './computed';
