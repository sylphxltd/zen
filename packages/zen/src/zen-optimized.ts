/**
 * Zen Optimized Build
 *
 * Streamlined version with only the most commonly used APIs.
 * Optimized for minimal bundle size while maintaining performance.
 *
 * Included:
 * - zen (core signals with .value property)
 * - computed (derived values)
 * - computedAsync (async derived values)
 * - select (single-source selectors)
 * - map (map stores)
 * - batch (batched updates)
 * - subscribe (subscriptions)
 * - setKey (map key updates)
 *
 * Excluded (saves ~45% bundle size):
 * - get/set (use .value property instead)
 * - deepMap (use regular map + nested structure)
 * - mapCreator (use map directly)
 * - batched/batchedUpdate (use batch instead)
 * - effect (use subscribe instead)
 * - onSet/onNotify/onStart/onStop/onMount (use subscribe)
 * - untracked/tracked (explicit deps instead)
 * - lifecycle functions (manual cleanup)
 * - listenKeys/listenPaths (use subscribe on map)
 */

// Core Types
export type {
  AnyZen,
  Listener,
  Unsubscribe,
  ZenValue,
  MapZen,
  DeepMapZen,
  SelectZen,
  ReadonlySelectZen,
} from './types';

export type { Zen } from './zen';
export type { ReadonlyZen, ComputedZen } from './computed';
export type { ComputedAsyncZen, ComputedAsyncOptions } from './computedAsync';

// Core Factories
export { zen } from './zen';
export { map } from './map';
export { computed } from './computed';
export { computedAsync } from './computedAsync';
export { select } from './select';

// Core Functions
export { subscribe, batch } from './zen';

// Map Functions (minimal)
export { setKey } from './map';
