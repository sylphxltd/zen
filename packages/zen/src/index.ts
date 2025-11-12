// Main entry point for the functional zen state management library.
// This file re-exports all public APIs.

// Core Types
export type { Listener, Unsubscribe, AnyZen, ZenValue } from './types';
import type { Zen as _Zen } from './zen';
export type Zen<T = unknown> = _Zen<T>;

// Other Types
export type { ReadonlyZen, ComputedZen } from './computed';
export type { ReadonlySelectZen, SelectZen } from './types';

// Core Factories
import { zen as _zen } from './zen';
export const zen = _zen;
export { computed } from './computed';
export { select } from './select';
export { effect } from './effect';

// Core Functions
import { batch as _batch, subscribe as _subscribe } from './zen';
export const subscribe = _subscribe;
export const batch = _batch;

// Utilities
export { batchedUpdate } from './batchedUpdate';
export { batched } from './batched';
export { untracked, tracked, isTracking } from './untracked';
export { dispose } from './computed';
