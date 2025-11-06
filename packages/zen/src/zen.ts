import type { BatchedZen } from './batched';
import type { ComputedZen } from './computed';
import type { SelectZen } from './types';
import type {
  AnyZen,
  DeepMapZen,
  KarmaState,
  KarmaZen,
  Listener,
  MapZen,
  Unsubscribe,
  ZenValue,
  ZenWithValue,
} from './types';

// Batching Internals
/** Tracks the nesting depth of batch calls. @internal */
export let batchDepth = 0;
/** Stores zens that have changed within the current batch, along with their original value. */
const batchQueue = new Map<Zen<unknown>, unknown>();

// ✅ PHASE 2 OPTIMIZATION: Global version counter for fast staleness checks
/** Global version counter, incremented on every zen update. @internal */
let globalVersion = 0;

/**
 * Increments and returns the next global version.
 * Kept as simple inline function for optimal JIT performance.
 * @internal
 */
export function incrementVersion(): number {
  return ++globalVersion;
}

// Internal notifyListeners function
/**
 * Notifies all listeners of an zen about a value change.
 * @internal - Exported for use by other modules like computed, deepMap.
 */
export function notifyListeners<A extends AnyZen>(
  zen: A,
  value: ZenValue<A>,
  oldValue?: ZenValue<A>,
): void {
  // Add export
  // Operate directly on the zen, casting to the base structure with the correct value type
  const baseZen = zen as ZenWithValue<ZenValue<A>>;

  // ✅ PHASE 3 OPTIMIZATION: Cache length and fast path for common cases
  // Notify regular value listeners
  const ls = baseZen._listeners;
  if (ls) {
    const len = ls.length;
    // Fast path: most common case is 1 listener
    if (len === 1) {
      ls[0](value, oldValue);
    } else if (len > 1) {
      for (let i = 0; i < len; i++) {
        ls[i](value, oldValue);
      }
    }
  }

  // Notify onNotify listeners AFTER value listeners
  const notifyLs = baseZen._notifyListeners;
  if (notifyLs) {
    const len = notifyLs.length;
    if (len === 1) {
      notifyLs[0](value);
    } else if (len > 1) {
      for (let i = 0; i < len; i++) {
        notifyLs[i](value);
      }
    }
  }
}

// --- Type Definition ---
/** Represents a writable zen (functional style). */
export type Zen<T = unknown> = ZenWithValue<T> & {
  // Default to unknown // TODO: Rename Zen type? Maybe ZenZen?
  _value: T; // Regular zens always have an initial value
};

// --- Core Functional API ---

/**
 * Gets the current value of an zen. Provides specific return types based on zen kind.
 * @param zen The zen to read from.
 * @returns The current value.
 */
// Overloads remain largely the same, relying on specific zen types
export function get<T>(zen: Zen<T>): T;
export function get<T>(zen: ComputedZen<T>): T | null;
export function get<T>(zen: SelectZen<T>): T | null; // Add SelectZen overload
export function get<T extends object>(zen: MapZen<T>): T; // Add MapZen overload back
export function get<T extends object>(zen: DeepMapZen<T>): T;
export function get<T>(zen: KarmaZen<T>): KarmaState<T>; // Add KarmaZen overload back
// General implementation signature using ZenValue
export function get<A extends AnyZen>(zen: A): ZenValue<A> | null {
  // Return includes null for computed initial state
  // Use switch for type narrowing and direct value access
  switch (zen._kind) {
    case 'zen':
    case 'map': // Add 'map' case back
    case 'deepMap':
    case 'karma': // Add 'task' case back
      // For these types, _value directly matches ZenValue<A>
      // Cast needed as TS struggles with inference within generic function.
      return zen._value as ZenValue<A>;
    // No break needed here as return exits the function
    // Removed 'task' case
    case 'computed': {
      // Explicit cast needed for computed-specific logic
      const computed = zen as ComputedZen<ZenValue<A>>; // Value type is ZenValue<A>
      if (computed._dirty || computed._value === null) {
        computed._update();
      }
      // Computed value can be null initially
      return computed._value as ZenValue<A> | null;
      // No break needed here as return exits the function
    }
    case 'select': {
      // Handle select zen (lightweight single-source selector)
      const select = zen as SelectZen<ZenValue<A>>;
      if (select._dirty || select._value === null) {
        select._update();
      }
      return select._value as ZenValue<A> | null;
    }
    // Add case for batched, although get() shouldn't trigger its update
    case 'batched': {
      const batched = zen as BatchedZen<ZenValue<A>>;
      // Batched zens update via microtask, just return current value
      return batched._value as ZenValue<A> | null;
    }
    default: {
      // Explicit cast to never to satisfy exhaustiveness check
      const _exhaustiveCheck: never = zen as never;
      return null; // Fallback return
    }
  }
}

/** @internal */
function _handleZenOnSet<T>(zen: Zen<T>, value: T): void {
  if (batchDepth <= 0) {
    const setLs = zen._setListeners;
    if (setLs?.length) {
      for (let i = 0; i < setLs.length; i++) {
        setLs[i](value);
      }
    }
  }
}

/** @internal */
function _handleZenNotification<T>(zen: Zen<T>, oldValue: T, value: T): void {
  if (batchDepth > 0) {
    queueZenForBatch(zen, oldValue);
  } else {
    notifyListeners(zen as AnyZen, value, oldValue); // Notify immediately
  }
}

/**
 * Sets the value of a writable zen. Notifies listeners immediately.
 * @param zen The zen to write to.
 * @param value The new value.
 * @param force If true, notify listeners even if the value is the same.
 */
export function set<T>(zen: Zen<T>, value: T, force = false): void {
  // Assuming the caller passes a valid Zen<T> due to TypeScript typing.
  // Runtime checks were removed for performance/simplicity after $$type removal.

  const oldValue = zen._value;
  if (force || !Object.is(value, oldValue)) {
    // ✅ PHASE 3 OPTIMIZATION: Inline hot path for better performance
    // Handle onSet listeners (inlined)
    if (batchDepth <= 0) {
      const setLs = zen._setListeners;
      if (setLs) {
        const len = setLs.length;
        if (len === 1) {
          setLs[0](value);
        } else if (len > 1) {
          for (let i = 0; i < len; i++) {
            setLs[i](value);
          }
        }
      }
    }

    // Update value
    zen._value = value;
    // ✅ PHASE 2 OPTIMIZATION: Increment global version on every update
    zen._version = incrementVersion();

    // Handle batching or immediate notification (inlined)
    if (batchDepth > 0) {
      queueZenForBatch(zen, oldValue);
    } else {
      notifyListeners(zen as AnyZen, value, oldValue);
    }
  }
}

/**
 * Subscribes a listener function to an zen's changes.
 * Calls the listener immediately with the current value.
 * Returns an unsubscribe function.
 * @param zen The zen to subscribe to.
 * @param listener The function to call on value changes.
 * @returns A function to unsubscribe the listener.
 */
/** @internal */
function _handleFirstSubscription<A extends AnyZen>(
  zen: A,
  baseZen: ZenWithValue<ZenValue<A>>,
): void {
  // Trigger onMount listeners
  const mountLs = baseZen._mountListeners;
  if (mountLs?.length) {
    baseZen._mountCleanups ??= new Map();
    for (let i = 0; i < mountLs.length; i++) {
      const cleanup = mountLs[i]();
      if (typeof cleanup === 'function') {
        baseZen._mountCleanups.set(mountLs[i], cleanup);
      } else {
        baseZen._mountCleanups.set(mountLs[i], undefined);
      }
    }
  }

  // Trigger onStart listeners
  const startLs = baseZen._startListeners;
  if (startLs?.length) {
    // biome-ignore lint/suspicious/noExplicitAny: TS struggles with generic overload resolution here
    const currentValue = get(zen as any);
    for (let i = 0; i < startLs.length; i++) {
      startLs[i](currentValue);
    }
  }

  // If it's a computed, select, or batched zen, trigger its source subscription logic
  if (zen._kind === 'computed' || zen._kind === 'select' || zen._kind === 'batched') {
    const dependentZen = zen as
      | ComputedZen<ZenValue<A>>
      | SelectZen<ZenValue<A>>
      | BatchedZen<ZenValue<A>>;
    if (
      typeof dependentZen._subscribeToSources === 'function' ||
      typeof (dependentZen as SelectZen<ZenValue<A>>)._subscribeToSource === 'function'
    ) {
      if ('_subscribeToSources' in dependentZen) {
        dependentZen._subscribeToSources();
      } else if ('_subscribeToSource' in dependentZen) {
        (dependentZen as SelectZen<ZenValue<A>>)._subscribeToSource();
      }
    }
  }
}

/** @internal */
function _handleLastUnsubscribe<A extends AnyZen>(
  zen: A,
  baseZen: ZenWithValue<ZenValue<A>>,
): void {
  baseZen._listeners = undefined;

  // Trigger onStop listeners if this was the last value listener
  const stopLs = baseZen._stopListeners;
  if (stopLs?.length) {
    for (let i = 0; i < stopLs.length; i++) {
      stopLs[i]();
    }
  }

  // Trigger onMount cleanups if this was the last listener
  const cleanups = baseZen._mountCleanups;
  if (cleanups?.size) {
    for (const cleanupFn of cleanups.values()) {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
    baseZen._mountCleanups = undefined;
  }

  // If it's a computed, select, or batched zen, trigger its source unsubscription logic
  if (zen._kind === 'computed' || zen._kind === 'select' || zen._kind === 'batched') {
    const dependentZen = zen as
      | ComputedZen<ZenValue<A>>
      | SelectZen<ZenValue<A>>
      | BatchedZen<ZenValue<A>>;
    if (
      typeof dependentZen._unsubscribeFromSources === 'function' ||
      typeof (dependentZen as SelectZen<ZenValue<A>>)._unsubscribeFromSource === 'function'
    ) {
      if ('_unsubscribeFromSources' in dependentZen) {
        dependentZen._unsubscribeFromSources();
      } else if ('_unsubscribeFromSource' in dependentZen) {
        (dependentZen as SelectZen<ZenValue<A>>)._unsubscribeFromSource();
      }
    }
  }
}

// General implementation signature using ZenValue
export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
  // ✅ PHASE 1 OPTIMIZATION: Array-based listeners
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  const isFirstListener = !baseZen._listeners || baseZen._listeners.length === 0;

  // Initialize listeners Array if needed
  baseZen._listeners ??= [];
  baseZen._listeners.push(listener);

  if (isFirstListener) {
    _handleFirstSubscription(zen, baseZen);
  }

  // Call listener immediately with the current value
  // biome-ignore lint/suspicious/noExplicitAny: TS struggles with generic overload resolution here
  const initialValue = get(zen as any);
  // biome-ignore lint/suspicious/noExplicitAny: Listener type requires any here due to complex generic
  (listener as Listener<any>)(initialValue, undefined);

  return function unsubscribe() {
    const baseZen = zen as ZenWithValue<ZenValue<A>>;
    const listeners = baseZen._listeners;

    if (!listeners || listeners.length === 0) return;

    // ✅ OPTIMIZATION: Swap-remove for O(1) unsubscribe
    const idx = listeners.indexOf(listener);
    if (idx === -1) return;

    // Swap with last element and pop
    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();

    if (listeners.length === 0) {
      _handleLastUnsubscribe(zen, baseZen);
    }
  };
}

// --- Zen Factory (Functional Style) ---

/**
 * Creates a new writable zen instance (functional style).
 * @param initialValue The initial value of the zen instance.
 * @returns An Zen instance. // Keep return type as Zen for now
 */
export function zen<T>(initialValue: T): Zen<T> {
  // Optimize: Only initialize essential properties. Listeners added on demand.
  const newZen: Zen<T> = {
    _kind: 'zen', // Set kind
    _value: initialValue,
    // Listener properties (e.g., _listeners, _startListeners) are omitted
    // and will be added dynamically by subscribe/event functions if needed.
  };
  // onMount logic removed

  return newZen;
}

// --- Batching Functions (moved from batch.ts) ---

/**
 * Checks if the code is currently executing within a `batch()` call.
 * @internal
 */
export function isInBatch(): boolean {
  // Export for potential external use? Keep internal for now.
  return batchDepth > 0;
}

/**
 * Queues an zen for notification at the end of the batch.
 * Stores the original value before the batch started if it's the first change for this zen in the batch.
 * @internal
 */
// Export for map/deepMap
export function queueZenForBatch<T>(zen: Zen<T>, originalValue: T): void {
  // Only store the original value the *first* time an zen is queued in a batch.
  if (!batchQueue.has(zen as Zen<unknown>)) {
    // Cast to unknown
    batchQueue.set(zen as Zen<unknown>, originalValue); // Cast to unknown
  }
}

/** @internal */
function _processBatchQueue(
  errorOccurred: boolean,
): { zen: Zen<unknown>; value: unknown; oldValue: unknown }[] {
  const changesToNotify: { zen: Zen<unknown>; value: unknown; oldValue: unknown }[] = [];
  if (!errorOccurred && batchQueue.size > 0) {
    try {
      for (const [zen, originalValueBeforeBatch] of batchQueue.entries()) {
        const currentValue = zen._value;
        if (!Object.is(currentValue, originalValueBeforeBatch)) {
          changesToNotify.push({
            zen: zen,
            value: currentValue,
            oldValue: originalValueBeforeBatch,
          });
        }
      }
    } finally {
      // Ensure queue is cleared even if comparison/push fails (though unlikely)
      batchQueue.clear();
    }
  } else {
    // Clear queue if an error occurred or if it was empty
    batchQueue.clear();
  }
  return changesToNotify;
}

/** @internal */
function _notifyBatchedChanges(
  changesToNotify: { zen: Zen<unknown>; value: unknown; oldValue: unknown }[],
): void {
  for (let i = 0; i < changesToNotify.length; i++) {
    notifyListeners(changesToNotify[i].zen, changesToNotify[i].value, changesToNotify[i].oldValue);
  }
}

/**
 * Executes a function, deferring all zen listener notifications until the function completes.
 * Batches can be nested; notifications only run when the outermost batch finishes.
 * @param fn The function to execute within the batch.
 * @returns The return value of the executed function.
 */
export function batch<T>(fn: () => T): T {
  // Export batch
  batchDepth++;

  let errorOccurred = false;
  let result: T;
  // Stores details of zens that actually changed value for final notification.
  const changesToNotify: { zen: Zen<unknown>; value: unknown; oldValue: unknown }[] = []; // Use unknown for zen type

  try {
    result = fn(); // Execute the provided function
  } catch (e) {
    errorOccurred = true;
    throw e; // Re-throw the error after cleanup (in finally)
  } finally {
    batchDepth--;
    // Process queue and clear it *only* if this is the outermost batch call
    if (batchDepth === 0) {
      // _processBatchQueue now handles iterating, checking changes,
      // collecting notifications, AND clearing the queue robustly.
      const changes = _processBatchQueue(errorOccurred);
      // Store changes locally in the finally block's scope
      changesToNotify.push(...changes);
    }
    // NOTE: Queue is guaranteed to be clear here by _processBatchQueue
  }

  // Perform notifications outside the finally block,
  // only if it was the outermost call and no error occurred.
  if (batchDepth === 0 && !errorOccurred && changesToNotify.length > 0) {
    _notifyBatchedChanges(changesToNotify);
  }

  // Return the result of the batch function.
  // Non-null assertion is safe because errors are re-thrown.
  return result; // Remove non-null assertion, TS should infer T
}
