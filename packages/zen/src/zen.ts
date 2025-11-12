/**
 * Zen Ultra-Optimized Build
 *
 * Maximum performance and minimum bundle size through aggressive inlining.
 * All code is inlined in a single file to eliminate module boundaries.
 *
 * Included: zen, computed, effect, batch, subscribe
 * Excluded: select, map, get/set, lifecycle, color tracking, advanced features
 *
 * Optimizations:
 * - Fully inlined implementation (no imports)
 * - Minimal type checks
 * - Direct property access
 * - Simplified algorithms
 * - No color tracking (simpler but equally fast)
 * - No object pooling (smaller code)
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
const pendingEffects = new Set<() => void>();

function notifyListeners<T>(zen: ZenCore<T>, newValue: T, oldValue: T) {
  const listeners = zen._listeners;
  if (!listeners) return;

  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
}

function queueNotification(zen: AnyZen, oldValue: any) {
  if (!pendingNotifications.has(zen)) {
    pendingNotifications.set(zen, oldValue);
  }
}

function queueEffect(fn: () => void) {
  pendingEffects.add(fn);
}

// ============================================================================
// ZEN (Core Signal)
// ============================================================================

const zenProto = {
  get value() {
    // Auto-tracking: register as dependency if inside computed
    if (currentListener) {
      const sources = currentListener._sources as AnyZen[];
      if (!sources.includes(this)) {
        sources.push(this);
      }
    }
    return this._value;
  },
  set value(newValue: any) {
    const oldValue = this._value;
    if (Object.is(newValue, oldValue)) return;

    this._value = newValue;

    // Mark computed dependents as dirty
    const listeners = this._listeners;
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        if ((listener as any)._computedZen) {
          (listener as any)._computedZen._dirty = true;
        }
      }
    }

    if (batchDepth > 0) {
      queueNotification(this, oldValue);
    } else {
      notifyListeners(this, newValue, oldValue);
    }
  },
};

export function zen<T>(initialValue: T) {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T; _zenData: ZenCore<T> };
  signal._kind = 'zen';
  signal._value = initialValue;
  signal._zenData = signal;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
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
    if (batchDepth === 1) {
      // About to exit the outermost batch - flush all pending updates
      // Keep batchDepth = 1 so effects get queued instead of running immediately

      // Flush pending notifications
      if (pendingNotifications.size > 0) {
        for (const [zen, oldValue] of pendingNotifications) {
          notifyListeners(zen, zen._value, oldValue);
        }
        pendingNotifications.clear();
      }
      // Flush pending effects (now batchDepth can be 0)
      batchDepth--;
      if (pendingEffects.size > 0) {
        const effects = Array.from(pendingEffects);
        pendingEffects.clear();
        for (const effect of effects) {
          effect();
        }
      }
    } else {
      // Nested batch - just decrement
      batchDepth--;
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

    // Use Object.is for equality check
    if (c._value !== null && Object.is(newValue, c._value)) return;

    const oldValue = c._value;
    c._value = newValue;

    if (batchDepth > 0) {
      queueNotification(c, oldValue);
    } else {
      notifyListeners(c, newValue, oldValue);
    }
  } finally {
    currentListener = prevListener;
  }
}

function subscribeToSources(c: ComputedCore<any>): void {
  const unsubs: Unsubscribe[] = [];

  const onSourceChange = () => {
    c._dirty = true;
    updateComputed(c);
  };
  (onSourceChange as any)._computedZen = c;

  for (let i = 0; i < c._sources.length; i++) {
    const source = c._sources[i] as ZenCore<any>;
    if (!source._listeners) source._listeners = [];
    source._listeners.push(onSourceChange as any);

    unsubs.push(() => {
      const listeners = source._listeners;
      if (!listeners) return;
      const idx = listeners.indexOf(onSourceChange as any);
      if (idx !== -1) listeners.splice(idx, 1);
    });
  }

  c._unsubs = unsubs;
}

function unsubscribeFromSources(c: ComputedCore<any>): void {
  if (!c._unsubs) return;
  for (let i = 0; i < c._unsubs.length; i++) {
    c._unsubs[i]();
  }
  c._unsubs = undefined;
  c._dirty = true;
}

const computedProto = {
  get value() {
    // Auto-tracking: register as dependency if inside computed
    if (currentListener) {
      const sources = currentListener._sources as AnyZen[];
      if (!sources.includes(this)) {
        sources.push(this);
      }
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
    for (let i = 0; i < e._unsubs.length; i++) {
      e._unsubs[i]();
    }
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
    const unsubs: Unsubscribe[] = [];

    const onSourceChange = () => runEffect(e);

    for (let i = 0; i < e._sources.length; i++) {
      const source = e._sources[i] as ZenCore<any>;
      if (!source._listeners) source._listeners = [];
      source._listeners.push(onSourceChange as any);

      unsubs.push(() => {
        const listeners = source._listeners;
        if (!listeners) return;
        const idx = listeners.indexOf(onSourceChange as any);
        if (idx !== -1) listeners.splice(idx, 1);
      });
    }

    e._unsubs = unsubs;
  }
}

function runEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // If already queued, skip
  if (e._queued) return;

  // If in batch, queue for later
  if (batchDepth > 0) {
    e._queued = true;
    queueEffect(e._execute);
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

  // Subscribe to tracked sources after initial run
  if (e._sources.length > 0) {
    const unsubs: Unsubscribe[] = [];

    const onSourceChange = () => runEffect(e);

    for (let i = 0; i < e._sources.length; i++) {
      const source = e._sources[i] as ZenCore<any>;
      if (!source._listeners) source._listeners = [];
      source._listeners.push(onSourceChange as any);

      unsubs.push(() => {
        const listeners = source._listeners;
        if (!listeners) return;
        const idx = listeners.indexOf(onSourceChange as any);
        if (idx !== -1) listeners.splice(idx, 1);
      });
    }

    e._unsubs = unsubs;
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
    if (e._unsubs) {
      for (let i = 0; i < e._unsubs.length; i++) {
        e._unsubs[i]();
      }
    }
  };
}
