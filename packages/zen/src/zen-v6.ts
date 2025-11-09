/**
 * Zen V6 - Simplified Hybrid
 *
 * Simpler approach after V5 failure:
 * 1. V4's bound function API + timestamp tracking (proven)
 * 2. V5's inline dependency tracking (reduce overhead)
 * 3. V4's permanent dependencies (no cleanup)
 *
 * Key changes from V4:
 * - Inline dependency tracking in getters (no function calls)
 * - Remove 'kind' field (duck typing)
 *
 * Key changes from V5:
 * - Keep timestamp tracking (simpler than graph coloring)
 * - NO dependency cleanup
 */

// ============================================================================
// Types
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

// Signal node
type SNode<T> = {
  value: T;
  updatedAt: number;
  observers: CNode<any>[] | null;
  observerSlots: number[] | null;
};

// Computed node (has 'fn' - duck typing)
type CNode<T> = {
  value: T | null;
  updatedAt: number | null;
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  sourceSlots: number[] | null;
  observers: CNode<any>[] | null;
  observerSlots: number[] | null;
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
    observerSlots: null,
  };

  // Getter - INLINE dependency tracking
  function getter(): T {
    // ✅ INLINE: Track dependency if Listener is set
    if (Listener) {
      const sources = Listener.sources;
      if (!sources) {
        // First dependency
        Listener.sources = [node];
        Listener.sourceSlots = [0];
        node.observers = [Listener];
        node.observerSlots = [0];
      } else {
        // Check if already tracked
        let found = false;
        for (let i = 0; i < sources.length; i++) {
          if (sources[i] === node) {
            found = true;
            break;
          }
        }
        if (!found) {
          const sSlot = node.observers ? node.observers.length : 0;
          const oSlot = sources.length;
          sources.push(node);
          Listener.sourceSlots!.push(sSlot);
          if (!node.observers) {
            node.observers = [Listener];
            node.observerSlots = [oSlot];
          } else {
            node.observers.push(Listener);
            node.observerSlots.push(oSlot);
          }
        }
      }
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
      // For subscriptions we DO need cleanup
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
    sourceSlots: null,
    observers: null,
    observerSlots: null,
    equals,
  };

  // Getter - Pull-based with timestamp checking
  function getter(): T | null {
    // ✅ Check if update needed using timestamps
    if (needsUpdate(node)) {
      update(node);
    }

    // ✅ INLINE: Track dependency if Listener is set
    if (Listener) {
      const sources = Listener.sources;
      if (!sources) {
        Listener.sources = [node];
        Listener.sourceSlots = [0];
        node.observers = [Listener];
        node.observerSlots = [0];
      } else {
        // Check if already tracked
        let found = false;
        for (let i = 0; i < sources.length; i++) {
          if (sources[i] === node) {
            found = true;
            break;
          }
        }
        if (!found) {
          const sSlot = node.observers ? node.observers.length : 0;
          const oSlot = sources.length;
          sources.push(node);
          Listener.sourceSlots!.push(sSlot);
          if (!node.observers) {
            node.observers = [Listener];
            node.observerSlots = [oSlot];
          } else {
            node.observers.push(Listener);
            node.observerSlots.push(oSlot);
          }
        }
      }
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

/**
 * ✅ Cleanup (only for effects/subscriptions)
 */
function cleanSources(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs) return;

  while (srcs.length) {
    const src = srcs.pop()!;
    const idx = node.sourceSlots!.pop()!;
    const obs = src.observers;

    if (obs && obs.length) {
      const last = obs.pop()!;
      const lastSlot = src.observerSlots!.pop()!;

      if (idx < obs.length) {
        // Swap-remove
        last.sourceSlots![lastSlot] = idx;
        obs[idx] = last;
        src.observerSlots![idx] = lastSlot;
      }
    }
  }

  node.sources = null;
  node.sourceSlots = null;
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

export const zenV6 = {
  signal,
  computed,
  batch,
};
