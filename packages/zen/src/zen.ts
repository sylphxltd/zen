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

type ZenCore<T> = {
  _kind: 'zen' | 'computed';
  _value: T;
  _listeners?: Listener<T>[];
};

type ComputedCore<T> = ZenCore<T | null> & {
  _kind: 'computed';
  _dirty: boolean;
  _sources: AnyZen[];
  _calc: () => T;
  _unsubs?: Unsubscribe[];
};

export type AnyZen = ZenCore<any> | ComputedCore<any>;
export type ZenValue<A extends AnyZen> = A extends ZenCore<infer V> ? V : never;

// ============================================================================
// AUTO-TRACKING
// ============================================================================

let currentListener: ComputedCore<any> | null = null;

// ============================================================================
// BATCHING
// ============================================================================

let batchDepth = 0;
const pendingNotifications = new Map<AnyZen, any>();
const pendingEffects: Array<() => void> = [];

function notifyListeners<T>(zen: ZenCore<T>, newValue: T, oldValue: T): void {
  const listeners = zen._listeners;
  if (!listeners) return;

  // OPTIMIZATION: Cache length and inline loop
  const len = listeners.length;
  for (let i = 0; i < len; i++) {
    listeners[i](newValue, oldValue);
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

  set value(newValue: any) {
    const oldValue = this._value;
    // OPTIMIZATION: Inline Object.is check (avoid function call)
    if (newValue === oldValue || (newValue !== newValue && oldValue !== oldValue)) return;

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
    if (batchDepth > 0) {
      // Already in batch - just queue
      if (!pendingNotifications.has(this)) {
        pendingNotifications.set(this, oldValue);
      }
    } else {
      // NOT in explicit batch - create micro-batch for this write
      // This batches any downstream computed updates
      batchDepth++;
      notifyListeners(this, newValue, oldValue);
      batchDepth--;

      // Flush any effects that were queued during micro-batch
      if (pendingEffects.length > 0) {
        const len = pendingEffects.length;
        for (let i = 0; i < len; i++) {
          pendingEffects[i]();
        }
        pendingEffects.length = 0;
      }
    }
  },
};

export function zen<T>(initialValue: T): Zen<T> {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T };
  signal._kind = 'zen';
  signal._value = initialValue;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(
  zen: A,
  listener: Listener<ZenValue<A>>,
): Unsubscribe {
  const zenData = zen._kind === 'zen' ? zen : zen;

  // Add listener
  if (!zenData._listeners) zenData._listeners = [];
  zenData._listeners.push(listener as any);

  // Subscribe computed to sources
  if (zen._kind === 'computed' && zen._unsubs === undefined) {
    subscribeToSources(zen as any);
  }

  // Initial notification
  listener(zenData._value as any, undefined);

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
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Flush all pending notifications
      if (pendingNotifications.size > 0) {
        // OPTIMIZATION: Inline notification loop
        for (const [zen, oldValue] of pendingNotifications) {
          const listeners = zen._listeners;
          if (listeners) {
            const newValue = zen._value;
            const len = listeners.length;
            for (let i = 0; i < len; i++) {
              listeners[i](newValue, oldValue);
            }
          }
        }
        pendingNotifications.clear();
      }

      // Flush effects after notifications
      if (pendingEffects.length > 0) {
        const len = pendingEffects.length;
        for (let i = 0; i < len; i++) {
          pendingEffects[i]();
        }
        pendingEffects.length = 0;
      }
    }
  }
}

// ============================================================================
// COMPUTED
// ============================================================================

function updateComputed<T>(c: ComputedCore<T>): void {
  // For auto-tracked computed, unsubscribe and reset sources for re-tracking
  const needsResubscribe = c._unsubs !== undefined;
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

    // Re-subscribe to newly tracked sources
    if (needsResubscribe && c._sources.length > 0) {
      subscribeToSources(c);
    }

    // OPTIMIZATION: Inline Object.is check
    if (c._value !== null && (newValue === c._value || (newValue !== newValue && c._value !== c._value))) {
      return;
    }

    const oldValue = c._value;
    c._value = newValue;

    // Batching support
    if (batchDepth > 0) {
      if (!pendingNotifications.has(c)) {
        pendingNotifications.set(c, oldValue);
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
function attachListener(sources: AnyZen[], callback: any): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];
  const len = sources.length;

  for (let i = 0; i < len; i++) {
    const source = sources[i] as ZenCore<any>;
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
    c._dirty = true;
    updateComputed(c);
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
  explicitDeps?: AnyZen[],
): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  c._kind = 'computed';
  c._value = null;
  c._dirty = true;
  c._sources = explicitDeps || []; // Empty array for auto-tracking
  c._calc = calculation;

  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// EFFECT (Side Effects with Auto-tracking)
// ============================================================================

type EffectCore = {
  _sources: AnyZen[];
  _unsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
  _autoTrack: boolean;
  _queued: boolean;
  _execute: () => void;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  e._queued = false;

  // Run previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch (_) {}
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
  } catch (_err) {
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
  if (batchDepth > 0) {
    e._queued = true;
    pendingEffects.push(e._execute);
    return;
  }

  // Execute immediately
  executeEffect(e);
}

export function effect(
  callback: () => undefined | (() => void),
  explicitDeps?: AnyZen[],
): Unsubscribe {
  const e: EffectCore = {
    _sources: explicitDeps || [],
    _callback: callback,
    _cancelled: false,
    _autoTrack: !explicitDeps, // Only auto-track if no explicit deps provided
    _queued: false,
    _execute: null as any, // Will be set below
  };

  // Create stable reference for queuing
  e._execute = () => executeEffect(e);

  // Run effect immediately (synchronously for initial run)
  const prevListener = currentListener;
  if (e._autoTrack) {
    currentListener = e as any;
  }

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch (_err) {
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
      try {
        e._cleanup();
      } catch (_) {}
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
export function peek<T>(signal: Zen<T> | ComputedCore<T>): T {
  return untrack(() => (signal as any).value);
}
