/**
 * Zen V2 - Bound Function API (SolidJS-style)
 *
 * Key optimizations:
 * 1. Bound function API for zero-overhead reads
 * 2. Automatic dependency tracking (global Listener context)
 * 3. Bidirectional slots for O(1) unsubscribe
 * 4. Inline hot paths
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
  observers: ComputedNode<any>[] | null;
  observerSlots: number[] | null;  // Bidirectional slots
};

type ComputedNode<T> = {
  kind: 'computed';
  value: T | null;
  dirty: boolean;
  fn: () => T;
  sources: SignalNode<any>[] | null;
  sourceSlots: number[] | null;    // Bidirectional slots
  observers: ComputedNode<any>[] | null;
  observerSlots: number[] | null;
  equalityFn: (a: T, b: T) => boolean;
};

// ============================================================================
// Global Tracking Context (Automatic Dependency Tracking)
// ============================================================================

let Listener: ComputedNode<any> | null = null;

// ============================================================================
// Signal Implementation
// ============================================================================

export function signal<T>(initialValue: T): Signal<T> {
  const node: SignalNode<T> = {
    kind: 'signal',
    value: initialValue,
    observers: null,
    observerSlots: null,
  };

  // Getter function
  function getter(): T {
    // Auto-track dependency
    if (Listener) {
      if (!Listener.sources) {
        Listener.sources = [];
        Listener.sourceSlots = [];
      }
      if (!node.observers) {
        node.observers = [];
        node.observerSlots = [];
      }

      // Add bidirectional link
      const observerIndex = node.observers.length;
      const sourceIndex = Listener.sources.length;

      node.observers.push(Listener);
      node.observerSlots!.push(sourceIndex);

      Listener.sources.push(node);
      Listener.sourceSlots!.push(observerIndex);
    }

    return node.value;
  }

  // Setter function
  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;

    node.value = newValue;

    // Mark observers dirty and trigger updates
    if (node.observers && batchDepth === 0) {
      // Collect all observers to update
      const toUpdate = [...node.observers];
      for (let i = 0; i < toUpdate.length; i++) {
        const observer = toUpdate[i];
        if (!observer.dirty) {
          observer.dirty = true;
        }
        // Always update computed (whether it has observers or not)
        updateComputed(observer);
      }
    } else if (node.observers && batchDepth > 0) {
      // In batch mode, just mark dirty
      for (let i = 0; i < node.observers.length; i++) {
        const observer = node.observers[i];
        if (!observer.dirty) {
          observer.dirty = true;
          batchedComputeds.add(observer);
        }
      }
    }
  }

  // Create polymorphic function (getter/setter)
  const fn = function(value?: T): T | void {
    if (arguments.length === 0) {
      return getter();
    } else {
      setter(value!);
    }
  } as Signal<T>;

  fn.set = setter;
  fn.subscribe = (callback: (value: T) => void) => {
    // Simple subscriber implementation using auto-computed
    const autoComputed = createAutoComputed(() => {
      callback(getter());
    });

    // Trigger initial computation
    autoComputed();

    return () => {
      // Cleanup
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
    dirty: true,
    fn,
    sources: null,
    sourceSlots: null,
    observers: null,
    observerSlots: null,
    equalityFn,
  };

  function getter(): T | null {
    if (node.dirty) {
      updateComputed(node);
    }

    // Auto-track dependency
    if (Listener) {
      if (!Listener.sources) {
        Listener.sources = [];
        Listener.sourceSlots = [];
      }
      if (!node.observers) {
        node.observers = [];
        node.observerSlots = [];
      }

      // Add bidirectional link
      const observerIndex = node.observers.length;
      const sourceIndex = Listener.sources.length;

      node.observers.push(Listener);
      node.observerSlots!.push(sourceIndex);

      Listener.sources.push(node as any);
      Listener.sourceSlots!.push(observerIndex);
    }

    return node.value;
  }

  const fn2 = getter as Computed<T>;
  fn2.subscribe = (callback: (value: T | null) => void) => {
    const autoComputed = createAutoComputed(() => {
      callback(getter());
    });

    // Trigger initial computation
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
// Computed Update Logic
// ============================================================================

function updateComputed<T>(node: ComputedNode<T>): void {
  if (!node.dirty) return;

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

  node.dirty = false;

  // Check if value changed
  const oldValue = node.value;
  if (oldValue !== null && node.equalityFn(newValue, oldValue)) {
    return;
  }

  node.value = newValue;

  // Update observers
  if (node.observers && batchDepth === 0) {
    // Collect all observers to update
    const toUpdate = [...node.observers];
    for (let i = 0; i < toUpdate.length; i++) {
      const observer = toUpdate[i];
      if (!observer.dirty) {
        observer.dirty = true;
      }
      // Always update computed (whether it has observers or not)
      updateComputed(observer);
    }
  } else if (node.observers && batchDepth > 0) {
    // In batch mode, just mark dirty
    for (let i = 0; i < node.observers.length; i++) {
      const observer = node.observers[i];
      if (!observer.dirty) {
        observer.dirty = true;
        batchedComputeds.add(observer);
      }
    }
  }
}

function markDownstreamDirty(node: ComputedNode<any>): void {
  if (!node.observers) return;

  for (let i = 0; i < node.observers.length; i++) {
    const observer = node.observers[i];
    if (!observer.dirty) {
      observer.dirty = true;
      markDownstreamDirty(observer);
    }
  }
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
const batchedComputeds = new Set<ComputedNode<any>>();

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Re-run batched computeds
      for (const node of batchedComputeds) {
        if (node.dirty) {
          updateComputed(node);
        }
      }
      batchedComputeds.clear();
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export const zenV2 = {
  signal,
  computed,
  batch,
};
