/**
 * Zen Ultra - Fine-Grained Reactive Primitives
 * Optimized for speed, performance, and small size
 *
 * Core principles:
 * - Fine-grained reactive graph (signals + computeds + effects)
 * - O(1) subscribe, O(n) unsubscribe (simple array for small listener counts)
 * - Lazy computed evaluation with dirty flag tracking
 * - Direct propagation (no topological scheduling overhead)
 * - Manual batching only (no auto-batching)
 * - Minimal allocations and bookkeeping
 * - Ref-counted effect tracking for O(1) downstream effect detection
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// FLAGS
// ============================================================================

const FLAG_STALE = 0b000001;           // Computed is dirty, needs recompute
const FLAG_PENDING = 0b000010;         // Currently computing (prevent re-entry)
const FLAG_PENDING_NOTIFY = 0b000100;  // Queued for notification
const FLAG_IN_DIRTY_QUEUE = 0b001000;  // In dirty nodes queue
const FLAG_IS_COMPUTED = 0b010000;     // Node is a ComputedNode (avoid instanceof)
const FLAG_HAD_EFFECT_DOWNSTREAM = 0b100000; // Had effect listeners downstream (conservative cache)

// ============================================================================
// LISTENER TYPES
// ============================================================================

// Direct callbacks for maximum performance (O(n) unsubscribe is acceptable)

// ============================================================================
// BASE NODE
// ============================================================================

/**
 * Base class for all reactive nodes (signals and computeds).
 * Unified structure for the reactive graph.
 */
abstract class BaseNode<V> {
  _value: V;
  _computedListeners: AnyNode[] = [];
  _effectListeners: Listener<any>[] = [];
  _flags = 0;
  _lastSeenEpoch = 0; // Epoch-based deduplication: O(1) tracking check

  constructor(initial: V) {
    this._value = initial;
  }
}

type AnyNode = BaseNode<unknown>;

/**
 * Dependency collector interface (for runtime tracking).
 */
interface DependencyCollector {
  _sources: AnyNode[];
  _epoch: number; // Current tracking epoch for O(1) deduplication
}

// Global tracking context
let currentListener: DependencyCollector | null = null;

// Global tracking epoch counter for O(1) dependency deduplication
let TRACKING_EPOCH = 1;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Value equality check using Object.is (handles NaN and +0/-0 correctly).
 * Object.is is optimized by V8 and handles edge cases natively.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  return Object.is(a, b);
}

/**
 * Add effect listener.
 * Subscribe: O(1) push
 * Unsubscribe: O(n) indexOf + splice
 */
function addEffectListener(node: AnyNode, cb: Listener<any>): Unsubscribe {
  node._effectListeners.push(cb);

  return (): void => {
    const list = node._effectListeners;
    const idx = list.indexOf(cb);
    if (idx >= 0) {
      list.splice(idx, 1);
    }
  };
}

/**
 * Add computed listener.
 * Subscribe: O(1) push
 * Unsubscribe: O(n) indexOf + splice
 */
function addComputedListener(source: AnyNode, node: AnyNode): Unsubscribe {
  source._computedListeners.push(node);

  return (): void => {
    const list = source._computedListeners;
    const idx = list.indexOf(node);
    if (idx >= 0) {
      list.splice(idx, 1);
    }
  };
}

// ============================================================================
// DIRTY QUEUE
// ============================================================================

const dirtyNodes: AnyNode[] = [];

/**
 * Mark node as dirty (deduped via FLAG_IN_DIRTY_QUEUE).
 */
function markNodeDirty(node: AnyNode): void {
  if ((node._flags & FLAG_IN_DIRTY_QUEUE) === 0) {
    node._flags |= FLAG_IN_DIRTY_QUEUE;
    dirtyNodes.push(node);
  }
}

// ============================================================================
// SIGNAL
// ============================================================================

class ZenNode<T> extends BaseNode<T> {
  get value(): T {
    // Runtime dependency tracking with O(1) epoch-based deduplication
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;

      // Only add if not seen in this tracking session (O(1) check)
      if (self._lastSeenEpoch !== currentListener._epoch) {
        self._lastSeenEpoch = currentListener._epoch;
        list.push(self);
      }
    }
    return this._value;
  }

  set value(next: T) {
    const prev = this._value;

    // Fast equality check (NaN + +0/-0 aware)
    if (valuesEqual(next, prev)) return;

    this._value = next;

    // Direct propagation for maximum performance
    if (batchDepth === 0 && !isFlushing) {
      // Unified path: mark computed listeners stale and recompute if needed
      propagateToComputeds(this as AnyNode);

      // Notify effects immediately
      const effects = this._effectListeners;
      const len = effects.length;
      if (len === 0) {
        // Flush any queued computed notifications
        if (pendingNotifications.length > 0) {
          flushPendingNotifications();
        }
        return;
      }

      // Unrolled for 1-3 listeners (common cases)
      if (len === 1) {
        effects[0]!(next, prev);
      } else if (len === 2) {
        effects[0]!(next, prev);
        effects[1]!(next, prev);
      } else if (len === 3) {
        effects[0]!(next, prev);
        effects[1]!(next, prev);
        effects[2]!(next, prev);
      } else {
        for (let i = 0; i < len; i++) {
          effects[i]!(next, prev);
        }
      }

      // Flush any queued computed notifications after signal effects
      if (pendingNotifications.length > 0) {
        flushPendingNotifications();
      }
      return;
    }

    // Batched path: queue for later (flushBatchedUpdates handles propagation)
    markNodeDirty(this as AnyNode);
    queueBatchedNotification(this as AnyNode, prev);

    if (batchDepth === 0 && !isFlushing) {
      flushBatchedUpdates();
    }
  }
}

export function zen<T>(initial: T): ZenNode<T> {
  return new ZenNode<T>(initial);
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED
// ============================================================================

class ComputedNode<T> extends BaseNode<T | null> {
  _calc: () => T;
  _sources: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];

  constructor(calc: () => T) {
    super(null as T | null);
    this._calc = calc;
    this._sources = [];
    this._flags = FLAG_STALE | FLAG_IS_COMPUTED; // Start dirty + mark as computed
  }

  // Compatibility accessors
  get _unsubs(): Unsubscribe[] | undefined {
    return this._sourceUnsubs;
  }

  get _dirty(): boolean {
    return (this._flags & FLAG_STALE) !== 0;
  }

  /**
   * Lazy recompute - only when stale.
   * Simple dirty flag check (v3.11-style) for maximum performance.
   */
  private _recomputeIfNeeded(): void {
    // Simple dirty flag check (faster than version checking)
    if ((this._flags & FLAG_STALE) === 0) return;

    // Prevent re-entry during computation (detect cyclic dependencies)
    if ((this._flags & FLAG_PENDING) !== 0) {
      throw new Error('[Zen] Cyclic dependency detected in computed');
    }

    const hadSubscriptions = this._sourceUnsubs !== undefined;
    const prevListener = currentListener;

    // BUG FIX 1.1: Store complete old sources for full comparison
    const oldSources = hadSubscriptions ? this._sources.slice() : null;

    this._sources.length = 0;

    this._flags |= FLAG_PENDING;
    this._flags &= ~FLAG_STALE;

    const oldValue = this._value;
    let newValue: T | null;

    // BUG FIX 1.2: try/finally to ensure cleanup on error
    try {
      // Set up new tracking epoch for O(1) dependency deduplication
      currentListener = this as unknown as DependencyCollector;
      (currentListener as any)._epoch = ++TRACKING_EPOCH;
      newValue = this._calc();
      this._value = newValue;

      // BUG FIX 1.1: Full dependency comparison
      if (hadSubscriptions && oldSources) {
        const srcs = this._sources;
        let depsChanged = oldSources.length !== srcs.length;

        if (!depsChanged) {
          for (let i = 0; i < srcs.length; i++) {
            if (oldSources[i] !== srcs[i]) {
              depsChanged = true;
              break;
            }
          }
        }

        if (depsChanged) {
          this._unsubscribeFromSources();
          if (srcs.length > 0) {
            this._subscribeToSources();
          }
        }
      }

      // Queue notification if value changed
      if (!valuesEqual(oldValue, newValue)) {
        // CRITICAL: Mark downstream computeds as stale (fixes computed chain bug)
        const downstream = this._computedListeners;
        const downLen = downstream.length;
        for (let i = 0; i < downLen; i++) {
          downstream[i]!._flags |= FLAG_STALE;
        }

        queueBatchedNotification(this as AnyNode, oldValue);
      }
    } finally {
      currentListener = prevListener;
      this._flags &= ~FLAG_PENDING;
    }
  }

  get value(): T {
    // Lazy evaluation
    this._recomputeIfNeeded();

    // Allow tracking by parent computeds/effects with O(1) epoch-based deduplication
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;

      // Only add if not seen in this tracking session (O(1) check)
      if (self._lastSeenEpoch !== currentListener._epoch) {
        self._lastSeenEpoch = currentListener._epoch;
        list.push(self);
      }
    }

    // First-time subscription to sources
    if (this._sourceUnsubs === undefined && this._sources.length > 0) {
      this._subscribeToSources();
    }

    return this._value as T;
  }

  _subscribeToSources(): void {
    const srcs = this._sources;
    const len = srcs.length;
    if (len === 0 || this._sourceUnsubs !== undefined) return;

    this._sourceUnsubs = [];
    for (let i = 0; i < len; i++) {
      const unsub = addComputedListener(srcs[i]!, this as unknown as AnyNode);
      this._sourceUnsubs.push(unsub);
    }
  }

  _unsubscribeFromSources(): void {
    const unsubs = this._sourceUnsubs;
    if (!unsubs) return;

    const len = unsubs.length;
    for (let i = 0; i < len; i++) {
      unsubs[i]!();
    }
    this._sourceUnsubs = undefined;
  }
}

export function computed<T>(calculation: () => T): ComputedNode<T> {
  return new ComputedNode<T>(calculation);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ZenCore<T> = ZenNode<T>;
export type ComputedCore<T> = ComputedNode<T>;
export type AnyZen = ZenCore<unknown> | ComputedCore<unknown>;
export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCHING & NOTIFICATIONS
// ============================================================================

/**
 * Check if a node has effect listeners downstream.
 * Uses conservative caching - flag is set but never automatically cleared.
 * This means once a node had effects, it will always return true (safe but not optimal).
 * Trade-off: Simpler code, no ref-count overhead, but some unnecessary work after unsubscribe.
 */
function hasDownstreamEffectListeners(node: AnyNode): boolean {
  // Fast path: check cached flag (conservative - never cleared)
  if ((node._flags & FLAG_HAD_EFFECT_DOWNSTREAM) !== 0) return true;

  // Direct effect listeners
  if (node._effectListeners.length > 0) {
    node._flags |= FLAG_HAD_EFFECT_DOWNSTREAM;
    return true;
  }

  // Check computed listeners recursively
  const computed = node._computedListeners;
  for (let i = 0; i < computed.length; i++) {
    if (hasDownstreamEffectListeners(computed[i]!)) {
      node._flags |= FLAG_HAD_EFFECT_DOWNSTREAM;
      return true;
    }
  }

  return false;
}

/**
 * BUG FIX 1.4: Recursively recompute downstream computeds that have effect listeners.
 * This ensures multi-level computed chains update correctly.
 */
function recomputeDownstreamWithListeners(node: AnyNode): void {
  const computed = node._computedListeners;
  for (let i = 0; i < computed.length; i++) {
    const c = computed[i]!;
    if (hasDownstreamEffectListeners(c)) {
      (c as ComputedNode<any>)._recomputeIfNeeded();
      // Recursively process this computed's downstream
      recomputeDownstreamWithListeners(c);
    }
  }
}

/**
 * Unified path: Mark computed listeners stale and trigger recompute if needed.
 * Used by both immediate and batched update paths.
 */
function propagateToComputeds(node: AnyNode): void {
  const computed = node._computedListeners;
  const len = computed.length;
  for (let i = 0; i < len; i++) {
    const c = computed[i]!;
    c._flags |= FLAG_STALE;
    // BUG FIX 1.4: If computed has effect listeners, trigger recompute + notify
    if (hasDownstreamEffectListeners(c)) {
      (c as ComputedNode<any>)._recomputeIfNeeded();
      recomputeDownstreamWithListeners(c);
    }
  }
}

let batchDepth = 0;

type PendingNotification = [AnyNode, unknown];
const pendingNotifications: PendingNotification[] = [];

/**
 * Queue node for batched notification (deduped via FLAG_PENDING_NOTIFY).
 * Earliest oldValue wins.
 */
function queueBatchedNotification(node: AnyNode, oldValue: unknown): void {
  if ((node._flags & FLAG_PENDING_NOTIFY) === 0) {
    node._flags |= FLAG_PENDING_NOTIFY;
    pendingNotifications.push([node, oldValue]);
  }
}

/**
 * Notify all effect listeners (micro-optimized for common cases).
 */
function notifyEffects(node: AnyNode, newValue: unknown, oldValue: unknown): void {
  const effects = node._effectListeners;
  const len = effects.length;

  // Unrolled for 1-3 listeners
  if (len === 1) {
    effects[0]!(newValue, oldValue);
  } else if (len === 2) {
    effects[0]!(newValue, oldValue);
    effects[1]!(newValue, oldValue);
  } else if (len === 3) {
    effects[0]!(newValue, oldValue);
    effects[1]!(newValue, oldValue);
    effects[2]!(newValue, oldValue);
  } else {
    for (let i = 0; i < len; i++) {
      effects[i]!(newValue, oldValue);
    }
  }
}

/**
 * Flush all pending notifications.
 * BUG FIX 1.3: Handle notifications added during flush.
 */
function flushPendingNotifications(): void {
  const pending = pendingNotifications;
  while (pending.length > 0) {
    const len = pending.length;
    for (let i = 0; i < len; i++) {
      const entry = pending[i]!;
      const node = entry[0];
      const oldVal = entry[1];

      node._flags &= ~FLAG_PENDING_NOTIFY;
      notifyEffects(node, node._value, oldVal);
    }
    // Only clear processed items; preserve any added during notification
    pending.splice(0, len);
  }
}

// Guard against recursive flush
let isFlushing = false;

/**
 * Flush batched updates - mark computeds dirty and notify effects.
 * BUG FIX 1.3: Handle dirty nodes added during flush.
 * BUG FIX 1.4: Trigger recompute for computed nodes with subscribers.
 */
function flushBatchedUpdates(): void {
  if (isFlushing) return;
  isFlushing = true;

  try {
    while (dirtyNodes.length > 0) {
      // Process all dirty nodes
      const dirtyLen = dirtyNodes.length;
      for (let i = 0; i < dirtyLen; i++) {
        const node = dirtyNodes[i]!;
        node._flags &= ~FLAG_IN_DIRTY_QUEUE;

        // Unified path: propagate to computeds (recompute if needed)
        if ((node._flags & FLAG_IS_COMPUTED) !== 0) {
          (node as ComputedNode<any>)._recomputeIfNeeded();
        } else {
          propagateToComputeds(node);
        }
      }

      // Only clear processed items; preserve any added during flush
      dirtyNodes.splice(0, dirtyLen);

      // Flush pending effect notifications
      flushPendingNotifications();
      // Loop continues if new dirtyNodes were added
    }
  } finally {
    isFlushing = false;
  }
}

/**
 * Manual batch: defer notifications until batch completes.
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && !isFlushing) {
      flushBatchedUpdates();
    }
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

/**
 * Subscribe to signal/computed changes.
 * Returns O(1) unsubscribe function.
 */
export function subscribe<T>(
  node: ZenCore<T> | ComputedCore<T>,
  listener: Listener<T>,
): Unsubscribe {
  const n = node as AnyNode;

  // Add effect listener (O(1))
  const unsubEffect = addEffectListener(n, listener as Listener<any>);

  // Immediate call with current value (triggers lazy eval for computeds)
  listener((node as any).value as T, undefined);

  // BUG FIX 1.4: Clear any queued notifications from initial computation
  // The listener was already called directly above, so we don't need the queued notification
  if ((n._flags & FLAG_PENDING_NOTIFY) !== 0) {
    n._flags &= ~FLAG_PENDING_NOTIFY;
    // Remove this node from pending notifications
    const idx = pendingNotifications.findIndex(entry => entry[0] === n);
    if (idx !== -1) {
      pendingNotifications.splice(idx, 1);
    }
  }

  return (): void => {
    unsubEffect();

    // If computed with no remaining listeners, detach from sources
    const remaining = n._computedListeners.length + n._effectListeners.length;
    if (remaining === 0 && (node._flags & FLAG_IS_COMPUTED) !== 0) {
      (node as ComputedNode<T>)._unsubscribeFromSources();
    }
  };
}

// ============================================================================
// EFFECT
// ============================================================================

type EffectCore = DependencyCollector & {
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
  _onSourceChange?: Listener<unknown>; // Reused closure to avoid allocation
};

/**
 * Execute effect with auto-tracking.
 */
function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // Run previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch {
      // Swallow cleanup errors
    }
    e._cleanup = undefined;
  }

  // Unsubscribe from previous sources
  const unsubs = e._sourceUnsubs;
  if (unsubs) {
    const len = unsubs.length;
    for (let i = 0; i < len; i++) {
      unsubs[i]!();
    }
    e._sourceUnsubs = undefined;
  }

  e._sources.length = 0;

  // Track dependencies with new tracking epoch for O(1) deduplication
  const prevListener = currentListener;
  currentListener = e;
  e._epoch = ++TRACKING_EPOCH;

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch {
    // Swallow effect errors
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources
  const srcs = e._sources;
  const srcLen = srcs.length;

  if (srcLen > 0) {
    e._sourceUnsubs = [];

    // Reuse closure to avoid allocation on every re-run
    const onSourceChange = e._onSourceChange!;

    for (let i = 0; i < srcLen; i++) {
      const unsub = addEffectListener(srcs[i]!, onSourceChange as Listener<any>);
      e._sourceUnsubs.push(unsub);
    }
  }
}

/**
 * Create auto-tracked effect.
 * Runs immediately and re-runs when dependencies change.
 */
export function effect(callback: () => undefined | (() => void)): Unsubscribe {
  const e: EffectCore = {
    _sources: [],
    _callback: callback,
    _cancelled: false,
  };

  // Create closure once to avoid allocation on every re-run
  e._onSourceChange = () => {
    executeEffect(e);
  };

  executeEffect(e);

  return (): void => {
    if (e._cancelled) return;
    e._cancelled = true;

    if (e._cleanup) {
      try {
        e._cleanup();
      } catch {
        // Swallow cleanup errors
      }
    }

    const unsubs = e._sourceUnsubs;
    if (unsubs) {
      const len = unsubs.length;
      for (let i = 0; i < len; i++) {
        unsubs[i]?.();
      }
    }
  };
}
