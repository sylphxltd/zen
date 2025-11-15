/**
 * Zen - Ultra-Performance Reactivity
 * Auto-tracking signals, computed, and effects
 */

export type Listener<T> = (value: T, oldValue?: T) => void;
export type Unsubscribe = () => void;

type ZenCore<T> = {
  _kind: 'zen';
  _value: T;
  _listeners?: Listener<T>[];
  _queued?: boolean; // Transient flag for deduplication
  _owner: AnyNode | null;
  _updatedAt?: number;
};

// State flags for computed values (inspired by SolidJS)
const CLEAN = 0; // Value is up to date
const STALE = 1; // Value needs recalculation
const PENDING = 2; // Currently being recalculated (prevents cycles)

type ComputedCore<T> = {
  _kind: 'computed';
  _value: T | null;
  _state: 0 | 1 | 2; // CLEAN, STALE, or PENDING
  _calc: () => T;
  _listeners?: Listener<T>[];
  _sources?: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];
  _queued?: boolean; // Transient flag for deduplication
  _owner: AnyNode | null;
  _updatedAt?: number;
};

export type AnyZen = ZenCore<any> | ComputedCore<any>;

// Global tracking
let currentListener: ComputedCore<any> | null = null;
let currentOwner: AnyNode | null = null;

// Global execution counter for deduplication
let ExecCount = 0;

// Base node type with owner hierarchy
type BaseNode = {
  _owner: AnyNode | null;
  _updatedAt?: number;
};

type AnyNode = (ZenCore<any> | ComputedCore<any> | EffectCore) & BaseNode;

// Batching
let batchDepth = 0;
const pendingNotifications: [AnyZen, any][] = [];
const pendingEffects = new Set<EffectCore>();

// Helper to compare arrays for equality
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Helper to propagate STALE state to downstream computeds (iterative to avoid recursion overhead)
function markDownstreamStale(computed: ComputedCore<any>): void {
  const queue: ComputedCore<any>[] = [computed];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    const listeners = current._listeners;
    if (!listeners) continue;

    // Check if this computed has non-computed listeners (leaf computed)
    let hasNonComputedListeners = false;
    for (let j = 0; j < listeners.length; j++) {
      const listener = listeners[j]!;
      const downstreamComputed = (listener as any)._computedZen;
      if (downstreamComputed) {
        if (downstreamComputed._state === CLEAN) {
          downstreamComputed._state = STALE;
          // Add to queue for processing
          queue.push(downstreamComputed);
        }
      } else {
        hasNonComputedListeners = true;
      }
    }

    // Only queue if this is a leaf computed (has non-computed listeners), in batch, and not already queued
    if (hasNonComputedListeners && batchDepth > 0 && !current._queued) {
      current._queued = true;
      pendingNotifications.push([current, current._value]);
    }
  }
}

// runTop algorithm: Execute node and all dirty ancestors from root to leaf
function runTop(node: AnyNode): void {
  // Skip if already clean or pending
  if ((node as any)._state === CLEAN) return;
  if ((node as any)._state === PENDING) return;

  const ancestors: AnyNode[] = [node];
  let current = node._owner;

  // Collect dirty ancestors walking up the owner chain
  while (current && (!current._updatedAt || current._updatedAt < ExecCount)) {
    if ((current as any)._state && (current as any)._state !== CLEAN) {
      ancestors.push(current);
    }
    current = current._owner;
  }

  // Execute from root to leaf (reverse order)
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const n = ancestors[i]!;

    // Only update if still dirty and not updated this cycle
    if ((n as any)._state === STALE && (!n._updatedAt || n._updatedAt < ExecCount)) {
      if ((n as any)._kind === 'computed') {
        updateComputed(n as any);
      }
    }
  }
}

// Helper to update a computed node (doesn't notify listeners - caller handles that)
function updateComputed(c: ComputedCore<any>): void {
  if (c._state === CLEAN) return;
  if (c._updatedAt === ExecCount) return; // Already updated this cycle

  const prevListener = currentListener;
  const prevOwner = currentOwner;
  currentListener = c;
  currentOwner = c as any;

  if (c._sources) {
    c._sources.length = 0;
  }

  c._state = PENDING;
  const newValue = c._calc();
  c._value = newValue;
  c._state = CLEAN;
  c._updatedAt = ExecCount;

  currentListener = prevListener;
  currentOwner = prevOwner;
}

// Shared flush function using runTop algorithm
function flushBatch(): void {
  ExecCount++; // Increment execution counter for this batch

  if (pendingNotifications.length === 0) {
    if (pendingEffects.size > 0) {
      const effects = Array.from(pendingEffects);
      pendingEffects.clear();
      for (let i = 0; i < effects.length; i++) {
        executeEffectImmediate(effects[i]!);
      }
    }
    return;
  }

  const toNotify = pendingNotifications.splice(0);

  // Process all queued items using runTop for correct ordering
  for (let i = 0; i < toNotify.length; i++) {
    const [zenItem, oldVal] = toNotify[i]!;
    zenItem._queued = false; // Clear flag

    // If it's a computed, use runTop to ensure correct ordering
    if (zenItem._kind === 'computed' && zenItem._state !== CLEAN) {
      const computedOldVal = zenItem._value;
      runTop(zenItem as any);

      // Notify listeners only if value changed after runTop
      if (!Object.is(zenItem._value, computedOldVal)) {
        const listeners = zenItem._listeners;
        if (listeners) {
          for (let j = 0; j < listeners.length; j++) {
            listeners[j](zenItem._value, computedOldVal);
          }
        }
      }
    } else {
      // For zen signals, always notify
      const listeners = zenItem._listeners;
      if (listeners) {
        const currentValue = zenItem._value;
        for (let j = 0; j < listeners.length; j++) {
          listeners[j](currentValue, oldVal);
        }
      }
    }
  }

  // Flush pending effects
  if (pendingEffects.size > 0) {
    const effects = Array.from(pendingEffects);
    pendingEffects.clear();
    for (let i = 0; i < effects.length; i++) {
      executeEffectImmediate(effects[i]!);
    }
  }
}

// ============================================================================
// ZEN (Signal)
// ============================================================================

const zenProto = {
  get value(this: ZenCore<any> & { value: any }) {
    if (currentListener && !currentListener._sources) {
      currentListener._sources = [];
    }
    if (currentListener) {
      const sources = currentListener._sources;
      // Only add if not already tracking this source
      if (sources && sources.indexOf(this as ZenCore<any>) === -1) {
        sources.push(this as ZenCore<any>);
      }
    }
    return this._value;
  },
  set value(this: ZenCore<any> & { value: any }, newValue: any) {
    // Fast equality check: === covers most cases, Object.is for edge cases (+0/-0, NaN)
    // Check === first (fast path), then Object.is only if needed
    if (newValue === this._value) {
      // Same value, but need to check for +0/-0 edge case
      if (newValue === 0 && 1/newValue !== 1/this._value) {
        // +0 vs -0, continue to update
      } else {
        return; // Truly equal
      }
    } else if (newValue !== newValue && this._value !== this._value) {
      // Both NaN
      return;
    }

    const oldValue = this._value;
    this._value = newValue;

    const listeners = this._listeners;

    // Fast path: already in batch, just queue and return
    if (batchDepth > 0) {
      // Mark computed dependents as STALE and queue them
      let hasNonComputedListeners = false;
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          const listener = listeners[i];
          const computedZen = (listener as any)._computedZen;
          if (computedZen) {
            if (computedZen._state === CLEAN) {
              computedZen._state = STALE;
              // Propagate STALE to downstream computeds and queue leaf computeds
              markDownstreamStale(computedZen);
            }
          } else {
            hasNonComputedListeners = true;
          }
        }
      }
      // Only queue signal if it has non-computed listeners and not already queued
      if (hasNonComputedListeners && !this._queued) {
        this._queued = true;
        pendingNotifications.push([this as ZenCore<any>, oldValue]);
      }
      return;
    }

    // Not in batch - auto-batch this update
    batchDepth = 1;

    // Mark computed dependents as STALE and queue them
    let hasNonComputedListeners = false;
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        const computedZen = (listener as any)._computedZen;
        if (computedZen) {
          if (computedZen._state === CLEAN) {
            computedZen._state = STALE;
            // Propagate STALE to downstream computeds and queue leaf computeds
            markDownstreamStale(computedZen);
          }
        } else {
          hasNonComputedListeners = true;
        }
      }
    }
    // Queue signal if it has non-computed listeners
    if (hasNonComputedListeners) {
      this._queued = true;
      pendingNotifications.push([this as ZenCore<any>, oldValue]);
    }

    // Flush and clear batch (keep batchDepth > 0 during flush)
    flushBatch();
    batchDepth = 0;
  },
};

export function zen<T>(initialValue: T): ZenCore<T> & { value: T } {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T };
  signal._kind = 'zen';
  signal._value = initialValue;
  signal._listeners = undefined;
  signal._owner = currentOwner;
  signal._updatedAt = undefined;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED (Auto-tracking)
// ============================================================================

type ComputedProto<T> = ComputedCore<T> & {
  value: T;
  _subscribeToSources(): void;
  _unsubscribeFromSources(): void;
  _unsubs: Unsubscribe[] | undefined;
};

const computedProto = {
  // Compatibility getters for tests
  get _unsubs(this: ComputedProto<any>) {
    return this._sourceUnsubs;
  },
  get _dirty(this: ComputedProto<any>) {
    return this._state !== CLEAN;
  },

  get value(this: ComputedProto<any>) {
    // Lazy pull-based evaluation: only recalculate when accessed and STALE
    if (this._state === STALE) {
      // Save old sources to detect changes
      const oldSources = this._sources && this._sourceUnsubs ? [...this._sources] : null;

      const prevListener = currentListener;
      const prevOwner = currentOwner;
      currentListener = this;
      currentOwner = this as any;

      if (this._sources) {
        this._sources.length = 0;
      }

      this._state = PENDING;
      this._value = this._calc();
      this._state = CLEAN;
      this._updatedAt = ExecCount;

      currentListener = prevListener;
      currentOwner = prevOwner;

      // Check if sources changed and re-subscribe if needed
      if (oldSources && this._sources) {
        const sourcesChanged = !arraysEqual(oldSources, this._sources);
        if (sourcesChanged) {
          // Unsubscribe from old sources
          this._unsubscribeFromSources();
          // Subscribe to new sources
          if (this._sources.length > 0) {
            this._subscribeToSources();
          }
        }
      }
    }

    // Subscribe on first access (even without listeners, for lazy evaluation)
    if (!this._sourceUnsubs && this._sources && this._sources.length > 0) {
      this._subscribeToSources();
    }

    if (currentListener && !currentListener._sources) {
      currentListener._sources = [];
    }
    if (currentListener) {
      const sources = currentListener._sources;
      // Only add if not already tracking this source
      if (sources && sources.indexOf(this as ComputedCore<any>) === -1) {
        sources.push(this as ComputedCore<any>);
      }
    }

    return this._value;
  },

  _subscribeToSources(this: ComputedProto<any>) {
    if (!this._sources || this._sources.length === 0) return;
    if (this._sourceUnsubs) return; // Already subscribed

    this._sourceUnsubs = [];
    const onSourceChange = () => {
      if (this._state !== CLEAN) return;
      // LAZY PULL: Just mark STALE, let flush or value getter handle recalculation
      this._state = STALE;
    };
    // Attach reference to computed for zen setter to detect
    (onSourceChange as any)._computedZen = this;

    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i];
      if (!source._listeners) source._listeners = [];
      source._listeners.push(onSourceChange);

      this._sourceUnsubs.push(() => {
        const idx = source._listeners?.indexOf(onSourceChange) ?? -1;
        if (idx !== -1 && source._listeners) {
          const last = source._listeners.length - 1;
          if (idx !== last) source._listeners[idx] = source._listeners[last];
          source._listeners.pop();
        }
      });
    }
  },

  _unsubscribeFromSources(this: ComputedProto<any>) {
    if (!this._sourceUnsubs) return;
    for (let i = 0; i < this._sourceUnsubs.length; i++) {
      this._sourceUnsubs[i]();
    }
    this._sourceUnsubs = undefined;
  },
};

export function computed<T>(calculation: () => T): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  c._kind = 'computed';
  c._value = null;
  c._state = STALE; // Start as STALE to trigger initial calculation
  c._calc = calculation;
  c._listeners = undefined;
  // Initialize as empty array with size property for test compatibility
  const sources: any[] = [];
  Object.defineProperty(sources, 'size', {
    get() {
      return this.length;
    },
    enumerable: false,
  });
  c._sources = sources;
  c._sourceUnsubs = undefined;
  c._owner = currentOwner;
  c._updatedAt = undefined;
  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    if (batchDepth === 1) {
      // Keep batchDepth > 0 during flush to ensure effects are queued
      flushBatch();
    }
    batchDepth--;
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(zenItem: A, listener: Listener<any>): Unsubscribe {
  if (!zenItem._listeners) {
    const listeners: any[] = [];
    // Add delete method for test compatibility
    (listeners as any).delete = function (item: any) {
      const idx = this.indexOf(item);
      if (idx !== -1) {
        const last = this.length - 1;
        if (idx !== last) this[idx] = this[last];
        this.pop();
        return true;
      }
      return false;
    };
    zenItem._listeners = listeners;
  }
  zenItem._listeners.push(listener);

  if (zenItem._kind === 'computed' && zenItem._listeners.length === 1) {
    const _ = (zenItem as ComputedProto<any>).value;
    (zenItem as ComputedProto<any>)._subscribeToSources();
  }

  listener(zenItem._value, undefined);

  return () => {
    const listeners = zenItem._listeners;
    if (!listeners) return;

    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      const last = listeners.length - 1;
      if (idx !== last) {
        listeners[idx] = listeners[last]!;
      }
      listeners.pop();

      if (listeners.length === 0) {
        zenItem._listeners = undefined;

        if (zenItem._kind === 'computed') {
          (zenItem as any)._unsubscribeFromSources();
        }
      }
    }
  };
}

// ============================================================================
// EFFECT (Auto-tracking)
// ============================================================================

type EffectCore = {
  _kind: 'effect';
  _sources?: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
  _owner: AnyNode | null;
  _updatedAt?: number;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // If in batch, queue for later execution to deduplicate
  if (batchDepth > 0) {
    pendingEffects.add(e);
    return;
  }

  executeEffectImmediate(e);
}

function executeEffectImmediate(e: EffectCore): void {
  if (e._cancelled) return;

  // Run previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch (_) {}
    e._cleanup = undefined;
  }

  // Unsubscribe and reset sources for re-tracking
  if (e._sourceUnsubs) {
    for (let i = 0; i < e._sourceUnsubs.length; i++) {
      e._sourceUnsubs[i]!();
    }
    e._sourceUnsubs = undefined;
  }
  if (e._sources) {
    e._sources.length = 0;
  }

  // Set as current listener and owner for auto-tracking
  const prevListener = currentListener;
  const prevOwner = currentOwner;
  currentListener = e as any;
  currentOwner = e as any;

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch (_err) {
  } finally {
    currentListener = prevListener;
    currentOwner = prevOwner;
  }

  // Subscribe to tracked sources
  if (e._sources && e._sources.length > 0) {
    e._sourceUnsubs = [];
    const onSourceChange = () => executeEffect(e);

    for (let i = 0; i < e._sources.length; i++) {
      const source = e._sources[i]!;
      if (!source._listeners) source._listeners = [];
      source._listeners.push(onSourceChange);

      e._sourceUnsubs.push(() => {
        const idx = source._listeners?.indexOf(onSourceChange) ?? -1;
        if (idx !== -1 && source._listeners) {
          const last = source._listeners.length - 1;
          if (idx !== last) source._listeners[idx] = source._listeners[last]!;
          source._listeners.pop();
        }
      });
    }
  }
}

export function effect(callback: () => undefined | (() => void)): Unsubscribe {
  const e: EffectCore = {
    _kind: 'effect',
    _sources: [],
    _callback: callback,
    _cancelled: false,
    _owner: currentOwner,
    _updatedAt: undefined,
  };

  // Run effect immediately
  executeEffect(e);

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
    if (e._sourceUnsubs) {
      for (let i = 0; i < e._sourceUnsubs.length; i++) {
        e._sourceUnsubs[i]!();
      }
    }
  };
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY
// ============================================================================

export const notifyListeners = (zenItem: any, newValue: any, oldValue: any): void => {
  const listeners = zenItem._listeners;
  if (!listeners) return;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
};

export const queueZenForBatch = (zenItem: AnyZen, oldValue: any): void => {
  if (batchDepth > 0) {
    pendingNotifications.push([zenItem, oldValue]);
  }
};

export { batchDepth };
