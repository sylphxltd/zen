// Main entry point for the functional zen state management library.
// This file re-exports all public APIs.

// Core Types
export * from './types';
export type { MapZen } from './types';
import type { Zen as _Zen } from './zen';
export type Zen<T = unknown> = _Zen<T>;

// Other Types
export type { ReadonlyZen, ComputedZen } from './computed';
export type { ReadonlySelectZen, SelectZen } from './types';
export type { Path } from './deepMap';
export type { LifecycleListener, KeyListener, PathListener } from './events';

// Core Factories
import { zen as _zen } from './zen';
export const zen = _zen;
export { map } from './map';
export { computed } from './computed';
export { select } from './select';
export { deepMap } from './deepMap';
export { mapCreator } from './mapCreator';

// Core Functions
import { batch as _batch, get as _get, set as _set, subscribe as _subscribe } from './zen';
export const get = _get;
export const set = _set;
export const subscribe = _subscribe;
export const batch = _batch;

// Map Functions
import { listenKeys as _listenKeys, setKey as _setKey, set as _setMapValue } from './map';
export const setKey = _setKey;
export const setMapValue = _setMapValue;
export const listenKeys = _listenKeys;

// Other Functions
export { setPath as setDeepMapPath, set as setDeepMapValue } from './deepMap';
export { batchedUpdate } from './batchedUpdate';
export { batched } from './batched';
export { effect } from './effect';

// Event Functions
export { onSet, onNotify, listenPaths } from './events';

// ✅ PHASE 1 OPTIMIZATION: Enhanced lifecycle functions with cleanup support
export { onStart, onStop, onMount, cleanup } from './lifecycle';
export type { CleanupFn, LifecycleCallback } from './lifecycle';

// ✅ PHASE 1 OPTIMIZATION: Untracked execution utilities
export { untracked, tracked, isTracking } from './untracked';

// ✅ PHASE 1 OPTIMIZATION: Computed disposal for resource cleanup
export { dispose } from './computed';
