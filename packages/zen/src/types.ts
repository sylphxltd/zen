import type { BatchedZen } from './batched'; // Import BatchedZen
import type { ComputedZen } from './computed'; // Only import ComputedZen
import type { ComputedAsyncZen } from './computedAsync'; // Import ComputedAsyncZen
// Base type definitions shared across the library.
// import type { LifecycleListener, KeyListener, PathListener } from './events'; // Remove unused imports
import type { Zen } from './zen';
// ReadonlyZen will be an alias, DeepMapZen defined below

/** Callback function type for zen listeners. */
export type Listener<T> = (value: T, oldValue?: T | null) => void;

/** Function to unsubscribe a listener. */
export type Unsubscribe = () => void;

/**
 * ✅ PHASE 6 OPTIMIZATION: Node color for graph coloring algorithm
 * 0 = Clean (uncolored) - no changes detected
 * 1 = Green (check) - potentially affected, needs validation
 * 2 = Red (dirty) - definitely needs recomputation
 */
export type NodeColor = 0 | 1 | 2;

/** Base structure for zens that directly hold value and listeners. */
export type ZenWithValue<T> = {
  /** Distinguishes zen types for faster checks */
  _kind: 'zen' | 'computed' | 'computedAsync' | 'select' | 'map' | 'deepMap' | 'batched';
  /** Current value */
  _value: T;
  /** ✅ PHASE 6 OPTIMIZATION: Graph coloring for lazy pull-based evaluation (0=clean, 1=check, 2=dirty) */
  _color?: NodeColor;
  /** ✅ PHASE 1 OPTIMIZATION: Array-based listeners for better performance */
  _listeners?: Listener<T>[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener arrays use any for simplicity
  _startListeners?: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener arrays use any for simplicity
  _stopListeners?: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener arrays use any for simplicity
  _setListeners?: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener arrays use any for simplicity
  _notifyListeners?: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener arrays use any for simplicity
  _mountListeners?: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Listener maps use any for simplicity
  _keyListeners?: Map<any, Set<any>>;
  // biome-ignore lint/suspicious/noExplicitAny: Listener maps use any for simplicity
  _pathListeners?: Map<any, Set<any>>;
  // biome-ignore lint/suspicious/noExplicitAny: Listener maps use any for simplicity
  _mountCleanups?: Map<any, (() => void) | undefined>;
};

/** Represents the possible states of async computed. */
export type ZenAsyncState<T = unknown> =
  | { loading: true; error?: undefined; data?: undefined }
  | { loading: false; error: Error; data?: undefined }
  | { loading: false; error?: undefined; data: T }
  | { loading: false; error?: undefined; data?: undefined }; // Initial state

// --- Merged Zen Type Definitions ---

/** Represents a Map Zen directly holding state and listeners. */
export type MapZen<T extends object = object> = ZenWithValue<T> & {
  // Add MapZen back
  _kind: 'map';
  // No extra properties needed, structure matches ZenWithValue<Object>
};

/** Represents a DeepMap Zen directly holding state and listeners. */
export type DeepMapZen<T extends object = object> = ZenWithValue<T> & {
  // Default to object, not any
  _kind: 'deepMap';
  // No extra properties needed, structure matches ZenWithValue<Object>
};


/** Represents a Select Zen (lightweight single-source selector). */
export type SelectZen<T = unknown, S = unknown> = {
  _kind: 'select';
  _value: T | null;
  _dirty: boolean;
  /** ✅ PHASE 6 OPTIMIZATION: Graph coloring for lazy pull-based evaluation */
  _color?: NodeColor;
  readonly _source: AnyZen;
  readonly _selector: (value: S) => T;
  readonly _equalityFn: (a: T, b: T) => boolean;
  _unsubscriber?: Unsubscribe;
  /** ✅ PHASE 1 OPTIMIZATION: Array-based listeners */
  _listeners?: Listener<T>[];
  // Internal methods
  _update: () => boolean;
  _subscribeToSource: () => void;
  _unsubscribeFromSource: () => void;
};

/** Alias for SelectZen, representing the read-only nature. */
export type ReadonlySelectZen<T = unknown> = SelectZen<T>;

/** Utility type to extract the value type from any zen type. */
export type ZenValue<A extends AnyZen> = A extends ZenWithValue<infer V> ? V : never;

/** Union type for any kind of zen structure recognized by the library. */
// This union represents the structure, use ZenValue<A> to get the value type.
export type AnyZen =
  // biome-ignore lint/suspicious/noExplicitAny: Base union type requires any
  | Zen<any>
  // biome-ignore lint/suspicious/noExplicitAny: Base union type requires any
  | ComputedZen<any>
  // biome-ignore lint/suspicious/noExplicitAny: Base union type requires any
  | ComputedAsyncZen<any>
  // biome-ignore lint/suspicious/noExplicitAny: Base union type requires any
  | SelectZen<any, any>
  | MapZen<object>
  | DeepMapZen<object>
  // biome-ignore lint/suspicious/noExplicitAny: Base union type requires any
  | BatchedZen<any>;
