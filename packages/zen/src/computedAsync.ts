/**
 * computedAsync: Reactive Async Computed Values
 *
 * Like computed() but supports async calculations that automatically
 * re-execute when dependencies change (fully reactive).
 */

import type { AnyZen, Listener, Unsubscribe, ZenAsyncState, ZenWithValue } from './types';
import { markDirty, notifyListeners, updateIfNecessary } from './zen';

// --- Type Definitions ---

export type ComputedAsyncZen<T = unknown> = ZenWithValue<ZenAsyncState<T>> & {
  _kind: 'computedAsync';
  _value: ZenAsyncState<T>;
  _dirty: boolean;
  readonly _sources: ReadonlyArray<AnyZen>;
  readonly _asyncCalculation: (...values: unknown[]) => Promise<T>;
  readonly _equalityFn: (a: T, b: T) => boolean;
  _unsubscribers?: Unsubscribe[];
  _runningPromise?: Promise<T>;
  _latestPromiseId?: number;
  // Internal methods
  _update: () => boolean;
  _subscribeToSources: () => void;
  _unsubscribeFromSources: () => void;
  _executeAsync: () => Promise<void>;
  _dispose?: () => void;
  // Options
  _staleTime?: number;
  _lastExecutionTime?: number;
};

export interface ComputedAsyncOptions {
  /** Time in ms until data is considered stale (triggers background refetch) */
  staleTime?: number;
  /** Custom equality function to determine if data changed */
  equalityFn?: <T>(a: T, b: T) => boolean;
}

// --- Helper Functions ---

/**
 * Get current values from source zens
 * @internal
 */
function _getSourceValues(sources: ReadonlyArray<AnyZen>): unknown[] {
  const values: unknown[] = [];
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source) {
      values[i] = undefined;
      continue;
    }

    // Update source if necessary
    updateIfNecessary(source);

    // Get value based on kind
    switch (source._kind) {
      case 'zen':
      case 'map':
      case 'deepMap':
        values[i] = source._value;
        break;
      case 'computed':
        values[i] = source._value;
        break;
      case 'computedAsync':
        // For async computed sources, use their data (if available)
        values[i] = (source as ComputedAsyncZen)._value.data;
        break;
      case 'batched':
        values[i] = source._value;
        break;
      default:
        values[i] = undefined;
    }
  }
  return values;
}

/**
 * Execute async calculation and update state
 * Handles loading/error states and race conditions
 * @internal
 */
async function executeAsyncCalculation<T>(zen: ComputedAsyncZen<T>): Promise<void> {
  // Increment promise ID to detect stale promises
  const promiseId = (zen._latestPromiseId ?? 0) + 1;
  zen._latestPromiseId = promiseId;

  // Get current source values
  const sourceValues = _getSourceValues(zen._sources);

  // Check if any source is undefined (not ready)
  if (sourceValues.some((v) => v === undefined)) {
    zen._dirty = true;
    return;
  }

  // ✅ OPTIMIZATION: Update to loading state
  const oldState = zen._value;
  const wasLoading = oldState.loading;

  // Only create new state object if transitioning to loading
  if (!wasLoading) {
    zen._value = {
      loading: true,
      data: oldState.data, // Keep previous data during loading
      error: undefined,
    };
    notifyListeners(zen as AnyZen, zen._value, oldState);
  }

  try {
    // Execute async calculation
    const promise = zen._asyncCalculation(...sourceValues);
    zen._runningPromise = promise;
    const result = await promise;

    // Check if this promise is still the latest (race condition check)
    if (zen._latestPromiseId !== promiseId) {
      // A newer promise has started, ignore this result
      return;
    }

    // Check if value actually changed
    const dataChanged = oldState.data === undefined || !zen._equalityFn(result, oldState.data as T);

    // Update to success state
    const newState: ZenAsyncState<T> = {
      loading: false,
      data: result,
      error: undefined,
    };

    zen._value = newState;
    zen._dirty = false;
    zen._color = 0; // CLEAN
    zen._runningPromise = undefined;
    zen._lastExecutionTime = Date.now();

    // Notify listeners if data changed or we were loading
    if (dataChanged || wasLoading) {
      markDirty(zen as AnyZen);
      notifyListeners(zen as AnyZen, newState, oldState);
    }
  } catch (error) {
    // Check if this promise is still the latest
    if (zen._latestPromiseId !== promiseId) {
      return;
    }

    const errorObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));

    // Update to error state
    const errorState: ZenAsyncState<T> = {
      loading: false,
      data: undefined,
      error: errorObj,
    };

    zen._value = errorState;
    zen._dirty = false;
    zen._color = 2; // RED (error state)
    zen._runningPromise = undefined;

    // Always notify on error
    markDirty(zen as AnyZen);
    notifyListeners(zen as AnyZen, errorState, oldState);
  }
}

/**
 * Handler called when any source zen changes
 * Marks the computed async zen as dirty and triggers re-execution
 * @internal
 */
function computedAsyncSourceChanged<T>(zen: ComputedAsyncZen<T>): void {
  zen._dirty = true;
  zen._color = 2; // RED

  // If has active listeners, trigger async re-execution
  // Always trigger even if already dirty (handles rapid dependency changes)
  if (zen._listeners?.length) {
    // Execute async immediately (don't wait)
    zen._executeAsync().catch(() => {
      // Error already handled in executeAsyncCalculation
    });
  }
}

/**
 * Subscribe to all source zens
 * @internal
 */
function subscribeComputedAsyncToSources<T>(zen: ComputedAsyncZen<T>): void {
  if (zen._unsubscribers) return; // Already subscribed

  const sources = zen._sources;
  const newUnsubscribers: Unsubscribe[] = [];

  // Create a bound handler specific to this computed async instance
  const onChangeHandler = () => computedAsyncSourceChanged(zen);

  // Attach computed zen reference for graph coloring
  // biome-ignore lint/suspicious/noExplicitAny: Required for graph coloring optimization
  (onChangeHandler as any)._computedZen = zen;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source) continue;

    const baseSource = source as ZenWithValue<unknown>;
    const isFirstListener = !baseSource._listeners || baseSource._listeners.length === 0;

    baseSource._listeners ??= [];
    baseSource._listeners.push(onChangeHandler);

    // Handle first listener subscription for source
    if (isFirstListener && source._kind === 'computed') {
      const computedSource = source as any;
      if (typeof computedSource._subscribeToSources === 'function') {
        computedSource._subscribeToSources();
      }
    }

    // Create unsubscribe function for this source
    const unsub = () => {
      const listeners = baseSource._listeners;
      if (!listeners) return;

      const idx = listeners.indexOf(onChangeHandler);
      if (idx === -1) return;

      // Swap-remove
      const lastIdx = listeners.length - 1;
      if (idx !== lastIdx) {
        listeners[idx] = listeners[lastIdx];
      }
      listeners.pop();

      // Handle last listener cleanup
      if (listeners.length === 0) {
        baseSource._listeners = undefined;
        if (source._kind === 'computed') {
          const computedSource = source as any;
          if (typeof computedSource._unsubscribeFromSources === 'function') {
            computedSource._unsubscribeFromSources();
          }
        }
      }
    };

    newUnsubscribers.push(unsub);
  }

  zen._unsubscribers = newUnsubscribers;
}

/**
 * Unsubscribe from all source zens
 * @internal
 */
function unsubscribeComputedAsyncFromSources<T>(zen: ComputedAsyncZen<T>): void {
  if (!zen._unsubscribers) return;

  for (const unsub of zen._unsubscribers) {
    unsub?.();
  }
  zen._unsubscribers = undefined;
  zen._dirty = true; // Mark as dirty when inactive
}

/**
 * Update function for graph coloring system
 * @internal
 */
function updateComputedAsyncValue<T>(zen: ComputedAsyncZen<T>): boolean {
  // CLEAN (0) - no update needed
  if (zen._color === 0) {
    return false;
  }

  // GREEN (1) - need to verify if sources actually changed
  if (zen._color === 1) {
    const srcs = zen._sources;
    if (srcs && srcs.length > 0) {
      let anyParentDirty = false;
      for (let i = 0; i < srcs.length; i++) {
        const source = srcs[i];
        if (source) {
          updateIfNecessary(source);
          if (source._color === 2) {
            anyParentDirty = true;
            break;
          }
        }
      }

      if (!anyParentDirty) {
        // All parents clean - we're clean too
        zen._color = 0;
        zen._dirty = false;
        return false;
      }

      // At least one parent dirty - mark ourselves RED
      zen._color = 2;
    }
  }

  // RED (2) - need to trigger async re-execution
  if (zen._listeners?.length) {
    zen._executeAsync().catch(() => {
      // Error already handled
    });
  }

  return false;
}

// --- Factory Function ---

/**
 * Creates a reactive async computed zen
 *
 * Like computed() but supports async calculations. Automatically re-executes
 * when any dependency changes (fully reactive).
 *
 * @template T The type of data returned by async calculation
 * @param sources Array of source zens to depend on
 * @param asyncCalculation Async function that receives current values and returns computed result
 * @param options Optional configuration
 * @returns ComputedAsyncZen instance
 *
 * @example
 * ```typescript
 * const userId = zen(1);
 * const user = computedAsync([userId], async (id) => {
 *   return fetchUser(id);
 * });
 *
 * // Subscribe to get updates
 * subscribe(user, (state) => {
 *   if (state.loading) console.log('Loading...');
 *   if (state.data) console.log('User:', state.data);
 *   if (state.error) console.log('Error:', state.error);
 * });
 *
 * // When dependency changes, automatically re-executes!
 * set(userId, 2); // ✅ Triggers automatic refetch
 * ```
 */
export function computedAsync<T, S extends AnyZen | ReadonlyArray<AnyZen>>(
  sources: S,
  asyncCalculation: (...values: unknown[]) => Promise<T>,
  options?: ComputedAsyncOptions,
): ComputedAsyncZen<T> {
  // Normalize sources to array
  const sourcesArray = Array.isArray(sources) ? sources : [sources];

  const equalityFn = options?.equalityFn ?? Object.is;

  // Create initial state (not loaded yet)
  const initialState: ZenAsyncState<T> = {
    loading: false,
    data: undefined,
    error: undefined,
  };

  // Define computed async zen structure
  const computedAsyncZen: ComputedAsyncZen<T> = {
    _kind: 'computedAsync',
    _value: initialState,
    _dirty: true,
    _sources: [...sourcesArray],
    _asyncCalculation: asyncCalculation,
    _equalityFn: equalityFn,
    _staleTime: options?.staleTime,

    // Internal methods
    _subscribeToSources: () => subscribeComputedAsyncToSources(computedAsyncZen),
    _unsubscribeFromSources: () => unsubscribeComputedAsyncFromSources(computedAsyncZen),
    _update: () => updateComputedAsyncValue(computedAsyncZen),
    _executeAsync: () => executeAsyncCalculation(computedAsyncZen),
    _dispose: () => {
      if (computedAsyncZen._unsubscribers) {
        unsubscribeComputedAsyncFromSources(computedAsyncZen);
      }
    },
  };

  return computedAsyncZen;
}

/**
 * Dispose a computed async zen and clean up resources
 *
 * @param zen The computed async zen to dispose
 */
export function disposeAsync<T>(zen: ComputedAsyncZen<T>): void {
  if (zen._dispose) {
    zen._dispose();
  }
}
