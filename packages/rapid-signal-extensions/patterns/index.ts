/**
 * @rapid/signal-extensions/patterns
 *
 * Useful patterns built on top of Rapid Signal:
 * - store: Zustand-style factory wrapper
 * - async: Async state management (computedAsync)
 * - map: Key-level reactivity
 * - deepMap: Path-level reactivity
 */

// Store pattern
export { store } from './store';

// Async pattern
export { computedAsync } from './async';
export type { AsyncState, AsyncStore } from './async';

// Map pattern
export { map, listenKeys, setKey } from './map';
export type { MapStore } from './map';

// DeepMap pattern
export { deepMap, listenPaths, setPath } from './deepMap';
export type { DeepMapStore, Path } from './deepMap';
