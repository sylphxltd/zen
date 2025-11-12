/**
 * @sylphx/zen-patterns
 *
 * Useful patterns and helpers built on top of @sylphx/zen core.
 * All patterns use only public zen APIs (zen, computed, effect, subscribe).
 *
 * @packageDocumentation
 */

// Store pattern - Zustand-style factory wrapper
export { store } from './store';

// Async pattern - Async state management
export { computedAsync } from './async';
export type { AsyncState, AsyncStore } from './async';

// Map pattern - Key-level reactivity
export { map, listenKeys, setKey } from './map';
export type { MapStore } from './map';

// DeepMap pattern - Path-level reactivity
export { deepMap, listenPaths, setPath } from './deepMap';
export type { DeepMapStore, Path } from './deepMap';
