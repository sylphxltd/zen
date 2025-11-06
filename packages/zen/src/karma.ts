// Karma zen implementation for managing asynchronous operations.
// import type { Zen } from './zen'; // Removed unused Zen import
import type {
  AnyZen,
  KarmaState,
  KarmaZen,
  Listener,
  Unsubscribe /* ZenWithValue, */,
} from './types'; // Removed unused ZenWithValue, Add AnyZen, Remove unused ZenValue
import { notifyListeners, subscribe as subscribeToCoreZen } from './zen'; // Import core subscribe AND notifyListeners
// Removed import { notifyListeners } from './internalUtils'; // Import notifyListeners
// Removed createZen, getZenValue, setZenValue, subscribeToZen imports

// --- Type Definition ---
/**
 * Represents a Karma Zen, which wraps an asynchronous function
 * and provides its state (loading, error, data) reactively.
 */
// KarmaZen type is now defined in types.ts

// --- Internal state for tracking running promises ---
// WeakMap to associate KarmaZen instances with their currently running promise.
const runningPromises = new WeakMap<KarmaZen<unknown>, Promise<unknown>>(); // Use unknown

// WeakMap to store cached results based on arguments
const resultCache = new WeakMap<KarmaZen<unknown>, Map<string, unknown>>();

// --- Karma Options ---
export interface KarmaOptions<Args extends unknown[] = unknown[]> {
  /** Enable caching based on arguments. Defaults to false. */
  cache?: boolean;
  /** Custom function to generate cache key from arguments. Defaults to JSON.stringify. */
  cacheKey?: (...args: Args) => string;
  /** Maximum number of cached results. Uses LRU eviction. Defaults to 100. */
  maxCacheSize?: number;
}

/**
 * Creates a Karma Zen to manage the state of an asynchronous operation.
 *
 * @template T The type of the data returned by the async function.
 * @param asyncFn The asynchronous function to execute when `runKarma` is called.
 * @param options Optional configuration for caching behavior.
 * @returns A KarmaZen instance.
 */
// Add Args generic parameter matching KarmaZen type
export function karma<T = void, Args extends unknown[] = unknown[]>(
  // Use unknown[] for Args
  asyncFn: (...args: Args) => Promise<T>,
  options?: KarmaOptions<Args>,
): KarmaZen<T, Args> {
  // Return KarmaZen with Args
  // Create the merged KarmaZen object directly
  const karmaZen: KarmaZen<T, Args> = {
    // Use KarmaZen with Args
    _kind: 'karma',
    _value: { loading: false }, // Initial KarmaState
    _asyncFn: asyncFn,
    _cacheEnabled: options?.cache ?? false,
    _cacheKeyFn: options?.cacheKey,
    _maxCacheSize: options?.maxCacheSize ?? 100,
    // Listener properties (_listeners, etc.) are initially undefined
  };

  // Initialize cache if enabled
  if (karmaZen._cacheEnabled) {
    resultCache.set(karmaZen as KarmaZen<unknown>, new Map<string, unknown>());
  }

  // No need for STORE_MAP_KEY_SET marker for karma zens
  return karmaZen;
}

// --- Functional API for Karma ---

/**
 * Runs the asynchronous function associated with the task.
 * If the task is already running, returns the existing promise.
 * If caching is enabled and a cached result exists for the arguments, returns the cached result.
 * Updates the task's state zen based on the outcome.
 * @param karmaZen The karma zen to run.
 * @param args Arguments to pass to the asynchronous function.
 * @returns A promise that resolves with the result or rejects with the error.
 */
// Add Args generic parameter matching KarmaZen type
export function runKarma<T, Args extends unknown[]>(
  karmaZen: KarmaZen<T, Args>,
  ...args: Args
): Promise<T> {
  // Use unknown[] for Args
  // Operate directly on karmaZen
  // const stateZen = karmaZen._stateZen; // Removed

  // Check cache if enabled
  if (karmaZen._cacheEnabled) {
    const cache = resultCache.get(karmaZen as KarmaZen<unknown>);
    if (cache) {
      // Generate cache key
      const cacheKey = karmaZen._cacheKeyFn
        ? karmaZen._cacheKeyFn(...args)
        : JSON.stringify(args);

      // Check if cached result exists
      if (cache.has(cacheKey)) {
        const cachedResult = cache.get(cacheKey) as T;

        // Update state with cached data (synchronous)
        const oldState = karmaZen._value;
        karmaZen._value = { loading: false, data: cachedResult, error: undefined };
        // Only notify if state actually changed
        if (oldState.loading || oldState.error || oldState.data !== cachedResult) {
          notifyListeners(karmaZen as AnyZen, karmaZen._value, oldState);
        }

        // Return resolved promise with cached data
        return Promise.resolve(cachedResult);
      }
    }
  }

  // Check if a promise is already running for this task using the WeakMap.
  // Cast karmaZen for WeakMap key compatibility
  const existingPromise = runningPromises.get(karmaZen as KarmaZen<unknown>); // Cast to unknown
  if (existingPromise) {
    // console.log('Task already running, returning existing promise.'); // Optional debug log
    // Cast existing promise back to Promise<T> for return type compatibility
    return existingPromise as Promise<T>;
  }

  // Define the actual execution logic within an async function.
  const execute = async (): Promise<T> => {
    // Set loading state immediately. Clear previous error/data.
    const oldState = karmaZen._value;
    karmaZen._value = { loading: true, error: undefined, data: undefined };
    // Notify listeners directly attached to KarmaZen, cast to AnyZen.
    notifyListeners(karmaZen as AnyZen, karmaZen._value, oldState);

    // Call the stored async function and store the promise.
    const promise = karmaZen._asyncFn(...args);
    // Cast karmaZen for WeakMap key compatibility
    runningPromises.set(karmaZen as KarmaZen<unknown>, promise); // Cast to unknown

    try {
      // Wait for the async function to complete.
      const result = await promise;

      // **Crucially**, only update the state if this *specific* promise instance
      // is still the one tracked in the WeakMap.
      // Cast karmaZen for WeakMap key compatibility
      if (runningPromises.get(karmaZen as KarmaZen<unknown>) === promise) {
        // Cast to unknown
        // console.log('Task succeeded, updating state.'); // Optional debug log

        // Store result in cache if enabled
        if (karmaZen._cacheEnabled) {
          const cache = resultCache.get(karmaZen as KarmaZen<unknown>);
          if (cache) {
            const cacheKey = karmaZen._cacheKeyFn
              ? karmaZen._cacheKeyFn(...args)
              : JSON.stringify(args);

            // Implement LRU eviction if cache is full
            const maxSize = karmaZen._maxCacheSize ?? 100;
            if (cache.size >= maxSize) {
              // Remove oldest entry (first key in Map)
              const firstKey = cache.keys().next().value;
              if (firstKey !== undefined) {
                cache.delete(firstKey);
              }
            }

            // Store the result
            cache.set(cacheKey, result);
          }
        }

        const oldStateSuccess = karmaZen._value;
        karmaZen._value = { loading: false, data: result, error: undefined };
        // Notify listeners directly attached to KarmaZen, cast to AnyZen.
        notifyListeners(karmaZen as AnyZen, karmaZen._value, oldStateSuccess);
        // Cast karmaZen for WeakMap key compatibility
        runningPromises.delete(karmaZen as KarmaZen<unknown>); // Cast to unknown
      } else {
        // console.log('Task succeeded, but a newer run is active. Ignoring result.'); // Optional debug log
      }

      return result; // Return the successful result.
    } catch (error) {
      // Similar check for race conditions on error.
      // Cast karmaZen for WeakMap key compatibility
      if (runningPromises.get(karmaZen as KarmaZen<unknown>) === promise) {
        // Cast to unknown
        // console.error('Task failed, updating state:', error); // Optional debug log
        // Ensure the error stored is always an Error instance.
        const errorObj =
          error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
        const oldStateError = karmaZen._value;
        karmaZen._value = { loading: false, error: errorObj, data: undefined };
        // Notify listeners directly attached to KarmaZen, cast to AnyZen.
        notifyListeners(karmaZen as AnyZen, karmaZen._value, oldStateError);
        // Cast karmaZen for WeakMap key compatibility
        runningPromises.delete(karmaZen as KarmaZen<unknown>); // Cast to unknown
      } else {
        // console.error('Task failed, but a newer run is active. Ignoring error.'); // Optional debug log
      }

      throw error; // Re-throw the error so the caller's catch block works.
    }
  };

  // Start the execution and return the promise.
  return execute();
}

/**
 * Gets the current state of a karma zen.
 * @param karmaZen The karma zen to read from.
 * @returns The current KarmaState.
 */
export function getKarmaState<T, Args extends unknown[]>(
  karmaZen: KarmaZen<T, Args>,
): KarmaState<T> {
  // KarmaZen now directly holds the KarmaState value
  return karmaZen._value;
}

/**
 * Subscribes to changes in a karma zen's state.
 * @param karmaZen The karma zen to subscribe to.
 * @param listener The listener function.
 * @returns An unsubscribe function.
 */
export function subscribeToKarma<T, Args extends unknown[]>(
  karmaZen: KarmaZen<T, Args>,
  listener: Listener<KarmaState<T>>,
): Unsubscribe {
  // Subscribe directly to the KarmaZen using the core subscribe function.
  // Cast karmaZen to AnyZen and listener to any to satisfy the generic signature.
  // biome-ignore lint/suspicious/noExplicitAny: Listener type requires any due to complex generic resolution
  return subscribeToCoreZen(karmaZen as AnyZen, listener as any);
}

// Removed temporary UpdatedKarmaZen type and updatedCreateTask function
