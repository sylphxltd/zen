// Main entry point for the functional zen state management library.
// Minimal core - only essential features

// Core Types
export type { Listener, Unsubscribe, AnyZen, ZenValue } from './types';
import type { Zen as _Zen } from './zen';
export type Zen<T = unknown> = _Zen<T>;

// Other Types
export type { ReadonlyZen, ComputedZen } from './computed';

// Core Factories
import { zen as _zen } from './zen';
export const zen: typeof _zen = _zen;
export { computed } from './computed';
export { effect } from './effect';

// Core Functions
import { batch as _batch, subscribe as _subscribe } from './zen';
export const subscribe: typeof _subscribe = _subscribe;
export const batch: typeof _batch = _batch;
