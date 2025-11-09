/**
 * Zen V7c - The Final Attempt: Graph Coloring + Permanent Dependencies
 *
 * Combines the PROVEN best from each successful version:
 * 1. V1's graph coloring (CLEAN/GREEN/RED) - fastest for complex graphs
 * 2. V4's permanent dependencies - no re-subscription overhead
 * 3. V7b's monomorphic functions - V8 optimization friendly
 * 4. V7b's minimal fields - tight data structures
 *
 * Key insight: V1's graph coloring was so fast because:
 * - Lazy propagation (only mark GREEN, don't compute)
 * - Minimal checks during reads
 *
 * V7c combines this with V4's permanent deps to avoid V1's API issues
 *
 * Expected: Best of both worlds
 * - Complex graphs: 400-500K ops/s (approach V1)
 * - Write: 1M+ ops/s (approach V4)
 * Risk: High - complex implementation
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

// Signal node - only CLEAN or RED
type SNode<T> = {
  value: T;
  color: 0 | 2;  // CLEAN=0, RED=2
  observers: CNode<any>[] | null;
};

// Computed node - CLEAN, GREEN, or RED
type CNode<T> = {
  value: T | null;
  color: 0 | 1 | 2;  // CLEAN=0, GREEN=1, RED=2
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};

// ============================================================================
// Constants
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
  };

  // Getter - Monomorphic tracking
  function getter(): T {
    if (Listener) {
      trackSignalDependency(Listener, node);
    }
    return node.value;
  }

  // Setter - Mark RED + mark direct observers GREEN (NON-RECURSIVE)
  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;

    node.value = newValue;
    node.color = RED;

    // ✅ V1's lazy propagation: mark DIRECT observers GREEN only
    // DO NOT recursively mark - let them mark themselves when checked
    const obs = node.observers;
    if (obs) {
      for (let i = 0; i < obs.length; i++) {
        const child = obs[i];
        if (child.color === CLEAN) {
          child.color = GREEN;
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
    color: RED,  // Start dirty
    fn,
    sources: null,
    observers: null,
    equals,
  };

  // Getter - Graph coloring + permanent deps
  function getter(): T | null {
    // ✅ V1's graph coloring check
    if (node.color === GREEN) {
      // Check if any source is actually RED
      if (checkSourcesClean(node)) {
        // All sources clean - we're clean too
        node.color = CLEAN;

        // Track if needed (for parent computeds)
        if (Listener) {
          trackComputedDependency(Listener, node);
        }

        return node.value;
      }
      // Some source is RED - need to update
      node.color = RED;
    }

    // Update if RED
    if (node.color === RED) {
      update(node);
    }

    // Track dependency
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
// Graph Coloring Helpers
// ============================================================================

/**
 * ✅ From V1 - Check if all sources are clean
 * Returns true if clean, false if any is RED or GREEN (needs checking)
 */
function checkSourcesClean(node: CNode<any>): boolean {
  const srcs = node.sources;
  if (!srcs) return true;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];

    // Duck typing: has 'fn' = computed
    if ('fn' in src) {
      const csrc = src as CNode<any>;

      // If source is GREEN, check recursively to determine if it's actually dirty
      if (csrc.color === GREEN) {
        // Recursively check if sources changed
        const sourceClean = checkSourcesClean(csrc);
        if (sourceClean) {
          // Source is actually clean
          csrc.color = CLEAN;
        } else {
          // Source has dirty dependencies
          csrc.color = RED;
          return false; // We're dirty too
        }
      } else if (csrc.color === RED) {
        // Source is definitely dirty
        return false;
      }
      // If CLEAN, continue checking other sources
    } else {
      // Signal source
      if (src.color === RED) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================================
// Update Logic
// ============================================================================

/**
 * ✅ V4's permanent dependencies + V1's color management
 */
function update<T>(node: CNode<T>): void {
  const isFirstRun = node.sources === null;

  // ✅ Only track dependencies on first run
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

  // Mark as CLEAN after update
  node.color = CLEAN;

  // Check equality
  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    // Value didn't change - we're clean but don't propagate
    return;
  }

  // Value changed - update and mark DIRECT observers GREEN only
  node.value = newValue;

  const obs = node.observers;
  if (obs) {
    for (let i = 0; i < obs.length; i++) {
      const child = obs[i];
      if (child.color === CLEAN) {
        child.color = GREEN;
      }
    }
  }
}

// ============================================================================
// Monomorphic Dependency Tracking (from V7b)
// ============================================================================

/**
 * ✅ MONOMORPHIC: signal → computed dependency
 */
function trackSignalDependency(listener: CNode<any>, signal: SNode<any>): void {
  const sources = listener.sources;

  if (!sources) {
    listener.sources = [signal];
    signal.observers = [listener];
    return;
  }

  // Check last added first (optimization)
  if (sources[sources.length - 1] === signal) {
    return;
  }

  // Check if already tracked
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] === signal) {
      return;
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
 * ✅ MONOMORPHIC: computed → computed dependency
 */
function trackComputedDependency(listener: CNode<any>, computed: CNode<any>): void {
  const sources = listener.sources;

  if (!sources) {
    listener.sources = [computed];
    computed.observers = [listener];
    return;
  }

  // Check last added first
  if (sources[sources.length - 1] === computed) {
    return;
  }

  // Check if already tracked
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] === computed) {
      return;
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
// Cleanup
// ============================================================================

function cleanSources(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs) return;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    const obs = src.observers;

    if (obs) {
      const idx = obs.indexOf(node);
      if (idx !== -1) {
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

export const zenV7c = {
  signal,
  computed,
  batch,
};
