/**
 * Zen Ultra-Optimized Build
 *
 * Maximum performance and minimum bundle size through aggressive inlining.
 * All code is inlined in a single file to eliminate module boundaries.
 *
 * Included: zen, computed, batch, subscribe
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
// BATCHING - OPTIMIZED v3.2 (16x faster!)
// ============================================================================

let batchDepth = 0;
// OPTIMIZATION v3.3: Reusable global queues (reduce GC pressure)
const Updates: Set<ComputedCore<any>> = new Set(); // Set for computed updates (deduplication)
const Effects: Array<() => void> = []; // Queue for side effects
const pendingNotifications = new Map<AnyZen, any>(); // Keep for external stores (map, deepMap)
let isProcessingUpdates = false; // Flag to indicate we're in STEP 1 (processing Updates)

export function notifyListeners<T>(zen: ZenCore<T>, newValue: T, oldValue: T): void {
  const listeners = zen._listeners;
  if (!listeners) return;

  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
}

// Helper for external stores (map, deepMap) to integrate with batching
export function queueZenForBatch(zen: AnyZen, oldValue: any): void {
  if (!pendingNotifications.has(zen)) {
    pendingNotifications.set(zen, oldValue);
  }
}

// Helper to check if currently in a batch
export { batchDepth };

// Helper to check if we're in batch processing phase (STEP 2/3, not STEP 1)
export function isInBatchProcessing(): boolean {
  // We're in processing phase when isProcessingUpdates is true
  // This indicates we're past STEP 1 (Updates processing) and in STEP 2/3
  return isProcessingUpdates;
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

    // OPTIMIZATION v3.2: Mark computed dependents as dirty and queue for batch
    const listeners = this._listeners;
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        const computedZen = (listener as any)._computedZen;
        if (computedZen && !computedZen._dirty) {
          // ✅ v3.3 OPTIMIZATION: Only mark and queue if not already dirty
          computedZen._dirty = true;
          // Add to Updates set if in batch (Set handles deduplication)
          if (batchDepth > 0) {
            Updates.add(computedZen);
          }
        }
      }
    }

    if (batchDepth > 0) {
      // In batch: queue for notification
      if (!pendingNotifications.has(this)) {
        pendingNotifications.set(this, oldValue);
      }
      return;
    }

    // Immediate notification outside batch
    notifyListeners(this, newValue, oldValue);
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

export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
  const zenData = zen._kind === 'zen' ? zen : zen;

  // Add listener
  if (!zenData._listeners) zenData._listeners = [];
  zenData._listeners.push(listener as any);

  // Subscribe computed to sources
  if (zen._kind === 'computed') {
    // Check if it's from computed.ts (has _subscribeToSources method)
    if ((zen as any)._subscribeToSources) {
      const firstListener = zenData._listeners.length === 1;
      if (firstListener) {
        (zen as any)._subscribeToSources();
      }
    } else if (zen._unsubs === undefined) {
      // It's from zen.ts (internal computed)
      subscribeToSources(zen as any);
    }
  }

  // Subscribe batched to sources (for batched stores from batched.ts)
  if (zen._kind === 'batched' && (zen as any)._subscribeToSources) {
    const firstListener = zenData._listeners.length === 1;
    if (firstListener) {
      (zen as any)._subscribeToSources();
    }
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
      if (zen._kind === 'computed') {
        // Check if it's from computed.ts (has _unsubscribeFromSources method)
        if ((zen as any)._unsubscribeFromSources) {
          (zen as any)._unsubscribeFromSources();
        } else if (zen._unsubs) {
          // It's from zen.ts (internal computed)
          unsubscribeFromSources(zen as any);
        }
      }
      // Unsubscribe batched from sources
      if (zen._kind === 'batched' && (zen as any)._unsubscribeFromSources) {
        (zen as any)._unsubscribeFromSources();
      }
    }
  };
}

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
  // ✅ v3.3 OPTIMIZATION: Simplified nesting with reusable queues
  // Nested batch: just increment depth
  if (batchDepth > 0) {
    batchDepth++;
    try {
      return fn();
    } finally {
      batchDepth--;
    }
  }

  // Start new batch
  batchDepth = 1;

  try {
    const result = fn();

    // Only process if we're at depth 1 (outermost batch)
    if (batchDepth === 1) {
      // STEP 1: Process Updates set (computed values)
      // ✅ v3.3 LAZY OPTIMIZATION: Only process computed values that have active listeners
      // This implements Solid-style pull-based evaluation for unobserved computed values
      if (Updates.size > 0) {
        // Keep Updates as a Set to allow new computed to be added during processing
        // This handles dependency chains where updating A dirties B which needs processing
        const processed = new Set<ComputedCore<any>>();
        isProcessingUpdates = true;

        while (Updates.size > 0) {
          // Get next unprocessed computed
          let computed: ComputedCore<any> | undefined;
          for (const c of Updates) {
            if (!processed.has(c)) {
              computed = c;
              break;
            }
          }

          if (!computed) break; // All processed

          // Remove from Updates and mark as processed
          Updates.delete(computed);
          processed.add(computed);

          // ✅ v3.3 LAZY: Skip computation if no listeners (will compute on next access)
          // This is the key difference from v3.2: we don't force computation during batch
          if (computed._dirty && computed._listeners && computed._listeners.length > 0) {
            const oldValue = computed._value;
            let changed = false;

            // Check if it's from computed.ts (has _update method)
            if ((computed as any)._update) {
              changed = (computed as any)._update();
              // Send notification for computed.ts computed values
              if (changed && computed._listeners) {
                for (let j = 0; j < computed._listeners.length; j++) {
                  computed._listeners[j](computed._value, oldValue);
                }
              }
            } else {
              // It's from zen.ts (internal computed)
              // updateComputed will handle both update and notification
              updateComputed(computed);
            }
          }
          // If no listeners, computed stays dirty and will be evaluated on next access (lazy)
        }

        isProcessingUpdates = false;
        Updates.clear(); // Clear for reuse
      }

      // STEP 2: Process external store notifications (map, deepMap)
      if (pendingNotifications.size > 0) {
        for (const [zen, oldValue] of pendingNotifications) {
          const listeners = zen._listeners;
          if (listeners) {
            const newValue = zen._value;
            for (let i = 0; i < listeners.length; i++) {
              listeners[i](newValue, oldValue);
            }
          }
        }
        pendingNotifications.clear();
      }

      // STEP 3: Process Effects queue (side effects)
      if (Effects.length > 0) {
        // Copy effects to process (in case new effects are queued during execution)
        const effectsToRun = Effects.slice();
        Effects.length = 0; // Clear for reuse

        for (let i = 0; i < effectsToRun.length; i++) {
          effectsToRun[i]();
        }
      }
    }

    return result;
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Cleanup only at outermost batch
      isProcessingUpdates = false;
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

    // Notification handling based on context:
    // 1. If processing Updates (STEP 1): notify immediately (don't queue)
    // 2. If in batch but not processing Updates: queue for STEP 2
    // 3. If not in batch: notify immediately
    if (isProcessingUpdates) {
      // We're in STEP 1 processing Updates - notify immediately
      notifyListeners(c, newValue, oldValue);
    } else if (batchDepth > 0) {
      // In batch but not processing Updates - queue for STEP 2
      if (!pendingNotifications.has(c)) {
        pendingNotifications.set(c, oldValue);
      }
    } else {
      // Not in batch - notify immediately
      notifyListeners(c, newValue, oldValue);
    }
  } finally {
    currentListener = prevListener;
  }
}

// Helper to cleanup unsubs
function cleanUnsubs(unsubs: Unsubscribe[]): void {
  for (let i = 0; i < unsubs.length; i++) unsubs[i]();
}

// Shared subscription helper for computed & effect
function attachListener(sources: AnyZen[], callback: any): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  for (let i = 0; i < sources.length; i++) {
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
      const sources = currentListener._sources as AnyZen[];
      if (!sources.includes(this)) {
        sources.push(this);
      }
    }

    if (this._dirty) {
      updateComputed(this);
    }

    // Subscribe on first access (after updateComputed which populates _sources)
    if (this._unsubs === undefined && this._sources.length > 0) {
      subscribeToSources(this);
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
  if (e._cancelled) return;

  // If already queued, skip
  if (e._queued) return;

  // OPTIMIZATION v3.2: Queue in Effects array if in batch
  if (batchDepth > 0 && Effects) {
    e._queued = true;
    Effects.push(e._execute);
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
