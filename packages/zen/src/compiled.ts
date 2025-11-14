/**
 * Optimized runtime for compiler-generated graphs
 *
 * This module provides a faster implementation that uses
 * pre-analyzed dependency graphs from the compiler plugin.
 *
 * Benefits vs runtime-only approach:
 * - No dependency tracking overhead
 * - Direct array access (faster than Map)
 * - Pre-sorted execution order
 * - Dead code elimination
 */

import type { Listener, Unsubscribe } from './zen';

/**
 * Compiled graph structure from compiler plugin
 */
export interface CompiledSignal {
  id: number;
  value: any;
}

export interface CompiledComputed {
  id: number;
  deps: number[]; // Indices of dependencies in the graph
  fn: (...args: any[]) => any;
}

export interface CompiledGraph {
  signals: CompiledSignal[];
  computed: CompiledComputed[];
  executionOrder: number[]; // Pre-sorted topological order
}

/**
 * Runtime state for compiled graph
 */
interface RuntimeState {
  // Current values (indexed by id)
  values: any[];

  // Listeners for each node (indexed by id)
  listeners: Map<number, Set<Listener<any>>>;

  // Dirty flags for computed values
  dirty: Set<number>;

  // Version numbers for change detection
  versions: number[];

  // Cached computed values
  computedCache: Map<number, any>;
}

/**
 * Create optimized runtime from compiled graph
 */
export function createCompiledGraph(graph: CompiledGraph) {
  const state: RuntimeState = {
    values: [],
    listeners: new Map(),
    dirty: new Set(),
    versions: [],
    computedCache: new Map(),
  };

  // Initialize signal values
  for (const signal of graph.signals) {
    state.values[signal.id] = signal.value;
    state.versions[signal.id] = 0;
  }

  // Initialize computed as dirty
  for (const comp of graph.computed) {
    state.dirty.add(comp.id);
    state.versions[comp.id] = 0;
  }

  /**
   * Get value by id (signal or computed)
   */
  function getValue(id: number): any {
    // Check if it's a computed value
    const comp = graph.computed.find((c) => c.id === id);

    if (comp) {
      // If dirty, recompute
      if (state.dirty.has(id)) {
        // Get dependency values
        const depValues = comp.deps.map((depId) => getValue(depId));

        // Compute new value
        const newValue = comp.fn(...depValues);

        // Cache and mark clean
        state.computedCache.set(id, newValue);
        state.dirty.delete(id);
        state.values[id] = newValue;
        state.versions[id]++;

        return newValue;
      }

      // Return cached value
      return state.computedCache.get(id);
    }

    // It's a signal, return directly
    return state.values[id];
  }

  /**
   * Set signal value (only for signals, not computed)
   */
  function setValue(id: number, newValue: any): void {
    const signal = graph.signals.find((s) => s.id === id);
    if (!signal) {
      throw new Error(`Cannot set value of computed (id: ${id})`);
    }

    const oldValue = state.values[id];

    // Check equality (Object.is behavior)
    if (newValue === oldValue && (newValue !== 0 || 1 / newValue === 1 / oldValue)) {
      return;
    }
    if (newValue !== newValue && oldValue !== oldValue) return;

    // Update value and version
    state.values[id] = newValue;
    state.versions[id]++;

    // Mark dependent computed as dirty
    for (const comp of graph.computed) {
      if (comp.deps.includes(id)) {
        state.dirty.add(comp.id);
      }
    }

    // Notify listeners
    const listeners = state.listeners.get(id);
    if (listeners) {
      for (const listener of listeners) {
        listener(newValue, oldValue);
      }
    }
  }

  /**
   * Subscribe to changes
   */
  function subscribe(id: number, listener: Listener<any>): Unsubscribe {
    if (!state.listeners.has(id)) {
      state.listeners.set(id, new Set());
    }

    state.listeners.get(id)!.add(listener);

    // Initial notification
    listener(getValue(id), undefined);

    // Return unsubscribe
    return () => {
      const listeners = state.listeners.get(id);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  return {
    getValue,
    setValue,
    subscribe,
    graph, // Expose for debugging
    state, // Expose for debugging
  };
}

/**
 * Type for compiled graph runtime
 */
export type CompiledGraphRuntime = ReturnType<typeof createCompiledGraph>;
