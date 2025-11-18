/**
 * Zen v3.29.0 - Complete Solid.js Algorithm Absorption
 *
 * COMPLETE REWRITE based on Solid.js signals/core implementation:
 * 1. ✅ track() optimization - compare old sources, only update changed portion
 * 2. ✅ Incremental source updates - don't rebuild entire sources array
 * 3. ✅ compute() wrapper - proper context save/restore
 * 4. ✅ _time clock system - global clock instead of epoch
 * 5. ✅ No global updateCount - rely on acyclic graph guarantee
 * 6. ✅ Error clearing at update start
 * 7. ✅ Proper STATE_CHECK - recursive check all sources first
 *
 * SOLID.JS CORE ALGORITHM:
 * - Acyclic directed graph of computations
 * - Lazy evaluation with 3-state propagation (CLEAN/CHECK/DIRTY)
 * - Incremental source tracking (only update changed sources)
 * - Proper context management (owner, observer)
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// CONSTANTS (from Solid.js)
// ============================================================================

const STATE_CLEAN = 0;
const STATE_CHECK = 1;
const STATE_DIRTY = 2;
const STATE_DISPOSED = 3;

const EFFECT_PURE = 0;
const EFFECT_USER = 2;

// ============================================================================
// GLOBALS (from Solid.js pattern)
// ============================================================================

let currentObserver: Computation<any> | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let clock = 0; // Global clock (Solid.js uses this instead of per-node epoch)

const pendingEffects: Computation<any>[] = [];
let pendingCount = 0;
let isFlushScheduled = false;

// OPTIMIZATION: Queue-based notification for massive fanouts (Solid.js pattern)
const pendingUpdates: ObserverType[] = [];
let pendingUpdateCount = 0;

// ============================================================================
// INTERFACES (from Solid.js)
// ============================================================================

interface SourceType {
  _observers: ObserverType[] | null;
  _time: number;
  _updateIfNecessary(): void;
}

interface ObserverType {
  _sources: SourceType[] | null;
  _time: number;
  _state: number;
  _notify(state: number): void;
}

interface Owner {
  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null;
}

// ============================================================================
// SCHEDULER
// ============================================================================

function scheduleEffect(effect: Computation<any>) {
  if (effect._pending) return;

  effect._pending = true;

  // OPTIMIZATION: Use indexed assignment instead of push
  pendingEffects[pendingCount++] = effect;

  if (!isFlushScheduled && batchDepth === 0) {
    isFlushScheduled = true;
    flushEffects();
  }
}

function flushEffects() {
  isFlushScheduled = false;

  if (pendingCount === 0) return;

  let error: any;

  while (pendingCount > 0) {
    clock++;
    const count = pendingCount;
    pendingCount = 0;

    // OPTIMIZATION: Process effects in batches for better cache locality
    for (let i = 0; i < count; i++) {
      const effect = pendingEffects[i];

      if (effect._state !== STATE_DISPOSED) {
        try {
          effect.update();
        } catch (err) {
          if (!error) error = err;
        }
      }

      // Clear pending flag AFTER update completes
      effect._pending = false;
    }

    // Clear pending array after processing all effects
    for (let i = 0; i < count; i++) {
      pendingEffects[i] = null as any;
    }
  }

  if (error) throw error;
}

// ============================================================================
// OWNER SYSTEM
// ============================================================================

function disposeOwner(owner: Owner) {
  if (owner._disposal) {
    for (let i = owner._disposal.length - 1; i >= 0; i--) {
      owner._disposal[i]?.();
    }
    owner._disposal = null;
  }
}

// ============================================================================
// DEPENDENCY TRACKING (Solid.js incremental algorithm)
// ============================================================================

/**
 * Track a source in the current computation context.
 * This is the CORE optimization from Solid.js - we compare the new source
 * with the old source at the same index. If they match, we don't need to
 * rebuild the sources array.
 */
function track(source: SourceType) {
  const observer = currentObserver!;
  // OPTIMIZATION: Compare with old sources first
  if (
    !observer._trackingSources &&
    observer._sources &&
    observer._sources[observer._trackingIndex] === source
  ) {
    // Source at this index hasn't changed, just increment
    observer._trackingIndex++;
  } else if (!observer._trackingSources) {
    // First changed source - create trackingSources array
    observer._trackingSources = [source];
  } else if (source !== observer._trackingSources[observer._trackingSources.length - 1]) {
    // Don't add duplicate if it's the same as last source
    observer._trackingSources.push(source);
  }
}

/**
 * OPTIMIZATION: Standalone update check function for better V8 inlining
 */
function updateIfNecessary(computation: Computation<any>): void {
  // OPTIMIZATION: Fast exit for CLEAN or DISPOSED
  if (computation._state === STATE_CLEAN || computation._state === STATE_DISPOSED) return;

  if (computation._state === STATE_CHECK) {
    const sources = computation._sources;
    if (sources) {
      const myTime = computation._time;
      const len = sources.length;

      // OPTIMIZATION: Check all sources, early exit if any changed
      for (let i = 0; i < len; i++) {
        sources[i]._updateIfNecessary();

        // Early exit optimization
        if (sources[i]._time > myTime) {
          computation._state = STATE_DIRTY;
          break;
        }
      }
    }

    // After checking, if still CHECK, mark CLEAN
    if (computation._state === STATE_CHECK) {
      computation._state = STATE_CLEAN;
      return;
    }
  }

  // Only update if DIRTY
  if (computation._state === STATE_DIRTY) {
    runUpdate(computation);
  }
}

/**
 * OPTIMIZATION: Standalone update function for better V8 inlining
 */
function runUpdate(computation: Computation<any>): void {
  // Clear error at START (allow recovery)
  computation._error = undefined;

  if (computation._cleanup && typeof computation._cleanup === 'function') {
    computation._cleanup();
    computation._cleanup = null;
  }

  // Save previous context
  const prevOwner = currentOwner;
  const prevObserver = currentObserver;

  // Set new context
  currentOwner = computation;
  currentObserver = computation;
  computation._trackingSources = null;
  computation._trackingIndex = 0;

  try {
    const newValue = computation._fn();

    const valueChanged = !Object.is(computation._value, newValue);

    if (valueChanged) {
      computation._oldValue = computation._value;
      computation._value = newValue;
    }

    // SOLID.JS PATTERN: Update sources incrementally
    if (computation._trackingSources) {
      // Remove old observers from tail
      if (computation._sources) {
        removeSourceObservers(computation, computation._trackingIndex);
      }

      // Update sources array
      if (computation._sources && computation._trackingIndex > 0) {
        computation._sources.length = computation._trackingIndex + computation._trackingSources.length;
        const newLen = computation._trackingSources.length;
        for (let i = 0; i < newLen; i++) {
          computation._sources[computation._trackingIndex + i] = computation._trackingSources[i];
        }
      } else {
        computation._sources = computation._trackingSources;
      }

      // Add this observer to new sources
      const sourcesLen = computation._sources.length;
      for (let i = computation._trackingIndex; i < sourcesLen; i++) {
        const source = computation._sources[i];
        if (!source._observers) {
          source._observers = [computation];
        } else {
          source._observers.push(computation);
        }
      }
    } else if (computation._sources && computation._trackingIndex < computation._sources.length) {
      // Sources array shrunk
      removeSourceObservers(computation, computation._trackingIndex);
      computation._sources.length = computation._trackingIndex;
    }

    // Update time and notify AFTER sources are updated (Solid.js pattern)
    computation._time = clock + 1;
    computation._state = STATE_CLEAN;

    // Only notify if value actually changed
    if (valueChanged) {
      notifyObservers(computation, STATE_DIRTY);
    }
  } catch (err) {
    computation._error = err;
    computation._state = STATE_CLEAN;
    throw err;
  } finally {
    // Restore context
    currentObserver = prevObserver;
    currentOwner = prevOwner;
  }
}

/**
 * OPTIMIZATION: Standalone notify function for better V8 inlining
 */
function notifyObservers(computation: Computation<any>, state: number): void {
  const observers = computation._observers;
  if (!observers) return;

  const len = observers.length;

  // OPTIMIZATION: Single observer fast path
  if (len === 1) {
    notifyComputation(observers[0] as Computation<any>, state);
    return;
  }

  // OPTIMIZATION: Batch for large observer counts
  if (len > 100) {
    batchDepth++;
    for (let i = 0; i < len; i++) {
      notifyComputation(observers[i] as Computation<any>, state);
    }
    batchDepth--;
  } else {
    for (let i = 0; i < len; i++) {
      notifyComputation(observers[i] as Computation<any>, state);
    }
  }
}

/**
 * OPTIMIZATION: Standalone notify function for better V8 inlining
 */
function notifyComputation(computation: Computation<any>, state: number): void {
  // OPTIMIZATION: Fast path - already at or past this state
  if (computation._state >= state || computation._state === STATE_DISPOSED) {
    // Special handling for self-executing effects
    if (currentObserver === computation && state >= STATE_CHECK && computation._effectType !== EFFECT_PURE) {
      computation._pending = true;
      pendingEffects[pendingCount++] = computation;
    }
    return;
  }

  // Update state
  computation._state = state;

  // Schedule user effects
  if (computation._effectType !== EFFECT_PURE) {
    scheduleEffect(computation);
  }

  // Propagate CHECK to observers
  if (state >= STATE_CHECK) {
    notifyObservers(computation, STATE_CHECK);
  }
}

/**
 * Remove observer from sources starting at fromIndex.
 * This is called when sources array shrinks.
 */
function removeSourceObservers(observer: ObserverType, fromIndex: number) {
  const sources = observer._sources;
  if (!sources) return;

  const len = sources.length;
  for (let i = fromIndex; i < len; i++) {
    const source = sources[i];
    if (source && source._observers) {
      const observers = source._observers;
      const observerCount = observers.length;

      // OPTIMIZATION: Linear search for small arrays, faster than indexOf
      if (observerCount <= 8) {
        for (let j = 0; j < observerCount; j++) {
          if (observers[j] === observer) {
            const last = observerCount - 1;
            if (j < last) {
              observers[j] = observers[last];
            }
            observers.pop();
            break;
          }
        }
      } else {
        const idx = observers.indexOf(observer);
        if (idx !== -1) {
          const last = observerCount - 1;
          if (idx < last) {
            observers[idx] = observers[last];
          }
          observers.pop();
        }
      }
    }
  }
}

// ============================================================================
// COMPUTATION (complete Solid.js algorithm)
// ============================================================================

class Computation<T> implements SourceType, ObserverType, Owner {
  _sources: SourceType[] | null = null;
  _observers: ObserverType[] | null = null;
  _state = STATE_DIRTY;
  _time = -1;

  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null = null;

  _fn: () => T;
  _value: T;
  _oldValue: T | undefined = undefined;
  _error: any = undefined;

  _effectType: number;
  _cleanup: (() => void) | null = null;

  // OPTIMIZATION: Move tracking state from global to instance
  _trackingSources: SourceType[] | null = null;
  _trackingIndex = 0;

  // OPTIMIZATION: Separate pending flag from state for direct comparisons
  _pending = false;

  constructor(fn: () => T, initialValue: T, effectType: number = EFFECT_PURE) {
    this._fn = fn;
    this._value = initialValue;
    this._effectType = effectType;
    this._parent = currentOwner;
    this._context = currentOwner?._context ?? null;
  }

  read(): T {
    if (currentObserver) {
      // OPTIMIZATION: Inline track - avoid function call
      const observer = currentObserver;
      if (!observer._trackingSources && observer._sources && observer._sources[observer._trackingIndex] === this) {
        observer._trackingIndex++;
      } else if (!observer._trackingSources) {
        observer._trackingSources = [this];
      } else if (this !== observer._trackingSources[observer._trackingSources.length - 1]) {
        observer._trackingSources.push(this);
      }

      // Only check if not CLEAN
      if (this._state !== STATE_CLEAN) {
        updateIfNecessary(this);
      }
    } else {
      // OPTIMIZATION: Fast path for untracked reads - check CLEAN first
      if (this._state !== STATE_CLEAN && this._state !== STATE_DISPOSED) {
        updateIfNecessary(this);
      }
    }

    if (this._error !== undefined) {
      throw this._error;
    }

    return this._value;
  }

  write(value: T): void {
    if (Object.is(this._value, value)) return;

    this._value = value;
    this._time = ++clock;
    this._state = STATE_CLEAN;

    notifyObservers(this, STATE_DIRTY);
  }

  // OPTIMIZATION: Delegate to standalone functions for better V8 inlining
  _updateIfNecessary(): void {
    updateIfNecessary(this);
  }

  update(): void {
    runUpdate(this);
  }

  _notify(state: number): void {
    notifyComputation(this, state);
  }

  _notifyObservers(state: number): void {
    notifyObservers(this, state);
  }

  dispose(): void {
    if (this._state === STATE_DISPOSED) return;

    this._state = STATE_DISPOSED;

    if (this._sources) {
      removeSourceObservers(this, 0);
      this._sources = null;
    }

    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    disposeOwner(this);

    if (this._pending) {
      this._pending = false;
    }
  }
}

// ============================================================================
// SIGNAL (minimal, efficient)
// ============================================================================

class Signal<T> implements SourceType {
  _value: T;
  _observers: ObserverType[] | null = null;
  _time = 0;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    // OPTIMIZATION: Inline track - avoid function call overhead
    if (currentObserver) {
      const observer = currentObserver;
      // OPTIMIZATION: Fast path - source unchanged at same index
      if (!observer._trackingSources && observer._sources && observer._sources[observer._trackingIndex] === this) {
        observer._trackingIndex++;
      } else if (!observer._trackingSources) {
        observer._trackingSources = [this];
      } else if (this !== observer._trackingSources[observer._trackingSources.length - 1]) {
        observer._trackingSources.push(this);
      }
    }
    return this._value;
  }

  set value(next: T) {
    if (Object.is(this._value, next)) return;

    this._value = next;
    this._time = ++clock;

    const observers = this._observers;
    if (!observers) return;

    const len = observers.length;

    // OPTIMIZATION: Fast path for single observer (common case)
    if (len === 1) {
      observers[0]._notify(STATE_DIRTY);
      // Only flush if effects are pending and not already scheduled
      if (batchDepth === 0 && pendingCount > 0 && !isFlushScheduled) {
        isFlushScheduled = true;
        flushEffects();
      }
      return;
    }

    // OPTIMIZATION: Queue-based notification for massive fanouts (100+)
    // Solid.js pattern: mark as DIRTY + queue, avoid recursive _notify() calls
    if (len >= 100) {
      batchDepth++;

      // Reset queue for this batch
      pendingUpdateCount = 0;

      // Queue all observers with inline state updates
      for (let i = 0; i < len; i++) {
        const obs = observers[i];

        // Skip if already dirty or disposed
        if (obs._state >= STATE_DIRTY || obs._state === STATE_DISPOSED) {
          continue;
        }

        // Mark as DIRTY directly (inline, no function call)
        obs._state = STATE_DIRTY;

        // Schedule effects
        if ((obs as any)._effectType !== EFFECT_PURE) {
          scheduleEffect(obs as Computation<any>);
        }

        // Queue for downstream propagation
        pendingUpdates[pendingUpdateCount++] = obs;
      }

      // Process queue: propagate CHECK state to downstream observers
      for (let i = 0; i < pendingUpdateCount; i++) {
        const obs = pendingUpdates[i];
        const obsObservers = obs._observers;

        if (obsObservers && obsObservers.length > 0) {
          notifyObservers(obs as Computation<any>, STATE_CHECK);
        }
      }

      batchDepth--;
    } else {
      // Standard path for moderate fanouts (<100)
      batchDepth++;
      for (let i = 0; i < len; i++) {
        observers[i]._notify(STATE_DIRTY);
      }
      batchDepth--;
    }

    if (batchDepth === 0 && pendingCount > 0 && !isFlushScheduled) {
      isFlushScheduled = true;
      flushEffects();
    }
  }

  _updateIfNecessary(): void {
    // Signals are always up to date
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface ZenNode<T> {
  readonly value: T;
  value: T;
}

export interface ComputedNode<T> {
  readonly value: T;
}

export function zen<T>(initial: T): ZenNode<T> {
  return new Signal(initial) as any;
}

export function computed<T>(fn: () => T): ComputedNode<T> {
  const c = new Computation(fn, undefined as any, EFFECT_PURE);

  const node = {
    get value() {
      return c.read();
    },
  } as any;

  node._computation = c;

  return node;
}

export function effect(fn: () => undefined | (() => void)): Unsubscribe {
  const e = new Computation(
    () => {
      const cleanup = fn();
      if (cleanup) {
        e._cleanup = cleanup;
      }
      return undefined;
    },
    undefined,
    EFFECT_USER,
  );

  if (batchDepth > 0) {
    scheduleEffect(e);
  } else {
    e.update();
  }

  return () => e.dispose();
}

export function subscribe<T>(
  node: ZenNode<T> | ComputedNode<T>,
  listener: Listener<T>,
): Unsubscribe {
  let hasValue = false;
  let previousValue!: T;

  if (batchDepth > 0) {
    const computation = (node as any)._computation;
    if (computation) {
      if (computation._state === STATE_DIRTY || computation._state === STATE_CHECK) {
        previousValue = computation._value;
        hasValue = true;
      } else if (computation._oldValue !== undefined) {
        previousValue = computation._oldValue;
        hasValue = true;
      } else {
        previousValue = untrack(() => (node as any).value);
        hasValue = true;
      }
    } else {
      previousValue = untrack(() => (node as any).value);
      hasValue = true;
    }
  }

  return effect(() => {
    const currentValue = (node as any).value;

    if (!hasValue) {
      hasValue = true;
      previousValue = currentValue;
      return;
    }

    listener(currentValue, previousValue);
    previousValue = currentValue;
  });
}

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && !isFlushScheduled && pendingCount > 0) {
      isFlushScheduled = true;
      flushEffects();
    }
  }
}

export function untrack<T>(fn: () => T): T {
  const prev = currentObserver;
  currentObserver = null;
  try {
    return fn();
  } finally {
    currentObserver = prev;
  }
}

export function peek<T>(node: ZenNode<T> | ComputedNode<T>): T {
  return untrack(() => (node as any).value);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ZenNode as ZenCore, ComputedNode as ComputedCore };
export type { ZenNode as Zen, ZenNode as ReadonlyZen, ComputedNode as ComputedZen };
export type { Unsubscribe as AnyZen };
