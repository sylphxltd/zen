/**
 * Zen V5 - The Ultimate Fusion
 *
 * Combines the best of everything:
 * 1. SolidJS-style inline dependency tracking
 * 2. Reactively algorithm (graph coloring)
 * 3. Bound function API from V4
 * 4. Aggressive inlining and micro-optimizations
 *
 * Goal: <5x gap with Solid on all benchmarks
 */

// ============================================================================
// Types (Minimal - No 'kind' field!)
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

// Signal node (no 'kind' field - use duck typing!)
type SNode<T> = {
  value: T;
  color: 0 | 2;  // CLEAN=0, RED=2 (signals skip GREEN)
  observers: CNode<any>[] | null;
  observerSlots: number[] | null;
};

// Computed node (has 'fn' - that's how we distinguish it)
type CNode<T> = {
  value: T | null;
  color: 0 | 1 | 2;  // CLEAN=0, GREEN=1, RED=2
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

const CLEAN = 0;
const GREEN = 1;
const RED = 2;

let Listener: CNode<any> | null = null;

// ============================================================================
// Signal Implementation
// ============================================================================

export function signal<T>(initialValue: T): Signal<T> {
  const node: SNode<T> = {
    value: initialValue,
    color: CLEAN,
    observers: null,
    observerSlots: null,
  };

  // Getter (bound) - FULLY INLINED
  function getter(): T {
    // ✅ INLINE dependency tracking (no function call!)
    if (Listener) {
      const sSlot = node.observers ? node.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [node];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(node);
        Listener.sourceSlots.push(sSlot);
      }
      if (!node.observers) {
        node.observers = [Listener];
        node.observerSlots = [Listener.sources.length - 1];
      } else {
        node.observers.push(Listener);
        node.observerSlots.push(Listener.sources.length - 1);
      }
    }
    return node.value;
  }

  // Setter - PURE LAZY (only mark dirty)
  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;

    node.value = newValue;
    node.color = RED;

    // ✅ INLINE mark downstream GREEN
    const obs = node.observers;
    if (obs) {
      for (let i = 0; i < obs.length; i++) {
        const child = obs[i];
        if (child.color === CLEAN) {
          child.color = GREEN;
          markGreen(child);
        }
      }
    }
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
    return () => cleanNode(effect._node);
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
    color: RED,  // Start dirty
    fn,
    sources: null,
    sourceSlots: null,
    observers: null,
    observerSlots: null,
    equals,
  };

  // Getter (bound) - PULL-BASED with GRAPH COLORING
  function getter(): T | null {
    // ✅ INLINE graph coloring check
    if (node.color === GREEN) {
      // Check if sources actually changed
      const srcs = node.sources;
      if (srcs) {
        let anyDirty = false;
        for (let i = 0; i < srcs.length; i++) {
          const src = srcs[i];
          // Duck typing: has 'fn' = computed
          if ('fn' in src) {
            if (src.color === GREEN) {
              // Recursively check
              const cnode = src as CNode<any>;
              const cgetter = cnode.fn;
              // Call the getter to check
              if (cnode.color === GREEN) {
                checkSourcesUp(cnode);
              }
            }
            if (src.color === RED) {
              anyDirty = true;
              break;
            }
          } else {
            // Signal
            if (src.color === RED) {
              anyDirty = true;
              break;
            }
          }
        }

        if (!anyDirty) {
          // All sources clean - we're clean
          node.color = CLEAN;
          return node.value;
        }
      }
      // Some source is dirty
      node.color = RED;
    }

    if (node.color === RED) {
      update(node);
    }

    // ✅ INLINE dependency tracking
    if (Listener) {
      const sSlot = node.observers ? node.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [node];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(node);
        Listener.sourceSlots.push(sSlot);
      }
      if (!node.observers) {
        node.observers = [Listener];
        node.observerSlots = [Listener.sources.length - 1];
      } else {
        node.observers.push(Listener);
        node.observerSlots.push(Listener.sources.length - 1);
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
    return () => cleanNode(effect._node);
  };
  fn2._node = node;

  return fn2;
}

// ============================================================================
// Graph Coloring Helpers
// ============================================================================

function markGreen(node: CNode<any>): void {
  const obs = node.observers;
  if (obs) {
    for (let i = 0; i < obs.length; i++) {
      const child = obs[i];
      if (child.color === CLEAN) {
        child.color = GREEN;
        markGreen(child);
      }
    }
  }
}

function checkSourcesUp(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs) return;

  let anyDirty = false;
  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    if ('fn' in src) {
      // Computed source
      const csrc = src as CNode<any>;
      if (csrc.color === GREEN) {
        checkSourcesUp(csrc);
      }
      if (csrc.color === RED) {
        anyDirty = true;
        break;
      }
    } else {
      // Signal source
      if (src.color === RED) {
        anyDirty = true;
        break;
      }
    }
  }

  if (!anyDirty) {
    node.color = CLEAN;
  } else {
    node.color = RED;
  }
}

// ============================================================================
// Computed Update (with dependency cleanup & rebuild)
// ============================================================================

function update<T>(node: CNode<T>): void {
  // ✅ Clean dependencies (SolidJS style)
  cleanNode(node);

  // ✅ Set tracking context
  const prevListener = Listener;
  Listener = node;

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    Listener = prevListener;
  }

  node.color = CLEAN;

  // Check equality
  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    return;
  }

  node.value = newValue;

  // Mark downstream GREEN
  const obs = node.observers;
  if (obs) {
    for (let i = 0; i < obs.length; i++) {
      const child = obs[i];
      if (child.color === CLEAN) {
        child.color = GREEN;
        markGreen(child);
      }
    }
  }
}

// ============================================================================
// Cleanup (SolidJS style - swap remove)
// ============================================================================

function cleanNode(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs) return;

  // ✅ INLINE cleanup (no function calls)
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
// Effect (for subscriptions)
// ============================================================================

function createEffect(fn: () => void): Computed<null> {
  return computed(fn, () => true);
}

// ============================================================================
// Batch (implicit in pull-based model)
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

export const zenV5 = {
  signal,
  computed,
  batch,
};
