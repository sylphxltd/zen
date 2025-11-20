/**
 * @zen/signal
 *
 * Zen framework signals with lifecycle integration
 * Re-exports all primitives from @zen/signal-core and adds lifecycle system
 */

// Import raw primitives from @zen/signal-core
import { batch, peek, effect as rawEffect, subscribe, untrack } from '@zen/signal-core';
import type { Computed, Signal } from '@zen/signal-core';
import { getOwner, onCleanup } from './lifecycle.js';

// ============================================================================
// LIFECYCLE-AWARE EFFECT
// ============================================================================

/**
 * Lifecycle-aware effect that automatically registers cleanup with owner system.
 *
 * When used inside a Zen component, cleanup is automatic.
 * When used outside components, behaves like raw effect.
 *
 * @example
 * ```tsx
 * function Component() {
 *   effect(() => {
 *     console.log('Effect running');
 *     return () => console.log('Cleanup automatically registered');
 *   });
 * }
 * ```
 */
export function effect(callback: () => undefined | (() => void)): () => void {
  const dispose = rawEffect(callback);

  // If we have an owner context, register cleanup automatically
  const owner = getOwner();
  if (owner) {
    onCleanup(dispose);
  }

  return dispose;
}

// Re-export primitives (signal and computed don't need lifecycle awareness)
export { signal, computed } from '@zen/signal-core';
export { batch, untrack, peek, subscribe };

// Export raw effect for advanced users who want manual control
export { rawEffect };

// Export lifecycle system
export {
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
  // Internal functions needed by @zen/runtime and @zen/web
  setOwner,
  createOwner,
  attachNodeToOwner,
  getNodeOwner,
  setServerMode,
} from './lifecycle.js';
export type { Owner } from './lifecycle.js';

// Re-export types
export type { Signal, Computed, AnySignal } from '@zen/signal-core';
