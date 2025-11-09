/**
 * Zen V7a - Aggressive Inline (No Duplicate Check)
 *
 * Hypothesis: The duplicate check in dependency tracking is the bottleneck.
 * Solution: Remove duplicate check, allow duplicate dependencies, deduplicate lazily.
 *
 * Based on V7b but with:
 * 1. NO duplicate check during tracking (zero overhead)
 * 2. Deduplicate sources ONLY after computed updates (amortized cost)
 * 3. Keep monomorphic functions from V7b
 *
 * Expected gains: +30-50% on complex graphs
 * Risk: Medium - need careful handling of duplicates
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

type SNode<T> = {
  value: T;
  updatedAt: number;
  observers: CNode<any>[] | null;
};

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

  // Getter - ZERO-OVERHEAD tracking (no duplicate check)
  function getter(): T {
    if (Listener) {
      // ✅ NO DUPLICATE CHECK - just append
      const sources = Listener.sources;
      if (!sources) {
        Listener.sources = [node];
        node.observers = [Listener];
      } else {
        sources.push(node);
        (node.observers ??= []).push(Listener);
      }
    }
    return node.value;
  }

  // Setter - Pure lazy
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

  // Getter
  function getter(): T | null {
    if (needsUpdate(node)) {
      update(node);
    }

    if (Listener) {
      // ✅ NO DUPLICATE CHECK - just append
      const sources = Listener.sources;
      if (!sources) {
        Listener.sources = [node];
        node.observers = [Listener];
      } else {
        sources.push(node);
        (node.observers ??= []).push(Listener);
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
// Update Logic
// ============================================================================

function needsUpdate(node: CNode<any>): boolean {
  if (node.updatedAt === null) return true;

  // ✅ Handle duplicates: sources may contain same source multiple times
  // But that's OK - we just check timestamps
  if (node.sources) {
    for (let i = 0; i < node.sources.length; i++) {
      const source = node.sources[i];

      if ('fn' in source) {
        const csrc = source as CNode<any>;
        if (needsUpdate(csrc)) {
          update(csrc);
        }
        if (csrc.updatedAt && csrc.updatedAt > node.updatedAt) {
          return true;
        }
      } else {
        if (source.updatedAt > node.updatedAt) {
          return true;
        }
      }
    }
  }

  return false;
}

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
      // ✅ DEDUPLICATE after first run
      // This amortizes the cost: O(n²) but only once per computed
      deduplicateSources(node);
    }
  }

  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    node.updatedAt = time;
    return;
  }

  node.value = newValue;
  node.updatedAt = time;
}

/**
 * ✅ Deduplicate sources after tracking
 * Called ONLY after first run, so cost is amortized
 */
function deduplicateSources(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs || srcs.length <= 1) return;

  // Use Set for O(n) deduplication instead of O(n²)
  const seen = new Set<SNode<any> | CNode<any>>();
  let writeIdx = 0;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    if (!seen.has(src)) {
      seen.add(src);
      srcs[writeIdx++] = src;
    }
  }

  // Truncate duplicates
  if (writeIdx < srcs.length) {
    srcs.length = writeIdx;
  }

  // Also deduplicate observer arrays in sources
  // This is important to avoid notifying the same observer multiple times
  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    const obs = src.observers;
    if (obs && obs.length > 1) {
      const obsSet = new Set(obs);
      if (obsSet.size < obs.length) {
        src.observers = Array.from(obsSet);
      }
    }
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

export const zenV7a = {
  signal,
  computed,
  batch,
};
