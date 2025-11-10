/**
 * Zen Optimized with Getter/Setter API
 *
 * API: zen.value / zen.value = newValue
 *
 * 優化策略：
 * 1. 使用原型鏈共享 getter/setter（零閉包開銷）
 * 2. Native getter/setter 可能有更好的 V8 優化
 * 3. 更簡潔的 API
 */

import type { BatchedZen } from './batched';
import type { ComputedZen } from './computed';
import type { ComputedAsyncZen } from './computedAsync';
import type { SelectZen } from './types';
import type {
  AnyZen,
  DeepMapZen,
  Listener,
  MapZen,
  Unsubscribe,
  ZenAsyncState,
  ZenValue,
  ZenWithValue,
} from './types';

// Batching Internals
export let batchDepth = 0;
const batchQueue = new Map<ZenOptimizedGetter<unknown>, unknown>();

// ✅ Graph Coloring Algorithm
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Loop unrolling increases complexity but significantly improves performance
export function markDirty<A extends AnyZen>(zen: A): void {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  baseZen._color = 2; // RED

  const listeners = baseZen._listeners;
  if (!listeners) return;

  const len = listeners.length;

  // ✅ Loop unrolling for 1-3 listeners
  if (len === 1) {
    const listener = listeners[0] as any;
    const listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else if (len === 2) {
    let listener = listeners[0] as any;
    let listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
    listener = listeners[1] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else if (len === 3) {
    let listener = listeners[0] as any;
    let listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
    listener = listeners[1] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
    listener = listeners[2] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else {
    for (let i = 0; i < len; i++) {
      const listener = listeners[i] as any;
      const listenerZen = listener._computedZen || listener;
      if (listenerZen._color === 0) {
        listenerZen._color = 1;
      }
    }
  }
}

export function updateIfNecessary<A extends AnyZen>(zen: A): boolean {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;

  // ✅ OPTIMIZATION: Early return for clean nodes
  if (baseZen._color === 0) {
    return false;
  }

  // ✅ OPTIMIZATION: Direct _update check (avoid kind string comparison)
  const zenWithUpdate = zen as any;
  if (zenWithUpdate._update) {
    return zenWithUpdate._update();
  }

  baseZen._color = 0;
  return false;
}

export function notifyListeners<A extends AnyZen>(
  zen: A,
  value: ZenValue<A>,
  oldValue: ZenValue<A> | undefined,
): void {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  const listeners = baseZen._listeners;

  if (!listeners || listeners.length === 0) return;

  const len = listeners.length;

  // ✅ Loop unrolling for 1-3 listeners
  if (len === 1) {
    listeners[0](value, oldValue);
  } else if (len === 2) {
    listeners[0](value, oldValue);
    listeners[1](value, oldValue);
  } else if (len === 3) {
    listeners[0](value, oldValue);
    listeners[1](value, oldValue);
    listeners[2](value, oldValue);
  } else {
    for (let i = 0; i < len; i++) {
      listeners[i](value, oldValue);
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

// ============================================================================
// Type Definition
// ============================================================================

export type ZenOptimizedGetter<T = unknown> = ZenWithValue<T> & {
  _value: T;
};

/**
 * Backward compatibility: Export as Zen type
 * This ensures existing code using Zen<T> continues to work
 */
export type Zen<T = unknown> = ZenOptimizedGetter<T>;

// ============================================================================
// ✅ OPTIMIZED API - Getter/Setter 版本
// ============================================================================

/**
 * Internal setter implementation (shared by all signals)
 * @internal
 */
function _setImpl<T>(zenData: ZenOptimizedGetter<T>, value: T, force: boolean): void {
  const oldValue = zenData._value;
  if (force || !Object.is(value, oldValue)) {
    // Handle onSet listeners (non-batch mode only)
    const setLs = zenData._setListeners;
    if (setLs && batchDepth <= 0) {
      const len = setLs.length;
      if (len === 1) {
        setLs[0](value);
      } else if (len > 1) {
        for (let i = 0; i < len; i++) {
          setLs[i](value);
        }
      }
    }

    zenData._value = value;
    markDirty(zenData as AnyZen);

    // ✅ OPTIMIZATION: Batch mode check - most common case is non-batched
    if (batchDepth > 0) {
      queueZenForBatch(zenData, oldValue);
    } else {
      notifyListeners(zenData as AnyZen, value, oldValue);
    }
  }
}

/**
 * Shared prototype with getter/setter
 * @internal
 */
const zenProtoGetter = {
  get value() {
    // biome-ignore lint/suspicious/noExplicitAny: `this` context is dynamic
    return (this as any)._value;
  },
  set value(newValue) {
    // biome-ignore lint/suspicious/noExplicitAny: `this` context is dynamic
    _setImpl(this as any, newValue, false);
  },
};

/**
 * Creates a zen signal with getter/setter API
 *
 * @example
 * const count = zen(0);
 * console.log(count.value);  // 0
 * count.value = 1;           // set
 *
 * @param initialValue Initial value
 */
export function zen<T>(initialValue: T): {
  value: T;
  _zenData: ZenOptimizedGetter<T>;
} {
  // ✅ OPTIMIZATION: Use prototype chain with getter/setter
  const zenData: any = Object.create(zenProtoGetter);
  zenData._kind = 'zen';
  zenData._value = initialValue;
  zenData._zenData = zenData;

  return zenData;
}

// ============================================================================
// Backward Compatibility: Functional API
// ============================================================================

export function get<T>(zen: ZenOptimizedGetter<T>): T;
export function get<T>(zen: ComputedZen<T>): T | null;
export function get<T>(zen: ComputedAsyncZen<T>): ZenAsyncState<T>;
export function get<T>(zen: SelectZen<T>): T | null;
export function get<T extends object>(zen: MapZen<T>): T;
export function get<T extends object>(zen: DeepMapZen<T>): T;
export function get<A extends AnyZen>(zen: A): ZenValue<A> | null {
  updateIfNecessary(zen);

  switch (zen._kind) {
    case 'zen':
    case 'map':
    case 'deepMap':
      return zen._value as ZenValue<A>;
    case 'computed': {
      const computed = zen as ComputedZen<ZenValue<A>>;
      return computed._value as ZenValue<A> | null;
    }
    case 'computedAsync': {
      const computedAsync = zen as ComputedAsyncZen<any>;
      return computedAsync._value as ZenValue<A>;
    }
    case 'select': {
      const select = zen as SelectZen<ZenValue<A>>;
      return select._value as ZenValue<A> | null;
    }
    case 'batched': {
      const batched = zen as BatchedZen<ZenValue<A>>;
      return batched._value as ZenValue<A> | null;
    }
    default:
      return null;
  }
}

export function set<T>(zen: ZenOptimizedGetter<T>, value: T, force = false): void {
  _setImpl(zen, value, force);
}

// ============================================================================
// Subscribe & Lifecycle
// ============================================================================

function _handleFirstSubscription(zen: AnyZen, baseZen: ZenWithValue<any>): void {
  if (zen._kind === 'computed' || zen._kind === 'computedAsync' || zen._kind === 'select') {
    const computedZen = zen as ComputedZen<any> | ComputedAsyncZen<any>;
    if (
      '_subscribeToSources' in computedZen &&
      typeof computedZen._subscribeToSources === 'function'
    ) {
      computedZen._subscribeToSources();
    }
  }

  // Trigger onMount listeners and store cleanups
  const mountLs = baseZen._mountListeners;
  if (mountLs) {
    const len = mountLs.length;
    baseZen._mountCleanups ??= new Map();
    for (let i = 0; i < len; i++) {
      const cleanup = mountLs[i]();
      if (typeof cleanup === 'function') {
        baseZen._mountCleanups.set(mountLs[i], cleanup);
      } else {
        baseZen._mountCleanups.set(mountLs[i], undefined);
      }
    }
  }

  // Trigger onStart listeners with current value and store cleanups
  const startLs = baseZen._startListeners;
  if (startLs && startLs.length > 0) {
    const currentValue = get(zen as any);
    const len = startLs.length;
    (baseZen as any)._startCleanups ??= new Map();
    for (let i = 0; i < len; i++) {
      const result = startLs[i](currentValue);
      if (typeof result === 'function') {
        // Store cleanup for this listener
        (baseZen as any)._startCleanups.set(startLs[i], result);
      }
    }
  }
}

function _handleLastUnsubscribe(zen: AnyZen, baseZen: ZenWithValue<any>): void {
  // Clear listeners array
  baseZen._listeners = undefined;

  // Trigger onStop listeners
  const stopLs = baseZen._stopListeners;
  if (stopLs) {
    const len = stopLs.length;
    for (let i = 0; i < len; i++) {
      stopLs[i]();
    }
  }

  // Note: Do NOT clear _startCleanups here
  // They should persist until the onStart listener is explicitly removed via its unsubscribe function

  // Trigger onMount cleanups
  const cleanups = baseZen._mountCleanups;
  if (cleanups && cleanups.size > 0) {
    for (const cleanupFn of cleanups.values()) {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
    baseZen._mountCleanups = undefined;
  }

  // Unsubscribe from sources
  if (zen._kind === 'computed' || zen._kind === 'computedAsync' || zen._kind === 'select') {
    const computedZen = zen as ComputedZen<any> | ComputedAsyncZen<any>;
    if (
      '_unsubscribeFromSources' in computedZen &&
      typeof computedZen._unsubscribeFromSources === 'function'
    ) {
      computedZen._unsubscribeFromSources();
    }
  }
}

export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  const isFirstListener = !baseZen._listeners || baseZen._listeners.length === 0;

  baseZen._listeners ??= [];
  baseZen._listeners.push(listener);

  if (isFirstListener) {
    _handleFirstSubscription(zen, baseZen);
  }

  // ✅ OPTIMIZATION: Fast path for simple signals
  let initialValue: any;
  const kind = zen._kind;
  if (kind === 'zen' || kind === 'map' || kind === 'deepMap') {
    initialValue = baseZen._value;
  } else {
    initialValue = get(zen as any);
  }

  // ✅ OPTIMIZATION: For computedAsync, trigger initial execution if not loaded
  if (kind === 'computedAsync') {
    const computedAsync = zen as ComputedAsyncZen<any>;
    const state = computedAsync._value;
    // Fast-fail checks: most common case is already loaded or loading
    if (!computedAsync._runningPromise && !state.loading && state.data === undefined) {
      computedAsync._executeAsync().catch(() => {
        // Error already handled
      });
    }
  }

  (listener as Listener<any>)(initialValue, undefined);

  return function unsubscribe() {
    const baseZen = zen as ZenWithValue<ZenValue<A>>;
    const listeners = baseZen._listeners;

    if (!listeners || listeners.length === 0) return;

    const idx = listeners.indexOf(listener);
    if (idx === -1) return;

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

// ============================================================================
// Batching Functions
// ============================================================================

export function isInBatch(): boolean {
  return batchDepth > 0;
}

export function queueZenForBatch<T>(zen: ZenOptimizedGetter<T>, originalValue: T): void {
  if (!batchQueue.has(zen)) {
    batchQueue.set(zen, originalValue);
  }
}

export function batch<T>(fn: () => T): T {
  batchDepth++;
  let errorOccurred = false;
  let result: T;

  try {
    result = fn();
  } catch (e) {
    errorOccurred = true;
    throw e;
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      if (!errorOccurred && batchQueue.size > 0) {
        // ✅ Direct notification without intermediate array
        for (const [zen, oldValue] of batchQueue.entries()) {
          const currentValue = zen._value;
          if (!Object.is(currentValue, oldValue)) {
            notifyListeners(zen as AnyZen, currentValue, oldValue);
          }
        }
      }
      batchQueue.clear();
    }
  }
  return result!;
}
