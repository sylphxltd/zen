/**
 * Zen V7b - Monomorphic + Minimal Fields
 *
 * Low-risk optimizations based on V6 lessons:
 * 1. Remove observerSlots (simplify structure)
 * 2. Monomorphic functions (V8-friendly)
 * 3. Minimal fields in node structures
 * 4. Keep V4's proven timestamp tracking
 * 5. Keep V6's inline dependency tracking
 *
 * Expected gains: +10-20% across the board
 * Risk: Very low - just refactoring
 */

// ============================================================================
// Types - Minimal Fields
// ============================================================================

export type Signal<T> = {
  (): T;
  (value: T): void;
  set: (value: T) => void;
  subscribe: (fn: (value: T) => void) => () => void;
  _node: SNode<T>;
};

export type Computed<T> = {
  (): T | null;
  subscribe: (fn: (value: T | null) => void) => () => void;
  _node: CNode<T>;
};

// ✅ Minimal signal node - removed observerSlots
type SNode<T> = {
  value: T;
  updatedAt: number;
  observers: CNode<any>[] | null;
};

// ✅ Minimal computed node - removed observerSlots
type CNode<T> = {
  value: T | null;
  updatedAt: number | null;
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};

// ============================================================================
// Global State
// ============================================================================

let ExecCount = 0;
let Listener: CNode<any> | null = null;

// ============================================================================
// Signal Implementation
// ============================================================================

export function signal<T>(initialValue: T): Signal<T> {
  const node: SNode<T> = {
    value: initialValue,
    updatedAt: 0,
    observers: null,
  };

  // Getter - INLINE dependency tracking
  function getter(): T {
    // ✅ Monomorphic: Always track signals the same way
    if (Listener) {
      trackSignalDependency(Listener, node);
    }
    return node.value;
  }

  // Setter - Pure lazy (only update timestamp)
  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;
    node.value = newValue;
    ExecCount++;
    node.updatedAt = ExecCount;
  }

  const fn = function(value?: T): T | void {
    if (arguments.length === 0) {
      return getter();
    } else {
      setter(value!);
    }
  } as Signal<T>;

  fn.set = setter;
  fn.subscribe = (callback: (value: T) => void) => {
    const effect = createEffect(() => {
      callback(getter());
    });
    effect();
    return () => {
      if (effect._node.sources) {
        cleanSources(effect._node);
      }
    };
  };
  fn._node = node;

  return fn;
}

// ============================================================================
// Computed Implementation
// ============================================================================

export function computed<T>(
  fn: () => T,
  equals: (a: T, b: T) => boolean = Object.is
): Computed<T> {
  const node: CNode<T> = {
    value: null,
    updatedAt: null,
    fn,
    sources: null,
    observers: null,
    equals,
  };

  // Getter - Pull-based with timestamp checking
  function getter(): T | null {
    // ✅ Check if update needed using timestamps
    if (needsUpdate(node)) {
      update(node);
    }

    // ✅ Monomorphic: Always track computed the same way
    if (Listener) {
      trackComputedDependency(Listener, node);
    }

    return node.value;
  }

  const fn2 = getter as Computed<T>;
  fn2.subscribe = (callback: (value: T | null) => void) => {
    const effect = createEffect(() => {
      callback(getter());
    });
    effect();
    return () => {
      if (effect._node.sources) {
        cleanSources(effect._node);
      }
    };
  };
  fn2._node = node;

  return fn2;
}

// ============================================================================
// Monomorphic Dependency Tracking
// ============================================================================

/**
 * ✅ MONOMORPHIC: Always handles signal → computed dependency
 * V8 can optimize this better than a polymorphic function
 */
function trackSignalDependency(listener: CNode<any>, signal: SNode<any>): void {
  const sources = listener.sources;

  if (!sources) {
    // First dependency
    listener.sources = [signal];
    signal.observers = [listener];
    return;
  }

  // ✅ Optimization: Check last added (common case in loops)
  if (sources[sources.length - 1] === signal) {
    return; // Already tracked
  }

  // Check if already tracked (simple linear search)
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] === signal) {
      return; // Already tracked
    }
  }

  // Add new dependency
  sources.push(signal);
  if (!signal.observers) {
    signal.observers = [listener];
  } else {
    signal.observers.push(listener);
  }
}

/**
 * ✅ MONOMORPHIC: Always handles computed → computed dependency
 */
function trackComputedDependency(listener: CNode<any>, computed: CNode<any>): void {
  const sources = listener.sources;

  if (!sources) {
    // First dependency
    listener.sources = [computed];
    computed.observers = [listener];
    return;
  }

  // ✅ Optimization: Check last added (common case)
  if (sources[sources.length - 1] === computed) {
    return; // Already tracked
  }

  // Check if already tracked
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] === computed) {
      return; // Already tracked
    }
  }

  // Add new dependency
  sources.push(computed);
  if (!computed.observers) {
    computed.observers = [listener];
  } else {
    computed.observers.push(listener);
  }
}

// ============================================================================
// Timestamp-based Update Check
// ============================================================================

/**
 * ✅ From V4 - O(1) timestamp checking
 */
function needsUpdate(node: CNode<any>): boolean {
  if (node.updatedAt === null) return true;

  if (node.sources) {
    for (let i = 0; i < node.sources.length; i++) {
      const source = node.sources[i];

      // Duck typing: has 'fn' = computed
      if ('fn' in source) {
        const csrc = source as CNode<any>;
        if (needsUpdate(csrc)) {
          update(csrc);
        }
        if (csrc.updatedAt && csrc.updatedAt > node.updatedAt) {
          return true;
        }
      } else {
        // Signal
        if (source.updatedAt > node.updatedAt) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * ✅ Update computed with PERMANENT dependencies
 */
function update<T>(node: CNode<T>): void {
  const time = ++ExecCount;
  const isFirstRun = node.sources === null;

  let prevListener = null;
  if (isFirstRun) {
    prevListener = Listener;
    Listener = node;
  }

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    if (isFirstRun) {
      Listener = prevListener;
    }
  }

  // Check equality
  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    // Value didn't change - just update timestamp
    node.updatedAt = time;
    return;
  }

  // Value changed
  node.value = newValue;
  node.updatedAt = time;
}

// ============================================================================
// Cleanup (simplified without observerSlots)
// ============================================================================

/**
 * ✅ Simplified cleanup - O(n) search instead of O(1) with slots
 * Trade-off: Slower unsubscribe, but simpler code and less memory
 */
function cleanSources(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs) return;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    const obs = src.observers;

    if (obs) {
      // ✅ O(n) search - but unsubscribe is rare
      const idx = obs.indexOf(node);
      if (idx !== -1) {
        // Swap-remove for O(1) deletion
        const last = obs[obs.length - 1];
        obs[idx] = last;
        obs.pop();

        if (obs.length === 0) {
          src.observers = null;
        }
      }
    }
  }

  node.sources = null;
}

// ============================================================================
// Effect
// ============================================================================

function createEffect(fn: () => void): Computed<null> {
  return computed(fn, () => true);
}

// ============================================================================
// Batch
// ============================================================================

let batchDepth = 0;

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
  }
}

// ============================================================================
// Export
// ============================================================================

export const zenV7b = {
  signal,
  computed,
  batch,
};
