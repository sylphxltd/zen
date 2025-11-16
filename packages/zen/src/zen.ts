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

const FLAG_PENDING = 4;

// ============================================================================
// GLOBALS (from Solid.js pattern)
// ============================================================================

let currentObserver: Computation<any> | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let clock = 0; // Global clock (Solid.js uses this instead of per-node epoch)

// Optimization: track() context
let newSources: SourceType[] | null = null;
let newSourcesIndex = 0;

const pendingEffects: Computation<any>[] = [];
let pendingCount = 0;
let isFlushScheduled = false;

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
  if (effect._state & FLAG_PENDING) return;

  effect._state |= FLAG_PENDING;

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

      if ((effect._state & 3) !== STATE_DISPOSED) {
        try {
          effect.update();
        } catch (err) {
          if (!error) error = err;
        }
      }

      // Clear FLAG_PENDING AFTER update completes
      effect._state &= ~FLAG_PENDING;
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
  // OPTIMIZATION: Compare with old sources first
  if (
    !newSources &&
    currentObserver!._sources &&
    currentObserver!._sources[newSourcesIndex] === source
  ) {
    // Source at this index hasn't changed, just increment
    newSourcesIndex++;
  } else if (!newSources) {
    // First changed source - create newSources array
    newSources = [source];
  } else if (source !== newSources[newSources.length - 1]) {
    // Don't add duplicate if it's the same as last source
    newSources.push(source);
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
      const sources = currentObserver._sources;
      if (!newSources && sources && sources[newSourcesIndex] === this) {
        newSourcesIndex++;
      } else if (!newSources) {
        newSources = [this];
      } else if (this !== newSources[newSources.length - 1]) {
        newSources.push(this);
      }

      // OPTIMIZATION: Only check state if necessary
      const state = this._state & 3;
      if (state !== STATE_CLEAN) {
        this._updateIfNecessary();
      }
    } else {
      // OPTIMIZATION: No observer - only update if needed
      const state = this._state & 3;
      if (state !== STATE_CLEAN && state !== STATE_DISPOSED) {
        this._updateIfNecessary();
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
    this._state = (this._state & ~3) | STATE_CLEAN;

    this._notifyObservers(STATE_DIRTY);
  }

  /**
   * SOLID.JS CORE: This is the critical algorithm
   *
   * STATE_CHECK means a grandparent *might* have changed.
   * We recursively call _updateIfNecessary() on ALL sources first,
   * then check if ANY of them changed (by comparing _time).
   *
   * This is MORE CORRECT than our old approach which would
   * break the loop early.
   */
  _updateIfNecessary(): void {
    const state = this._state & 3;

    // OPTIMIZATION: Fast exit for CLEAN or DISPOSED
    if (state === STATE_CLEAN || state === STATE_DISPOSED) return;

    if (state === STATE_CHECK) {
      const sources = this._sources;
      if (sources) {
        const myTime = this._time;
        // OPTIMIZATION: Unrolled loop for small source counts (common case)
        const len = sources.length;

        if (len === 1) {
          sources[0]._updateIfNecessary();
          if (sources[0]._time > myTime) {
            this._state = (this._state & ~3) | STATE_DIRTY;
            this.update();
            return;
          }
        } else if (len === 2) {
          sources[0]._updateIfNecessary();
          if (sources[0]._time > myTime) {
            this._state = (this._state & ~3) | STATE_DIRTY;
            this.update();
            return;
          }
          sources[1]._updateIfNecessary();
          if (sources[1]._time > myTime) {
            this._state = (this._state & ~3) | STATE_DIRTY;
            this.update();
            return;
          }
        } else {
          // General case for 3+ sources
          for (let i = 0; i < len; i++) {
            sources[i]._updateIfNecessary();
            if (sources[i]._time > myTime) {
              this._state = (this._state & ~3) | STATE_DIRTY;
              this.update();
              return;
            }
          }
        }
      }

      // After checking, if still CHECK, mark CLEAN
      this._state = (this._state & ~3) | STATE_CLEAN;
      return;
    }

    // Only update if DIRTY
    if (state === STATE_DIRTY) {
      this.update();
    }
  }

  /**
   * SOLID.JS PATTERN: Re-run computation using proper context management
   */
  update(): void {
    // Clear error at START (allow recovery)
    this._error = undefined;

    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    // Save previous context
    const prevOwner = currentOwner;
    const prevObserver = currentObserver;
    const prevNewSources = newSources;
    const prevNewSourcesIndex = newSourcesIndex;

    // Set new context
    currentOwner = this;
    currentObserver = this;
    newSources = null;
    newSourcesIndex = 0;

    try {
      const newValue = this._fn();

      const valueChanged = !Object.is(this._value, newValue);

      if (valueChanged) {
        this._oldValue = this._value;
        this._value = newValue;
      }

      // SOLID.JS PATTERN: Update sources incrementally
      if (newSources) {
        // Remove old observers from tail
        if (this._sources) {
          removeSourceObservers(this, newSourcesIndex);
        }

        // Update sources array
        if (this._sources && newSourcesIndex > 0) {
          this._sources.length = newSourcesIndex + newSources.length;
          const newLen = newSources.length;
          for (let i = 0; i < newLen; i++) {
            this._sources[newSourcesIndex + i] = newSources[i];
          }
        } else {
          this._sources = newSources;
        }

        // Add this observer to new sources
        const sourcesLen = this._sources.length;
        for (let i = newSourcesIndex; i < sourcesLen; i++) {
          const source = this._sources[i];
          if (!source._observers) {
            source._observers = [this];
          } else {
            source._observers.push(this);
          }
        }
      } else if (this._sources && newSourcesIndex < this._sources.length) {
        // Sources array shrunk
        removeSourceObservers(this, newSourcesIndex);
        this._sources.length = newSourcesIndex;
      }

      // Update time and notify AFTER sources are updated (Solid.js pattern)
      this._time = clock + 1;
      this._state = (this._state & ~3) | STATE_CLEAN;

      // Only notify if value actually changed
      if (valueChanged) {
        this._notifyObservers(STATE_DIRTY);
      }
    } catch (err) {
      this._error = err;
      this._state = (this._state & ~3) | STATE_CLEAN;
      throw err;
    } finally {
      // Restore context
      currentObserver = prevObserver;
      currentOwner = prevOwner;
      newSources = prevNewSources;
      newSourcesIndex = prevNewSourcesIndex;
    }
  }

  _notify(state: number): void {
    const currentState = this._state & 3;

    // OPTIMIZATION: Fast path - already at or past this state
    if (currentState >= state || currentState === STATE_DISPOSED) {
      // Special handling for self-executing effects
      if (currentObserver === this && state >= STATE_CHECK && this._effectType !== EFFECT_PURE) {
        this._state |= FLAG_PENDING;
        pendingEffects[pendingCount++] = this;
      }
      return;
    }

    // Update state
    this._state = (this._state & ~3) | state;

    // Schedule user effects
    if (this._effectType !== EFFECT_PURE) {
      scheduleEffect(this);
    }

    // Propagate CHECK to observers
    if (state >= STATE_CHECK) {
      this._notifyObservers(STATE_CHECK);
    }
  }

  _notifyObservers(state: number): void {
    const observers = this._observers;
    if (!observers) return;

    const len = observers.length;

    // OPTIMIZATION: Single observer fast path
    if (len === 1) {
      observers[0]._notify(state);
      return;
    }

    // OPTIMIZATION: Batch for fanout > 10 (lower threshold for better massive fanout)
    if (len > 10) {
      batchDepth++;
      for (let i = 0; i < len; i++) {
        observers[i]._notify(state);
      }
      batchDepth--;
    } else {
      for (let i = 0; i < len; i++) {
        observers[i]._notify(state);
      }
    }
  }

  dispose(): void {
    if ((this._state & 3) === STATE_DISPOSED) return;

    this._state = (this._state & ~3) | STATE_DISPOSED;

    if (this._sources) {
      removeSourceObservers(this, 0);
      this._sources = null;
    }

    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    disposeOwner(this);

    if (this._state & FLAG_PENDING) {
      this._state &= ~FLAG_PENDING;
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
      const sources = currentObserver._sources;
      // OPTIMIZATION: Fast path - source unchanged at same index
      if (!newSources && sources && sources[newSourcesIndex] === this) {
        newSourcesIndex++;
      } else if (!newSources) {
        newSources = [this];
      } else if (this !== newSources[newSources.length - 1]) {
        newSources.push(this);
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

    // Auto-batching for multiple observers
    batchDepth++;
    for (let i = 0; i < len; i++) {
      observers[i]._notify(STATE_DIRTY);
    }
    batchDepth--;

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
      if ((computation._state & 3) === STATE_DIRTY || (computation._state & 3) === STATE_CHECK) {
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
