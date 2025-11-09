/**
 * Zen V3 - The Ultimate Optimization
 *
 * Combines the best of all approaches:
 * 1. Bound Function API (from V2) - Zero-overhead reads
 * 2. Pull-Based Lazy Evaluation (from Solid) - Avoid unnecessary updates
 * 3. Graph Coloring (from V1) - Smart dirty tracking
 * 4. Bidirectional Slots (from V2) - O(1) unsubscribe
 *
 * Goal: Match or beat SolidJS in all benchmarks
 */

import type { AnyZen } from './types';

// ============================================================================
// Types
// ============================================================================

export type Signal<T> = {
  (): T;                           // Getter (bound)
  (value: T): void;                // Setter (overload)
  set: (value: T) => void;         // Explicit setter
  subscribe: (fn: (value: T) => void) => () => void;
  _node: SignalNode<T>;            // Internal node
};

export type Computed<T> = {
  (): T | null;                    // Getter (bound)
  subscribe: (fn: (value: T | null) => void) => () => void;
  _node: ComputedNode<T>;          // Internal node
};

type SignalNode<T> = {
  kind: 'signal';
  value: T;
  color: 0 | 2;                    // CLEAN=0, RED=2 (signals skip GREEN)
  observers: ComputedNode<any>[] | null;
  observerSlots: number[] | null;
};

type ComputedNode<T> = {
  kind: 'computed';
  value: T | null;
  color: 0 | 1 | 2;                // CLEAN=0, GREEN=1, RED=2
  fn: () => T;
  sources: (SignalNode<any> | ComputedNode<any>)[] | null;
  sourceSlots: number[] | null;
  observers: ComputedNode<any>[] | null;
  observerSlots: number[] | null;
  equalityFn: (a: T, b: T) => boolean;
};

// ============================================================================
// Graph Coloring States
// ============================================================================

const CLEAN = 0;  // Definitely clean
const GREEN = 1;  // Potentially affected (need verification)
const RED = 2;    // Definitely dirty

// ============================================================================
// Global Tracking Context
// ============================================================================

let Listener: ComputedNode<any> | null = null;

// ============================================================================
// Signal Implementation
// ============================================================================

export function signal<T>(initialValue: T): Signal<T> {
  const node: SignalNode<T> = {
    kind: 'signal',
    value: initialValue,
    color: CLEAN,
    observers: null,
    observerSlots: null,
  };

  // Getter function (bound)
  function getter(): T {
    // Auto-track dependency
    if (Listener) {
      addDependency(Listener, node);
    }
    return node.value;
  }

  // Setter function
  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;

    node.value = newValue;
    node.color = RED;

    // ✅ PHASE 1 (Down): Mark dependents as GREEN (lazy)
    markDependentsGreen(node);

    // For computeds that have observers (subscribers), trigger update immediately
    if (node.observers && batchDepth === 0) {
      for (let i = 0; i < node.observers.length; i++) {
        const observer = node.observers[i];
        // Only update if this computed has downstream observers (subscriptions)
        if (observer.observers && observer.observers.length > 0) {
          updateComputed(observer);
        }
      }
    }
  }

  // Polymorphic function (getter/setter)
  const fn = function(value?: T): T | void {
    if (arguments.length === 0) {
      return getter();
    } else {
      setter(value!);
    }
  } as Signal<T>;

  fn.set = setter;
  fn.subscribe = (callback: (value: T) => void) => {
    const autoComputed = createAutoComputed(() => {
      callback(getter());
    });
    autoComputed();
    return () => {
      if (autoComputed._node.sources) {
        unsubscribeComputed(autoComputed._node);
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
  equalityFn: (a: T, b: T) => boolean = Object.is
): Computed<T> {
  const node: ComputedNode<T> = {
    kind: 'computed',
    value: null,
    color: RED,  // Start as RED
    fn,
    sources: null,
    sourceSlots: null,
    observers: null,
    observerSlots: null,
    equalityFn,
  };

  // Getter function (bound) - PULL-BASED
  function getter(): T | null {
    // ✅ PHASE 2 (Up): Pull-based evaluation
    if (node.color === GREEN) {
      // Check if sources are actually dirty
      if (!checkSourcesChanged(node)) {
        // Sources unchanged - mark clean
        node.color = CLEAN;
        return node.value;
      }
      // Sources changed - mark RED
      node.color = RED;
    }

    if (node.color === RED) {
      updateComputed(node);
    }

    // Auto-track dependency
    if (Listener) {
      addDependency(Listener, node);
    }

    return node.value;
  }

  const fn2 = getter as Computed<T>;
  fn2.subscribe = (callback: (value: T | null) => void) => {
    const autoComputed = createAutoComputed(() => {
      callback(getter());
    });
    autoComputed();
    return () => {
      if (autoComputed._node.sources) {
        unsubscribeComputed(autoComputed._node);
      }
    };
  };
  fn2._node = node;

  return fn2;
}

// ============================================================================
// Graph Coloring Logic
// ============================================================================

/**
 * Phase 1 (Down): Mark all dependents as GREEN (potentially affected)
 */
function markDependentsGreen(node: SignalNode<any> | ComputedNode<any>): void {
  if (!node.observers) return;

  for (let i = 0; i < node.observers.length; i++) {
    const observer = node.observers[i];
    if (observer.color === CLEAN) {
      observer.color = GREEN;
      // Recursively mark downstream
      markDependentsGreen(observer);
    }
  }
}

/**
 * Phase 2 (Up): Check if sources actually changed
 * Returns true if any source is dirty
 */
function checkSourcesChanged(node: ComputedNode<any>): boolean {
  if (!node.sources) return false;

  for (let i = 0; i < node.sources.length; i++) {
    const source = node.sources[i];

    if (source.kind === 'signal') {
      // Signal is always up-to-date, check color
      if (source.color === RED) {
        return true;
      }
    } else {
      // Computed - recursively check
      if (source.color === GREEN) {
        if (checkSourcesChanged(source)) {
          source.color = RED;
          return true;
        }
        source.color = CLEAN;
      } else if (source.color === RED) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// Computed Update Logic
// ============================================================================

function updateComputed<T>(node: ComputedNode<T>): void {
  if (node.color === CLEAN) return;

  // Clear previous dependencies
  if (node.sources) {
    unsubscribeComputed(node);
  }

  const prevListener = Listener;
  Listener = node;

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    Listener = prevListener;
  }

  node.color = CLEAN;

  // Check if value changed
  const oldValue = node.value;
  if (oldValue !== null && node.equalityFn(newValue, oldValue)) {
    return;
  }

  node.value = newValue;

  // Mark as RED and propagate GREEN downstream
  node.color = RED;
  markDependentsGreen(node);
  node.color = CLEAN;  // Reset to clean after propagation
}

// ============================================================================
// Dependency Management (Bidirectional Slots)
// ============================================================================

function addDependency(
  observer: ComputedNode<any>,
  source: SignalNode<any> | ComputedNode<any>
): void {
  // Initialize arrays
  if (!observer.sources) {
    observer.sources = [];
    observer.sourceSlots = [];
  }
  if (!source.observers) {
    source.observers = [];
    source.observerSlots = [];
  }

  // Check if already linked (avoid duplicates)
  if (observer.sources.includes(source)) {
    return;
  }

  // Add bidirectional link
  const observerIndex = source.observers.length;
  const sourceIndex = observer.sources.length;

  source.observers.push(observer);
  source.observerSlots!.push(sourceIndex);

  observer.sources.push(source);
  observer.sourceSlots!.push(observerIndex);
}

function unsubscribeComputed(node: ComputedNode<any>): void {
  if (!node.sources) return;

  const sources = node.sources;
  const sourceSlots = node.sourceSlots!;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const slotIndex = sourceSlots[i];

    if (!source.observers) continue;

    // O(1) removal using bidirectional slots
    const lastIndex = source.observers.length - 1;
    if (slotIndex < lastIndex) {
      // Swap with last
      const lastObserver = source.observers[lastIndex];
      source.observers[slotIndex] = lastObserver;
      source.observerSlots![slotIndex] = source.observerSlots![lastIndex];

      // Update back-reference
      lastObserver.sourceSlots![source.observerSlots![slotIndex]] = slotIndex;
    }

    source.observers.pop();
    source.observerSlots!.pop();

    // Cleanup empty arrays
    if (source.observers.length === 0) {
      source.observers = null;
      source.observerSlots = null;
    }
  }

  node.sources = null;
  node.sourceSlots = null;
}

// ============================================================================
// Effect (Auto-computed for subscriptions)
// ============================================================================

function createAutoComputed(fn: () => void): Computed<null> {
  return computed(fn, () => true);
}

// ============================================================================
// Batch
// ============================================================================

let batchDepth = 0;
const batchedNodes = new Set<SignalNode<any> | ComputedNode<any>>();

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Mark all batched nodes as RED
      for (const node of batchedNodes) {
        if (node.color !== RED) {
          node.color = RED;
          markDependentsGreen(node);
        }
      }
      batchedNodes.clear();
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export const zenV3 = {
  signal,
  computed,
  batch,
};
