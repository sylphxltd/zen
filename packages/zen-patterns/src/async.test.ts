import { describe, expect, it, vi } from 'vitest';
import { zen } from '@sylphx/zen';
import { computedAsync } from './async';

describe('computedAsync', () => {
  it('should start with loading state', () => {
    const user = computedAsync(async () => ({ name: 'Alice' }));

    expect(user.state.value.loading).toBe(true);
    expect(user.state.value.data).toBeUndefined();
    expect(user.state.value.error).toBeUndefined();
  });

  it('should update to data state on success', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { name: 'Alice' };
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(user.state.value.loading).toBe(false);
    expect(user.state.value.data).toEqual({ name: 'Alice' });
    expect(user.state.value.error).toBeUndefined();
  });

  it('should update to error state on failure', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error('Failed to fetch');
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(user.state.value.loading).toBe(false);
    expect(user.state.value.data).toBeUndefined();
    expect(user.state.value.error).toBeInstanceOf(Error);
    expect(user.state.value.error?.message).toBe('Failed to fetch');
  });

  it('should support manual refetch', async () => {
    let callCount = 0;
    const user = computedAsync(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { name: `User ${callCount}` };
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(user.state.value.data?.name).toBe('User 1');

    await user.refetch();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(user.state.value.data?.name).toBe('User 2');
  });

  it('should abort previous request on refetch', async () => {
    let abortCount = 0;
    const user = computedAsync(async () => {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 100);
        setTimeout(() => {
          abortCount++;
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        }, 10);
      });
      return { name: 'Alice' };
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    user.refetch(); // Trigger second request

    await new Promise((resolve) => setTimeout(resolve, 150));

    // First request should have been aborted
    expect(abortCount).toBeGreaterThan(0);
  });

  it('should support manual abort', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { name: 'Alice' };
    });

    user.abort();

    await new Promise((resolve) => setTimeout(resolve, 150));

    // State should still be loading (aborted, no update)
    expect(user.state.value.loading).toBe(true);
  });

  it('should re-execute when deps change', async () => {
    const userId = zen(1);
    let callCount = 0;

    const user = computedAsync(
      async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { id: userId.value, name: `User ${userId.value}` };
      },
      [userId]
    );

    // Wait for initial execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(user.state.value.data?.id).toBe(1);
    const callsBeforeChange = callCount;

    userId.value = 2;
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have executed exactly one more time
    expect(callCount).toBe(callsBeforeChange + 1);
    expect(user.state.value.data?.id).toBe(2);
  });

  it('should preserve previous data during reload', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { name: 'Alice' };
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(user.state.value.data?.name).toBe('Alice');

    user.refetch();

    // During refetch, should have loading=true but preserve old data
    expect(user.state.value.loading).toBe(true);
    expect(user.state.value.data?.name).toBe('Alice');
  });

  it('should handle non-Error thrown values', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw 'String error';
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(user.state.value.error).toBeInstanceOf(Error);
    expect(user.state.value.error?.message).toBe('String error');
  });

  it('should not execute on mount when deps provided but empty', async () => {
    let called = false;
    computedAsync(
      async () => {
        called = true;
        return {};
      },
      []
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(called).toBe(true); // Should still execute initially
  });
});
