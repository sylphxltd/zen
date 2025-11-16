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

const FLAG_STALE = 0b000000001;           // Computed is dirty, needs recompute
const FLAG_PENDING = 0b000000010;         // Currently computing (prevent re-entry)
const FLAG_PENDING_NOTIFY = 0b000000100;  // Queued for notification
const FLAG_IN_DIRTY_QUEUE = 0b000001000;  // In dirty nodes queue
const FLAG_IS_COMPUTED = 0b000010000;     // Node is a ComputedNode (avoid instanceof)
const FLAG_HAD_EFFECT_DOWNSTREAM = 0b000100000; // Had effect listeners downstream (conservative cache)
const FLAG_IN_COMPUTED_QUEUE = 0b001000000; // In dirty computeds queue (batch dedup)
const FLAG_IN_EFFECT_QUEUE = 0b010000000; // In dirty effects queue (scheduler dedup)
const FLAG_IS_EFFECT = 0b100000000; // Node is an EffectNode (avoid instanceof)

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
 * Optimization 3.2: Slot-based graph for O(1) unsubscribe (Solid-style).
 */
abstract class BaseNode<V> {
  _value: V;
  _computedListeners: AnyNode[] = [];
  _computedListenerSlots: number[] = []; // Parallel array: observer's slot in their _sources
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
 * Optimization 3.2: Added _sourceSlots for slot-based graph.
 */
interface DependencyCollector {
  _sources: AnyNode[];
  _sourceSlots: number[]; // Parallel array: this observer's slot in source's _computedListeners
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
 * Track source dependency for current listener (unified for Computed + Effect).
 * Uses epoch-based deduplication to prevent duplicate subscriptions.
 * BUG FIX: Effect nodes now use epoch dedup instead of last-source check,
 * preventing duplicate subscriptions when reading same source non-consecutively.
 *
 * Optimization: Direct epoch check (no fallback) for better V8 inlining.
 * All Computation/Effect collectors set _epoch before tracking.
 */
function trackSource(source: AnyNode): void {
  if (!currentListener) return;

  const epoch = currentListener._epoch;
  // Direct epoch-based dedup (single code path for V8 optimization)
  if (source._lastSeenEpoch !== epoch) {
    source._lastSeenEpoch = epoch;
    currentListener._sources.push(source);
  }
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
 * Add computed listener with slot tracking.
 * Subscribe: O(1) push + slot recording
 * Unsubscribe: O(1) swap-and-pop using slots
 * Optimization 2.1: Propagate FLAG_HAD_EFFECT_DOWNSTREAM upward during subscription.
 * Optimization 3.2: Slot-based O(1) unsubscribe (Solid-style).
 */
/**
 * Add computed listener with slot-based tracking (Solid-style).
 * BUG FIX: Use observer._sourceSlots as source of truth, not captured sourceSlot.
 */
function addComputedListener(
  source: AnyNode,
  observer: AnyNode & DependencyCollector,
  observerSourceIndex: number
): Unsubscribe {
  const sourceSlot = source._computedListeners.length;
  source._computedListeners.push(observer);
  source._computedListenerSlots.push(observerSourceIndex);

  // Write back to observer side (source of truth)
  observer._sourceSlots[observerSourceIndex] = sourceSlot;

  // Propagate effect flag upward if child is effect or has effects downstream
  if ((observer._flags & (FLAG_HAD_EFFECT_DOWNSTREAM | FLAG_IS_EFFECT)) !== 0) {
    markHasEffectUpstream(source);
  }

  return (): void => {
    const listeners = source._computedListeners;
    const slots = source._computedListenerSlots;
    const lastIdx = listeners.length - 1;

    // Read "current" index from observer, not captured sourceSlot
    const idx = observer._sourceSlots[observerSourceIndex];
    if (idx < 0 || idx > lastIdx) {
      // Already removed or double unsubscribe
      return;
    }

    if (idx < lastIdx) {
      // Swap with last element
      const lastObserver = listeners[lastIdx]! as AnyNode & DependencyCollector;
      const lastObserverSourceIdx = slots[lastIdx]!;

      listeners[idx] = lastObserver;
      slots[idx] = lastObserverSourceIdx;

      // Update the moved observer's slot reference
      lastObserver._sourceSlots[lastObserverSourceIdx] = idx;
    }

    // Pop last element
    listeners.pop();
    slots.pop();

    // Mark this source as removed from observer
    observer._sourceSlots[observerSourceIndex] = -1;
  };
}

// ============================================================================
// DIRTY QUEUES
// ============================================================================

const dirtyNodes: AnyNode[] = [];
let dirtyNodesHead = 0;

const dirtyComputeds: ComputedNode<any>[] = [];
let dirtyComputedsHead = 0;

const dirtyEffects: EffectNode[] = [];
let dirtyEffectsHead = 0;

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

/**
 * SCHEDULER REWRITE: Mark effect as dirty and queue for execution.
 * Deduped via FLAG_IN_EFFECT_QUEUE to ensure each effect runs once per flush.
 */
function markEffectDirty(e: EffectNode): void {
  if ((e._flags & FLAG_IN_EFFECT_QUEUE) === 0) {
    e._flags |= FLAG_IN_EFFECT_QUEUE;
    dirtyEffects.push(e);
  }
}

// ============================================================================
// SIGNAL
// ============================================================================

class ZenNode<T> extends BaseNode<T> {
  get value(): T {
    // Runtime dependency tracking (unified epoch-based dedup)
    trackSource(this as AnyNode);
    return this._value;
  }

  set value(next: T) {
    const prev = this._value;

    // Fast equality check (NaN + +0/-0 aware)
    if (valuesEqual(next, prev)) return;

    this._value = next;

    // SCHEDULER REWRITE: Unified queue-based path (Solid-style)
    // All updates go through queue to ensure each computation runs once per flush
    markNodeDirty(this as AnyNode);
    queueBatchedNotification(this as AnyNode, prev);

    // Auto-flush when not in explicit batch
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
// COMPUTATION BASE (Unified Computed + Effect)
// ============================================================================

/**
 * Computation: Unified base for both Computed and Effect (Solid-style).
 * Optimization 3.3: Same data layout for V8 hidden class optimization.
 *
 * A Computation is a reactive node that:
 * - Has a function (_fn) that computes a value based on dependencies
 * - Tracks its sources (_sources) for auto-tracking
 * - Can be invalidated and re-executed
 *
 * The only difference between Computed and Effect:
 * - Computed: caches value, lazy (pull-based)
 * - Effect: no cache, eager (push-based)
 */
abstract class Computation<T> extends BaseNode<T | null> implements DependencyCollector {
  _fn: () => T;
  _sources: AnyNode[];
  _sourceSlots: number[]; // Optimization 3.2: Slot tracking for O(1) unsubscribe
  _sourceUnsubs?: Unsubscribe[];
  _epoch = 0; // DependencyCollector interface requirement
  _cleanup?: () => void; // Effect cleanup function
  _cancelled = false; // Effect cancellation flag

  constructor(fn: () => T, initialValue: T | null) {
    super(initialValue);
    this._fn = fn;
    this._sources = [];
    this._sourceSlots = [];
  }

  /**
   * Unified execution logic (Solid-style).
   * Subclasses override for specific behavior (lazy vs eager).
   */
  abstract _execute(): void;
}

// ============================================================================
// COMPUTED
// ============================================================================

class ComputedNode<T> extends Computation<T> {
  constructor(calc: () => T) {
    super(calc, null as T | null);
    this._flags = FLAG_STALE | FLAG_IS_COMPUTED; // Start dirty + mark as computed
  }

  /**
   * Unified execution method (Solid-style).
   * For Computed: lazy pull-based with caching.
   */
  _execute(): void {
    this._recomputeIfNeeded();
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

    this._flags |= FLAG_PENDING;
    this._flags &= ~FLAG_STALE;

    const oldValue = this._value;

    // Full unsubscribe (safe approach - ensures correctness)
    if (hadSubscriptions) {
      this._unsubscribeFromSources();
    }
    this._sources.length = 0;
    this._sourceSlots.length = 0;

    // Track new dependencies
    currentListener = this as unknown as DependencyCollector;
    this._epoch = ++TRACKING_EPOCH;
    const newValue = this._fn();
    currentListener = prevListener;
    this._value = newValue;

    // Subscribe to new sources
    if (this._sources.length > 0) {
      this._subscribeToSources();
    }

    this._flags &= ~FLAG_PENDING;

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
  }

  get value(): T {
    // Lazy evaluation
    this._recomputeIfNeeded();

    // Allow tracking by parent computeds/effects (unified epoch-based dedup)
    trackSource(this as AnyNode);

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
      const unsub = addComputedListener(srcs[i]!, this as unknown as AnyNode & DependencyCollector, i);
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
    this._sourceSlots.length = 0;
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
 * SCHEDULER REWRITE: Queue-only propagation (Solid-style).
 * Marks downstream computeds dirty and queues them for recompute if they have effects.
 * Also queues EffectNodes directly.
 * No direct recompute - everything goes through the scheduler queue.
 * This ensures each computation runs at most once per flush (fixes diamond graph duplication).
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

  // SCHEDULER REWRITE: Unified queue-only path
  // Mark dirty and queue - ComputedNodes for recompute, EffectNodes for execution
  for (let i = 0; i < len; i++) {
    const c = computed[i]!;
    if ((c._flags & FLAG_IS_EFFECT) !== 0) {
      // EffectNode - queue for execution
      markEffectDirty(c as unknown as EffectNode);
    } else if ((c._flags & FLAG_IS_COMPUTED) !== 0) {
      // ComputedNode - queue for recompute
      markComputedDirty(c);
    } else {
      // Plain signal listener (shouldn't happen in _computedListeners)
      c._flags |= FLAG_STALE;
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
 * OPTIMIZATION: Skip queueing if no legacy effect listeners exist.
 * With effect-based subscribe, legacy listeners are rarely used.
 */
function queueBatchedNotification(node: AnyNode, oldValue: unknown): void {
  // Fast path: no legacy listeners, skip queue entirely
  if (
    node._effectListener1 === undefined &&
    node._effectListener2 === undefined &&
    (node._effectListeners === undefined || node._effectListeners.length === 0)
  ) {
    return;
  }

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
 * SCHEDULER REWRITE: Flush batched updates with unified queue approach (Solid-style).
 * Phase 1: Propagate dirty signals to computeds/effects (dedup via queue)
 * Phase 2: Recompute dirty computeds once (avoid duplicate recomputes)
 * Phase 3: Execute dirty effects once (avoid duplicate executions)
 * Phase 4: Notify legacy effect listeners (subscribe API)
 *
 * Outer loop: Continue until all queues empty (handles updates during effect execution)
 * OPTIMIZATION: Each computation/effect runs at most once per flush (fixes diamond graph).
 */
function flushBatchedUpdates(): void {
  if (isFlushing) return;
  isFlushing = true;

  try {
    // Outer loop: Continue until all queues are empty
    // This handles effects that modify signals during notification
    // Optimization 2.2: Index-based queue processing (no splice)
    while (
      dirtyNodesHead < dirtyNodes.length ||
      dirtyComputedsHead < dirtyComputeds.length ||
      dirtyEffectsHead < dirtyEffects.length ||
      pendingNotifications.length > 0
    ) {
      // Phase 1: Mark all downstream computeds/effects as dirty (via dedup queue)
      while (dirtyNodesHead < dirtyNodes.length) {
        const startHead = dirtyNodesHead;
        const endHead = dirtyNodes.length;

        for (let i = startHead; i < endHead; i++) {
          const node = dirtyNodes[i]!;
          node._flags &= ~FLAG_IN_DIRTY_QUEUE;

          // Propagate to downstream computeds/effects (adds to queues)
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
          // Propagate downstream (adds to queues)
          propagateToComputeds(c);
        }

        dirtyComputedsHead = endHead;
      }

      // Phase 3: Execute dirty effects (each effect only once, even if multiple sources changed)
      // IMPORTANT: Clear flags before executing to prevent re-queuing in case of error
      while (dirtyEffectsHead < dirtyEffects.length) {
        const startHead = dirtyEffectsHead;
        const endHead = dirtyEffects.length;

        // Clear all flags first (ensures queue state is consistent even if effects throw)
        for (let i = startHead; i < endHead; i++) {
          dirtyEffects[i]!._flags &= ~FLAG_IN_EFFECT_QUEUE;
        }

        // Execute effects (errors propagate to app for V8 optimization)
        for (let i = startHead; i < endHead; i++) {
          const e = dirtyEffects[i]!;
          if (!e._cancelled) {
            e._execute();
          }
          // Effects can propagate if they read signals during execution
        }

        dirtyEffectsHead = endHead;
      }

      // Phase 4: Notify legacy effect listeners (subscribe API)
      flushPendingNotifications();
      // Outer loop checks if effect notifications added new dirty nodes/computeds/effects
    }
  } finally {
    // CRITICAL: Clear flags from all queued nodes to prevent stuck state on errors
    // If an effect/computed throws, nodes may remain in queues with flags set
    // Clearing flags ensures next update can properly schedule them again
    for (let i = 0; i < dirtyNodes.length; i++) {
      dirtyNodes[i]!._flags &= ~FLAG_IN_DIRTY_QUEUE;
    }
    for (let i = 0; i < dirtyComputeds.length; i++) {
      dirtyComputeds[i]!._flags &= ~FLAG_IN_COMPUTED_QUEUE;
    }
    for (let i = 0; i < dirtyEffects.length; i++) {
      dirtyEffects[i]!._flags &= ~FLAG_IN_EFFECT_QUEUE;
    }
    // Clear pending notification flags (legacy listeners)
    for (let i = 0; i < pendingNotifications.length; i++) {
      pendingNotifications[i]![0]._flags &= ~FLAG_PENDING_NOTIFY;
    }

    // Reset queues and state
    pendingNotifications.length = 0;
    pendingNotificationsHead = 0;
    dirtyNodes.length = 0;
    dirtyNodesHead = 0;
    dirtyComputeds.length = 0;
    dirtyComputedsHead = 0;
    dirtyEffects.length = 0;
    dirtyEffectsHead = 0;
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
 * BREAKING CHANGE: Subscribe now uses unified scheduler (Solid-style).
 * - Listener runs at most once per flush (automatic dedup)
 * - Initial call happens on first update (not immediately)
 * - Simpler implementation using effect
 */
export function subscribe<T>(
  node: ZenCore<T> | ComputedCore<T>,
  listener: Listener<T>,
): Unsubscribe {
  let hasValue = false;
  let previousValue!: T;

  return effect(() => {
    const currentValue = node.value;

    // First run: just store value, no listener call
    // Use hasValue flag instead of undefined check to handle undefined initial values
    if (!hasValue) {
      hasValue = true;
      previousValue = currentValue;
      return;
    }

    // Subsequent runs: call listener with old and new values
    listener(currentValue, previousValue);
    previousValue = currentValue;
  });
}

// ============================================================================
// EFFECT
// ============================================================================

/**
 * EffectNode: extends Computation for unified shape.
 * Optimization 3.3: Same data structure as ComputedNode for V8 optimization.
 * SCHEDULER REWRITE: Effects are scheduled through queue like computeds.
 */
class EffectNode extends Computation<void | (() => void)> {
  constructor(callback: () => undefined | (() => void)) {
    super(callback, null);
    this._flags = FLAG_IS_EFFECT; // Mark as effect for scheduler
  }

  /**
   * SCHEDULER REWRITE: Unified execution method (Solid-style).
   * For Effect: scheduled through queue like computeds.
   * Called by scheduler, not directly on source changes.
   */
  _execute(): void {
    if (this._cancelled) return;

    // Run previous cleanup (direct call - errors propagate to app)
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = undefined;
    }

    // Unsubscribe from previous sources
    const unsubs = this._sourceUnsubs;
    if (unsubs) {
      const len = unsubs.length;
      for (let i = 0; i < len; i++) {
        unsubs[i]!();
      }
      this._sourceUnsubs = undefined;
    }

    this._sources.length = 0;
    this._sourceSlots.length = 0;

    // Track dependencies with new tracking epoch for O(1) deduplication
    const prevListener = currentListener;
    currentListener = this;
    this._epoch = ++TRACKING_EPOCH;

    // Direct call (no try/catch for V8 optimization - errors propagate to app)
    const cleanup = this._fn();
    currentListener = prevListener;

    if (cleanup) this._cleanup = cleanup;

    // Subscribe to tracked sources
    const srcs = this._sources;
    const srcLen = srcs.length;

    if (srcLen > 0) {
      this._sourceUnsubs = [];

      for (let i = 0; i < srcLen; i++) {
        // SCHEDULER REWRITE: Subscribe using computed listener (slot-based)
        // When source changes, mark this effect dirty (scheduler queues it)
        const unsub = addComputedListener(srcs[i]!, this as unknown as AnyNode & DependencyCollector, i);

        // Increment GLOBAL_EFFECT_COUNT for each subscription
        GLOBAL_EFFECT_COUNT++;

        // Wrap unsub to decrement count on unsubscribe
        const wrappedUnsub = (): void => {
          unsub();
          GLOBAL_EFFECT_COUNT--;
        };

        this._sourceUnsubs.push(wrappedUnsub);
      }
    }
  }
}

/**
 * Execute effect with auto-tracking.
 * Optimization 3.3: Unified execution via Computation._execute().
 */
function executeEffect(e: EffectNode): void {
  e._execute();
}

/**
 * Create auto-tracked effect.
 * Runs immediately and re-runs when dependencies change.
 */
export function effect(callback: () => undefined | (() => void)): Unsubscribe {
  const e = new EffectNode(callback);

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
        unsubs[i]?.(); // Wrapped unsub already decrements GLOBAL_EFFECT_COUNT
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
