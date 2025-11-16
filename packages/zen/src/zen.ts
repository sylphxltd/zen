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
 * - Conservative cached flag for downstream effect detection (never decremented)
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// FLAGS
// ============================================================================

const FLAG_STALE = 0b0000001;           // Computed is dirty, needs recompute
const FLAG_PENDING = 0b0000010;         // Currently computing (prevent re-entry)
const FLAG_PENDING_NOTIFY = 0b0000100;  // Queued for notification
const FLAG_IN_DIRTY_QUEUE = 0b0001000;  // In dirty nodes queue
const FLAG_IS_COMPUTED = 0b0010000;     // Node is a ComputedNode (avoid instanceof)
const FLAG_HAD_EFFECT_DOWNSTREAM = 0b0100000; // Had effect listeners downstream (conservative cache)
const FLAG_IN_COMPUTED_QUEUE = 0b1000000; // In dirty computeds queue (batch dedup)

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
 * Optimization 2.3: Inline small-N effect listeners (1-2) for memory efficiency.
 */
abstract class BaseNode<V> {
  _value: V;
  _computedListeners: AnyNode[] = [];
  _flags = 0;
  _lastSeenEpoch = 0; // Epoch-based deduplication: O(1) tracking check

  // Inline effect listeners (optimization 2.3)
  _effectListener1?: Listener<any>;
  _effectListener2?: Listener<any>;
  _effectListeners?: Listener<any>[]; // Only allocated when >= 3 listeners

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

// Global effect count: tracks active effects/subscribers
// Optimization: skip DFS when count is 0 (pure pull-style computed)
// Decrements on unsubscribe for accurate tracking
let GLOBAL_EFFECT_COUNT = 0;

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
 * Propagate FLAG_HAD_EFFECT_DOWNSTREAM upward through the dependency graph.
 * Optimization 2.1: Iterative approach using stack to avoid DFS during updates.
 * Called during effect subscription to eagerly mark all upstream nodes.
 */
function markHasEffectUpstream(node: AnyNode): void {
  const stack: AnyNode[] = [node];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if ((n._flags & FLAG_HAD_EFFECT_DOWNSTREAM) !== 0) continue;
    n._flags |= FLAG_HAD_EFFECT_DOWNSTREAM;

    // Propagate through computed's sources
    if ((n._flags & FLAG_IS_COMPUTED) !== 0) {
      const c = n as ComputedNode<any>;
      for (let i = 0; i < c._sources.length; i++) {
        stack.push(c._sources[i]!);
      }
    }
  }
}

/**
 * Add effect listener.
 * Subscribe: O(1)
 * Unsubscribe: O(1) for inline, O(n) for array
 * Optimization 2.1: Propagates FLAG_HAD_EFFECT_DOWNSTREAM upward on subscription.
 * Optimization 2.3: Inline storage for 1-2 listeners, array for 3+.
 * BUG FIX: When transitioning to array mode, clear inline slots to prevent double-call.
 */
function addEffectListener(node: AnyNode, cb: Listener<any>): Unsubscribe {
  // Already in array mode - just push
  if (node._effectListeners !== undefined) {
    node._effectListeners.push(cb);
  } else if (node._effectListener1 === undefined) {
    // First listener - use inline slot 1
    node._effectListener1 = cb;
  } else if (node._effectListener2 === undefined) {
    // Second listener - use inline slot 2
    node._effectListener2 = cb;
  } else {
    // Third listener - transition to array mode
    // Move inline listeners to array and clear inline slots
    node._effectListeners = [node._effectListener1, node._effectListener2, cb];
    node._effectListener1 = undefined;
    node._effectListener2 = undefined;
  }

  // Mark that effects exist + increment global count
  node._flags |= FLAG_HAD_EFFECT_DOWNSTREAM;
  GLOBAL_EFFECT_COUNT++;

  // Propagate flag upstream through dependency graph
  markHasEffectUpstream(node);

  return (): void => {
    // Handle array storage first (3+ listeners)
    if (node._effectListeners !== undefined) {
      const list = node._effectListeners;
      const idx = list.indexOf(cb);
      if (idx >= 0) {
        list.splice(idx, 1);
        GLOBAL_EFFECT_COUNT--;
      }
      return;
    }

    // Handle inline storage (1-2 listeners)
    if (node._effectListener1 === cb) {
      node._effectListener1 = node._effectListener2;
      node._effectListener2 = undefined;
      GLOBAL_EFFECT_COUNT--;
      return;
    }
    if (node._effectListener2 === cb) {
      node._effectListener2 = undefined;
      GLOBAL_EFFECT_COUNT--;
    }
  };
}

/**
 * Add computed listener.
 * Subscribe: O(1) push
 * Unsubscribe: O(n) indexOf + splice
 * Optimization 2.1: Propagate FLAG_HAD_EFFECT_DOWNSTREAM upward during subscription.
 */
function addComputedListener(source: AnyNode, node: AnyNode): Unsubscribe {
  source._computedListeners.push(node);

  // Propagate effect flag upward if child has effects
  if ((node._flags & FLAG_HAD_EFFECT_DOWNSTREAM) !== 0) {
    markHasEffectUpstream(source);
  }

  return (): void => {
    const list = source._computedListeners;
    const idx = list.indexOf(node);
    if (idx >= 0) {
      list.splice(idx, 1);
    }
  };
}

// ============================================================================
// DIRTY QUEUES
// ============================================================================

const dirtyNodes: AnyNode[] = [];
let dirtyNodesHead = 0;

const dirtyComputeds: ComputedNode<any>[] = [];
let dirtyComputedsHead = 0;

/**
 * Mark signal as dirty (deduped via FLAG_IN_DIRTY_QUEUE).
 */
function markNodeDirty(node: AnyNode): void {
  if ((node._flags & FLAG_IN_DIRTY_QUEUE) === 0) {
    node._flags |= FLAG_IN_DIRTY_QUEUE;
    dirtyNodes.push(node);
  }
}

/**
 * Mark computed as dirty and queue for recompute if has downstream effects.
 * Deduped via FLAG_IN_COMPUTED_QUEUE to avoid duplicate recomputes in same batch.
 */
function markComputedDirty(c: AnyNode): void {
  // Always mark stale
  if ((c._flags & FLAG_STALE) === 0) {
    c._flags |= FLAG_STALE;
  }

  // Queue for recompute only if has downstream effects and not already queued
  if ((c._flags & FLAG_IN_COMPUTED_QUEUE) === 0 && hasDownstreamEffectListeners(c)) {
    c._flags |= FLAG_IN_COMPUTED_QUEUE;
    dirtyComputeds.push(c as ComputedNode<any>);
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

      // Notify effects immediately (using shared micro-optimized function)
      notifyEffects(this as AnyNode, next, prev);

      // Flush any queued computed notifications
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
   * Protected to allow safe access from batching system.
   */
  protected _recomputeIfNeeded(): void {
    // Simple dirty flag check (faster than version checking)
    if ((this._flags & FLAG_STALE) === 0) return;

    // Prevent re-entry during computation (detect cyclic dependencies)
    if ((this._flags & FLAG_PENDING) !== 0) {
      throw new Error('[Zen] Cyclic dependency detected in computed');
    }

    const hadSubscriptions = this._sourceUnsubs !== undefined;
    const prevListener = currentListener;

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

      // Always rewire subscriptions (simpler, fewer edge cases than diff)
      if (hadSubscriptions) {
        this._unsubscribeFromSources();
        if (this._sources.length > 0) {
          this._subscribeToSources();
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
 * Conservative cache: FLAG_HAD_EFFECT_DOWNSTREAM is eagerly set during subscription.
 * Optimization 2.1: No DFS - flag is propagated upward during effect subscription.
 * Trade-off: Flag never clears, may over-trigger after unsubscribe, but eliminates hot-path DFS.
 */
function hasDownstreamEffectListeners(node: AnyNode): boolean {
  return (node._flags & FLAG_HAD_EFFECT_DOWNSTREAM) !== 0;
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
 * Optimization: if no effects exist globally, skip DFS and eager recompute.
 */
function propagateToComputeds(node: AnyNode): void {
  const computed = node._computedListeners;
  const len = computed.length;

  // Global shortcut: no effects exist, just mark stale (lazy evaluation only)
  if (GLOBAL_EFFECT_COUNT === 0) {
    for (let i = 0; i < len; i++) {
      computed[i]!._flags |= FLAG_STALE;
    }
    return;
  }

  // Effects exist: mark dirty with dedup queue (for batch) or recompute (for direct)
  for (let i = 0; i < len; i++) {
    const c = computed[i]!;

    if (batchDepth > 0 || isFlushing) {
      // Batched path: use dedup queue
      markComputedDirty(c);
    } else {
      // Direct path: mark stale and recompute if has effects
      c._flags |= FLAG_STALE;
      if (hasDownstreamEffectListeners(c)) {
        (c as ComputedNode<any>)._recomputeIfNeeded();
        recomputeDownstreamWithListeners(c);
      }
    }
  }
}

let batchDepth = 0;

type PendingNotification = [AnyNode, unknown];
const pendingNotifications: PendingNotification[] = [];
let pendingNotificationsHead = 0;

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
 * Optimization 2.3: Handle inline listeners + array storage.
 * BUG FIX: Check array mode first to prevent double-call.
 */
function notifyEffects(node: AnyNode, newValue: unknown, oldValue: unknown): void {
  // Array mode (3+ listeners) - inline slots are undefined
  const arr = node._effectListeners;
  if (arr !== undefined) {
    for (let i = 0; i < arr.length; i++) {
      arr[i]!(newValue, oldValue);
    }
    return;
  }

  // Inline mode (1-2 listeners)
  const l1 = node._effectListener1;
  if (l1 === undefined) return;
  l1(newValue, oldValue);

  const l2 = node._effectListener2;
  if (l2 !== undefined) {
    l2(newValue, oldValue);
  }
}

/**
 * Flush all pending notifications.
 * BUG FIX 1.3: Handle notifications added during flush.
 * Optimization 3.1: Index-based processing (no splice).
 */
function flushPendingNotifications(): void {
  while (pendingNotificationsHead < pendingNotifications.length) {
    const startHead = pendingNotificationsHead;
    const endHead = pendingNotifications.length;

    for (let i = startHead; i < endHead; i++) {
      const entry = pendingNotifications[i]!;
      const node = entry[0];
      const oldVal = entry[1];

      node._flags &= ~FLAG_PENDING_NOTIFY;
      notifyEffects(node, node._value, oldVal);
    }

    pendingNotificationsHead = endHead;
  }

  // Reset queue after full flush
  pendingNotifications.length = 0;
  pendingNotificationsHead = 0;
}

// Guard against recursive flush
let isFlushing = false;

/**
 * Flush batched updates with two-phase approach:
 * Phase 1: Propagate dirty signals to computeds (dedup via queue)
 * Phase 2: Recompute dirty computeds once (avoid duplicate recomputes)
 * Phase 3: Notify all effect listeners
 *
 * Outer loop: Continue until all queues empty (handles updates during effect execution)
 * BUG FIX 1.5: Effects that modify signals during flush now propagate correctly
 * OPTIMIZATION: Dedup computeds to avoid recomputing same node multiple times.
 */
function flushBatchedUpdates(): void {
  if (isFlushing) return;
  isFlushing = true;

  try {
    // Outer loop: Continue until all queues are empty
    // This handles effects that modify signals during notification
    // Optimization 2.2: Index-based queue processing (no splice)
    while (dirtyNodesHead < dirtyNodes.length || dirtyComputedsHead < dirtyComputeds.length || pendingNotifications.length > 0) {
      // Phase 1: Mark all downstream computeds as dirty (via dedup queue)
      while (dirtyNodesHead < dirtyNodes.length) {
        const startHead = dirtyNodesHead;
        const endHead = dirtyNodes.length;

        for (let i = startHead; i < endHead; i++) {
          const node = dirtyNodes[i]!;
          node._flags &= ~FLAG_IN_DIRTY_QUEUE;

          // Propagate to downstream computeds (adds to dirtyComputeds queue)
          propagateToComputeds(node);
        }

        dirtyNodesHead = endHead;
      }

      // Phase 2: Recompute dirty computeds (each computed only once, even if multiple sources changed)
      while (dirtyComputedsHead < dirtyComputeds.length) {
        const startHead = dirtyComputedsHead;
        const endHead = dirtyComputeds.length;

        for (let i = startHead; i < endHead; i++) {
          const c = dirtyComputeds[i]!;
          c._flags &= ~FLAG_IN_COMPUTED_QUEUE;

          c._recomputeIfNeeded();
          recomputeDownstreamWithListeners(c);
        }

        dirtyComputedsHead = endHead;
      }

      // Phase 3: Notify all effect listeners
      flushPendingNotifications();
      // Outer loop checks if effect notifications added new dirty nodes/computeds
    }

    // Reset queues after full flush
    dirtyNodes.length = 0;
    dirtyNodesHead = 0;
    dirtyComputeds.length = 0;
    dirtyComputedsHead = 0;
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

  // Record pending notifications length before immediate call
  const startLen = pendingNotifications.length;

  // Immediate call with current value (triggers lazy eval for computeds)
  listener((node as any).value as T, undefined);

  // Only remove notifications added during subscribe (don't steal existing batched notifications)
  // Clear all new entries for this node (handles edge cases where listener triggers multiple batches)
  for (let i = pendingNotifications.length - 1; i >= startLen; i--) {
    const entry = pendingNotifications[i]!;
    if (entry[0] === n) {
      pendingNotifications.splice(i, 1);
    }
  }
  // Clear flag only if no pending notifications remain for this node
  if (startLen === 0 || !pendingNotifications.some(entry => entry[0] === n)) {
    n._flags &= ~FLAG_PENDING_NOTIFY;
  }

  return (): void => {
    unsubEffect();

    // If computed with no remaining listeners, detach from sources
    const remaining = n._computedListeners.length +
      (n._effectListener1 !== undefined ? 1 : 0) +
      (n._effectListener2 !== undefined ? 1 : 0) +
      (n._effectListeners?.length ?? 0);
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
  // Define all properties upfront for V8 optimization (stable hidden class)
  const e: EffectCore = {
    _sources: [],
    _epoch: 0,
    _sourceUnsubs: undefined,
    _cleanup: undefined,
    _callback: callback,
    _cancelled: false,
    _onSourceChange: undefined as any,
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
// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Run a function without tracking dependencies.
 * Useful for reading values inside effects without creating dependencies.
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
 * Read a signal/computed value without tracking it as a dependency.
 * Faster than untrack(() => signal.value) for single reads.
 */
export function peek<T>(node: ZenCore<T> | ComputedCore<T>): T {
  const anyNode = node as AnyNode;

  // Signal fast path: direct _value read (no tracking context manipulation needed)
  if ((anyNode._flags & FLAG_IS_COMPUTED) === 0) {
    return (anyNode as unknown as ZenNode<T>)._value;
  }

  // Computed: temporarily disable tracking + lazy recompute
  const prev = currentListener;
  currentListener = null;
  try {
    return node.value;
  } finally {
    currentListener = prev;
  }
}
