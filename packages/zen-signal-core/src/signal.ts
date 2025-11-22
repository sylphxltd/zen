/**
 * Zen Ultimate v2 (v3.49.0)
 *
 * Combines the best optimizations from all 56 versions:
 * - v3.1.1: Prototype-based, no timestamps, simple dirty flags
 * - v3.48.0: Automatic micro-batching for write operations
 * - NEW: O(n) deduplication with manual loop unrolling
 *
 * Expected Performance:
 * - Matches/beats v3.48.0 on Extreme Write (automatic micro-batching)
 * - Beats v3.48.0 by 10-20x on reactive patterns (no timestamp overhead)
 * - Matches v3.1.1 on reactive patterns (same architecture)
 */

// ============================================================================
// TYPES
// ============================================================================

export type Listener<T> = (value: T, oldValue?: T | null) => void;
export type Unsubscribe = () => void;

type SignalCore<T> = {
  _kind: 'zen' | 'computed';
  _value: T;
  _listeners?: Listener<T>[];
};

type ComputedCore<T> = SignalCore<T | null> & {
  _kind: 'computed';
  _dirty: boolean;
  _sources: AnySignal[];
  _calc: () => T;
  _unsubs?: Unsubscribe[];
  _staticDepsCount?: number; // Consecutive times deps were static (0 = unknown, 1-2 = verifying, 3+ = trusted static)
};

// biome-ignore lint/suspicious/noExplicitAny: Union type for any signal or computed value
export type AnySignal = SignalCore<any> | ComputedCore<any>;
export type SignalValue<A extends AnySignal> = A extends SignalCore<infer V> ? V : never;

// ============================================================================
// AUTO-TRACKING
// ============================================================================

let currentListener: ComputedCore<any> | null = null;

// ============================================================================
// BATCHING
// ============================================================================

// HMR-compatible: Use globalThis to survive Vite HMR reloads
// biome-ignore lint/suspicious/noExplicitAny: HMR global storage
const getGlobalBatchState = () => {
  const g = globalThis as any;
  if (!g.__ZEN_BATCH_STATE__) {
    g.__ZEN_BATCH_STATE__ = {
      batchDepth: 0,
      pendingNotifications: new Map<AnySignal, any>(),
      pendingEffects: [] as Array<() => void>,
    };
  }
  return g.__ZEN_BATCH_STATE__;
};

const batchState = getGlobalBatchState();

function notifyListeners<T>(zen: SignalCore<T>, newValue: T, oldValue: T): void {
  const listeners = zen._listeners;
  if (!listeners) return;

  // Mark computed listeners as dirty first (same as signal setter does)
  // This ensures lazy evaluation works: downstream computeds see dirty flag
  const len = listeners.length;
  for (let i = 0; i < len; i++) {
    const listener = listeners[i];
    if ((listener as any)._computedZen) {
      (listener as any)._computedZen._dirty = true;
    }
  }

  // Then notify all listeners
  // Copy to avoid issues when listeners modify array during iteration
  const listenersCopy = listeners.slice();
  for (let i = 0; i < len; i++) {
    listenersCopy[i](newValue, oldValue);
  }
}

// ============================================================================
// ZEN (Core Signal)
// ============================================================================

const zenProto = {
  get value() {
    // Auto-tracking: register as dependency if inside computed
    if (currentListener) {
      const sources = currentListener._sources;
      // OPTIMIZATION: Inline deduplication check with manual loop
      let found = false;
      const len = sources.length;
      for (let i = 0; i < len; i++) {
        if (sources[i] === this) {
          found = true;
          break;
        }
      }
      if (!found) sources.push(this);
    }
    return this._value;
  },

  // biome-ignore lint/suspicious/noExplicitAny: Generic setter accepts any type
  set value(newValue: any) {
    const oldValue = this._value;
    // OPTIMIZATION: Inline Object.is check (avoid function call)
    // Handle NaN: NaN !== NaN in JS, so if both are NaN, they're equal
    // Handle +0/-0: Object.is(+0, -0) === false, but === treats them as equal
    // We need to detect +0 vs -0: (1/+0) === Infinity, (1/-0) === -Infinity
    if (newValue === oldValue && (newValue !== 0 || 1 / newValue === 1 / oldValue)) return;
    // biome-ignore lint/suspicious/noSelfCompare: Intentional NaN check (IEEE 754)
    if (newValue !== newValue && oldValue !== oldValue) return; // Both NaN

    this._value = newValue;

    // Mark computed dependents as dirty (v3.1.1 style - FAST)
    const listeners = this._listeners;
    if (listeners) {
      const len = listeners.length;
      for (let i = 0; i < len; i++) {
        const listener = listeners[i];
        if ((listener as any)._computedZen) {
          (listener as any)._computedZen._dirty = true;
        }
      }
    }

    // MICRO-BATCHING (from v3.48.0)
    // Key insight: Automatically batch observer notifications
    // This makes Extreme Write fast without sacrificing reactive pattern performance
    if (batchState.batchDepth > 0) {
      // Already in batch - just queue
      if (!batchState.pendingNotifications.has(this)) {
        batchState.pendingNotifications.set(this, oldValue);
      }
    } else {
      // NOT in explicit batch - create micro-batch for this write
      // This batches any downstream computed updates
      batchState.batchDepth++;
      notifyListeners(this, newValue, oldValue);
      batchState.batchDepth--;

      // Flush computed notifications that were queued during micro-batch
      if (batchState.pendingNotifications.size > 0) {
        // Mark all computed listeners as dirty first
        for (const [zen] of batchState.pendingNotifications) {
          const listeners = zen._listeners;
          if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
              const listener = listeners[i];
              if ((listener as any)._computedZen) {
                (listener as any)._computedZen._dirty = true;
              }
            }
          }
        }

        // Call listeners for each signal that changed
        for (const [zen, oldVal] of batchState.pendingNotifications) {
          const listeners = zen._listeners;
          if (listeners) {
            const listenersCopy = listeners.slice();
            const len = listenersCopy.length;
            for (let i = 0; i < len; i++) {
              listenersCopy[i](zen._value, oldVal);
            }
          }
        }

        batchState.pendingNotifications.clear();
      }

      // Flush any effects that were queued during micro-batch
      if (batchState.pendingEffects.length > 0) {
        // Copy the array to avoid issues when effects modify pendingEffects during iteration
        const effectsToRun = batchState.pendingEffects.slice();
        batchState.pendingEffects.length = 0;

        const len = effectsToRun.length;
        for (let i = 0; i < len; i++) {
          effectsToRun[i]();
        }
      }
    }
  },
};

export function signal<T>(initialValue: T): Signal<T> {
  const sig = Object.create(zenProto) as SignalCore<T> & { value: T };
  sig._kind = 'zen';
  sig._value = initialValue;
  return sig;
}

export type Signal<T> = ReturnType<typeof signal<T>>;

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnySignal>(
  zen: A,
  listener: Listener<SignalValue<A>>,
): Unsubscribe {
  const zenData = zen._kind === 'zen' ? zen : zen;

  // Add listener
  if (!zenData._listeners) zenData._listeners = [];
  zenData._listeners.push(listener as any);

  // Force initial computation for computed signals (without notification)
  // Skip if in batch - let the batch flush handle it
  if (zen._kind === 'computed' && zen._dirty && batchState.batchDepth === 0) {
    // Compute WITHOUT notifying (just evaluate the value)
    const prevListener = currentListener;
    currentListener = zen as any;

    try {
      const newValue = (zen as any)._calc();
      (zen as any)._value = newValue;
      (zen as any)._dirty = false;

      // Track static deps if needed
      if ((zen as any)._sources.length > 0 && (zen as any)._staticDepsCount === undefined) {
        (zen as any)._staticDepsCount = 0;
      }
    } finally {
      currentListener = prevListener;
    }

    // Subscribe to sources after initial computation
    if (zen._unsubs === undefined && (zen as any)._sources.length > 0) {
      subscribeToSources(zen as any);
    }
  } else if (zen._kind === 'computed' && zen._unsubs === undefined && (zen as any)._sources.length > 0) {
    // In batch or not dirty - just subscribe to sources without computing
    subscribeToSources(zen as any);
  }

  // BREAKING CHANGE: No initial notification
  // Listeners only fire on updates, not on subscription

  // Return unsubscribe
  return () => {
    const listeners = zenData._listeners;
    if (!listeners) return;

    const idx = listeners.indexOf(listener as any);
    if (idx === -1) return;

    listeners.splice(idx, 1);

    // Unsubscribe computed from sources if no more listeners
    if (listeners.length === 0) {
      zenData._listeners = undefined;
      if (zen._kind === 'computed' && zen._unsubs) {
        unsubscribeFromSources(zen as any);
      }
    }
  };
}

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
  batchState.batchDepth++;
  try {
    return fn();
  } finally {
    if (batchState.batchDepth === 1) {
      // Keep flushing until no more work is pending
      // This handles effects that modify signals during execution
      let maxIterations = 100; // Prevent infinite loops
      while ((batchState.pendingNotifications.size > 0 || batchState.pendingEffects.length > 0) && maxIterations-- > 0) {
        // Flush all pending notifications
        if (batchState.pendingNotifications.size > 0) {
          // Mark all computed listeners as dirty first
          for (const [zen] of batchState.pendingNotifications) {
            const listeners = zen._listeners;
            if (listeners) {
              for (let i = 0; i < listeners.length; i++) {
                const listener = listeners[i];
                if ((listener as any)._computedZen) {
                  (listener as any)._computedZen._dirty = true;
                }
              }
            }
          }

          // Call listeners for each signal that changed
          // Note: Same listener can be called multiple times if subscribed to multiple signals
          for (const [zen, oldValue] of batchState.pendingNotifications) {
            const listeners = zen._listeners;
            if (listeners) {
              const listenersCopy = listeners.slice();
              const len = listenersCopy.length;
              for (let i = 0; i < len; i++) {
                listenersCopy[i](zen._value, oldValue);
              }
            }
          }

          batchState.pendingNotifications.clear();
        }

        // Flush effects after notifications
        if (batchState.pendingEffects.length > 0) {
          // Copy the array to avoid issues when effects modify pendingEffects during iteration
          const effectsToRun = batchState.pendingEffects.slice();
          batchState.pendingEffects.length = 0;

          const len = effectsToRun.length;
          for (let i = 0; i < len; i++) {
            effectsToRun[i]();
          }
        }
      }
    }
    batchState.batchDepth--;
  }
}

// ============================================================================
// COMPUTED
// ============================================================================

function updateComputed<T>(c: ComputedCore<T>): void {
  // For auto-tracked computed, unsubscribe and reset sources for re-tracking
  const needsResubscribe = c._unsubs !== undefined;
  const oldSources = needsResubscribe ? c._sources.slice() : [];
  if (needsResubscribe) {
    unsubscribeFromSources(c);
    c._sources = []; // Reset for re-tracking
  }

  // Set as current listener for auto-tracking
  const prevListener = currentListener;
  currentListener = c;

  try {
    const newValue = c._calc();
    c._dirty = false;

    // OPTIMIZATION: Track static dependencies with confidence counter
    if (c._sources.length > 0) {
      if (needsResubscribe) {
        // Re-computation - check if sources changed
        const sourcesChanged =
          oldSources.length !== c._sources.length || oldSources.some((s, i) => s !== c._sources[i]);

        if (sourcesChanged) {
          // Dynamic deps detected - reset counter
          c._staticDepsCount = 0;
        } else {
          // Static this time - increment counter
          c._staticDepsCount = (c._staticDepsCount || 0) + 1;
        }

        subscribeToSources(c);
      } else if (c._staticDepsCount === undefined) {
        // First computation - start at 0 (unknown)
        c._staticDepsCount = 0;
      }
    }

    // OPTIMIZATION: Inline Object.is check
    if (
      c._value !== null &&
      // biome-ignore lint/suspicious/noSelfCompare: Intentional NaN check (IEEE 754)
      (newValue === c._value || (newValue !== newValue && c._value !== c._value))
    ) {
      return;
    }

    const oldValue = c._value;
    c._value = newValue;

    // Batching support
    if (batchState.batchDepth > 0) {
      if (!batchState.pendingNotifications.has(c)) {
        batchState.pendingNotifications.set(c, oldValue);
      }
    } else {
      notifyListeners(c, newValue, oldValue);
    }
  } finally {
    currentListener = prevListener;
  }
}

// Helper to cleanup unsubs
function cleanUnsubs(unsubs: Unsubscribe[]): void {
  const len = unsubs.length;
  for (let i = 0; i < len; i++) unsubs[i]();
}

// Shared subscription helper for computed & effect
function attachListener(sources: AnySignal[], callback: any): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];
  const len = sources.length;

  for (let i = 0; i < len; i++) {
    const source = sources[i] as SignalCore<any>;
    if (!source._listeners) source._listeners = [];
    source._listeners.push(callback);

    unsubs.push(() => {
      const listeners = source._listeners;
      if (!listeners) return;
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    });
  }

  return unsubs;
}

function subscribeToSources(c: ComputedCore<any>): void {
  const onSourceChange = () => {
    // OPTIMIZATION: Always compute for equality check (minimal notifications!)
    // NEVER track dependencies here - let updateComputed handle re-tracking
    // For static deps (count >= 2): clear dirty to skip updateComputed (1x computation)
    // For dynamic deps (count < 2): keep dirty to force updateComputed re-track (2x computation)

    const staticCount = c._staticDepsCount || 0;
    const trustedStatic = staticCount >= 2;

    // Compute for equality check WITHOUT tracking
    // updateComputed will handle all dependency tracking
    const prevListener = currentListener;
    currentListener = null;

    try {
      const newValue = c._calc();

      // OPTIMIZATION: Inline Object.is check
      const valueChanged = !(
        c._value !== null &&
        // biome-ignore lint/suspicious/noSelfCompare: Intentional NaN check (IEEE 754)
        (newValue === c._value || (newValue !== newValue && c._value !== c._value))
      );

      if (valueChanged) {
        const oldValue = c._value;
        c._value = newValue;

        // Clear dirty only if trusted static (skip updateComputed)
        // Keep dirty for dynamic deps (force updateComputed to re-track)
        if (trustedStatic) {
          c._dirty = false;
        }
        // Note: dirty flag stays true for non-trusted (forces updateComputed)

        // Only notify if value actually changed
        if (batchState.batchDepth > 0) {
          if (!batchState.pendingNotifications.has(c)) {
            batchState.pendingNotifications.set(c, oldValue);
          }
        } else {
          notifyListeners(c as any, newValue, oldValue);
        }
      } else {
        // Value unchanged - always clear dirty (no need to recompute)
        c._dirty = false;
      }
    } finally {
      currentListener = prevListener;
    }
  };
  (onSourceChange as any)._computedZen = c;

  c._unsubs = attachListener(c._sources, onSourceChange);
}

function unsubscribeFromSources(c: ComputedCore<any>): void {
  if (!c._unsubs) return;
  cleanUnsubs(c._unsubs);
  c._unsubs = undefined;
  c._dirty = true;
}

const computedProto = {
  get value() {
    // Auto-tracking: register as dependency if inside computed
    if (currentListener) {
      const sources = currentListener._sources;
      // OPTIMIZATION: Inline deduplication check
      let found = false;
      const len = sources.length;
      for (let i = 0; i < len; i++) {
        if (sources[i] === this) {
          found = true;
          break;
        }
      }
      if (!found) sources.push(this);
    }

    if (this._dirty) {
      updateComputed(this);
      // Subscribe on first access
      if (this._unsubs === undefined && this._sources.length > 0) {
        subscribeToSources(this);
      }
    }
    return this._value;
  },
};

export function computed<T>(
  calculation: () => T,
  explicitDeps?: AnySignal[],
): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  c._kind = 'computed';
  c._value = null;
  c._dirty = true;
  c._sources = explicitDeps || []; // Empty array for auto-tracking
  c._calc = calculation;

  return c;
}

export type ReadonlySignal<T> = ComputedCore<T>;
export type Computed<T> = ComputedCore<T>;

// ============================================================================
// EFFECT (Side Effects with Auto-tracking)
// ============================================================================

// Use WeakMap to store execute functions to avoid race conditions
// HMR-compatible: Store on globalThis to survive Vite HMR reloads
// biome-ignore lint/suspicious/noExplicitAny: HMR global storage
const effectExecutors: WeakMap<EffectCore, () => void> =
  (globalThis as any).__ZEN_EFFECT_EXECUTORS__ ||
  ((globalThis as any).__ZEN_EFFECT_EXECUTORS__ = new WeakMap());

type EffectCore = {
  _sources: AnySignal[];
  _unsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
  _autoTrack: boolean;
  _queued: boolean;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  e._queued = false;

  // Run previous cleanup
  if (e._cleanup) {
    e._cleanup();
    e._cleanup = undefined;
  }

  // Unsubscribe and reset sources for re-tracking (only for auto-tracked effects)
  if (e._autoTrack && e._unsubs !== undefined) {
    cleanUnsubs(e._unsubs);
    e._unsubs = undefined;
    e._sources = [];
  }

  // Set as current listener for auto-tracking (only if auto-track enabled)
  const prevListener = currentListener;
  if (e._autoTrack) {
    currentListener = e as any;
  }

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources (only if not already subscribed)
  if (!e._unsubs && e._sources.length > 0) {
    e._unsubs = attachListener(e._sources, () => runEffect(e));
  }
}

function runEffect(e: EffectCore): void {
  if (e._cancelled || e._queued) return;

  // If in batch, queue for later
  if (batchState.batchDepth > 0) {
    e._queued = true;
    const executor = effectExecutors.get(e);
    if (executor) batchState.pendingEffects.push(executor);
    return;
  }

  // Execute immediately
  executeEffect(e);
}

export function effect(
  callback: () => undefined | (() => void),
  explicitDeps?: AnySignal[],
): Unsubscribe {
  const e: EffectCore = {
    _sources: explicitDeps || [],
    _callback: callback,
    _cancelled: false,
    _autoTrack: !explicitDeps, // Only auto-track if no explicit deps provided
    _queued: false,
  };

  // Set the execute function in WeakMap immediately
  // This must happen before any code that might trigger runEffect
  effectExecutors.set(e, () => executeEffect(e));

  // Run effect immediately (synchronously for initial run)
  const prevListener = currentListener;
  if (e._autoTrack) {
    currentListener = e as any;
  }

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources after initial run
  if (e._sources.length > 0) {
    e._unsubs = attachListener(e._sources, () => runEffect(e));
  }

  // Return unsubscribe function
  return () => {
    if (e._cancelled) return;
    e._cancelled = true;

    // Run final cleanup
    if (e._cleanup) {
      e._cleanup();
    }

    // Unsubscribe from sources
    if (e._unsubs) cleanUnsubs(e._unsubs);
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Run a function without tracking dependencies
 */
export function untrack<T>(fn: () => T): T {
  const prev = currentListener;
  currentListener = null;
  try {
    return fn();
  } finally {
    currentListener = prev;
  }
}

/**
 * Read a signal's value without tracking it as a dependency
 */
export function peek<T>(sig: Signal<T> | ComputedCore<T>): T {
  return untrack(() => (sig as any).value);
}
