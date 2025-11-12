import { effect, zen } from '@sylphx/zen';
import type { Zen } from '@sylphx/zen';

export interface AsyncState<T> {
  loading: boolean;
  data: T | undefined;
  error: Error | undefined;
}

export interface AsyncStore<T> {
  state: Zen<AsyncState<T>>;
  refetch: () => Promise<void>;
  abort: () => void;
}

/**
 * Creates an async state store with loading/error/data management
 *
 * @example
 * ```typescript
 * const user = computedAsync(async () => {
 *   const res = await fetch('/api/user');
 *   return res.json();
 * });
 *
 * // Access state
 * console.log(user.state.value.loading);
 * console.log(user.state.value.data);
 * console.log(user.state.value.error);
 *
 * // Refetch
 * user.refetch();
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic dependency tracking requires any type
export function computedAsync<T>(asyncFn: () => Promise<T>, deps: Zen<any>[] = []): AsyncStore<T> {
  const state = zen<AsyncState<T>>({
    loading: false,
    data: undefined,
    error: undefined,
  });

  let abortController: AbortController | null = null;

  const execute = async () => {
    // Abort previous request
    abortController?.abort();
    abortController = new AbortController();

    state.value = {
      loading: true,
      data: state.value.data,
      error: undefined,
    };

    try {
      const result = await asyncFn();

      // Check if aborted
      if (abortController.signal.aborted) return;

      state.value = {
        loading: false,
        data: result,
        error: undefined,
      };
    } catch (err) {
      if (abortController.signal.aborted) return;

      state.value = {
        loading: false,
        data: undefined,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  };

  // Auto-execute on deps change
  if (deps.length > 0) {
    effect(() => {
      // Track all deps
      for (const d of deps) {
        d.value;
      }
      execute();
    });
  } else {
    // Initial execution
    execute();
  }

  return {
    state,
    refetch: execute,
    abort: () => abortController?.abort(),
  };
}
