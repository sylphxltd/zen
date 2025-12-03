/**
 * @rapid/signal
 *
 * Rapid framework signals with lifecycle integration
 * Re-exports all primitives from @rapid/signal-core and adds lifecycle system
 */

// Import raw primitives from @rapid/signal-core
import { batch, peek, effect as rawEffect, subscribe, untrack } from '@rapid/signal-core';
import type { AnySignal, Computed, Signal } from '@rapid/signal-core';
import { getOwner, onCleanup } from './lifecycle.js';

// ============================================================================
// LIFECYCLE-AWARE EFFECT
// ============================================================================

/**
 * Lifecycle-aware effect that automatically registers cleanup with owner system.
 *
 * When used inside a Rapid component, cleanup is automatic.
 * When used outside components, behaves like raw effect.
 *
 * @param callback - Effect callback function
 * @param explicitDeps - Optional explicit dependencies (disables auto-tracking)
 *
 * @example
 * ```tsx
 * function Component() {
 *   effect(() => {
 *     console.log('Effect running');
 *     return () => console.log('Cleanup automatically registered');
 *   });
 *
 *   // With explicit dependencies
 *   effect(() => {
 *     console.log(count.value, name.value);
 *   }, [count]);  // Only re-run when count changes
 * }
 * ```
 */
export function effect(
  callback: () => undefined | (() => void),
  explicitDeps?: AnySignal[],
): () => void {
  const dispose = rawEffect(callback, explicitDeps);

  // If we have an owner context, register cleanup automatically
  const owner = getOwner();
  if (owner) {
    onCleanup(dispose);
  }

  return dispose;
}

// Re-export primitives (signal and computed don't need lifecycle awareness)
export { signal, computed } from '@rapid/signal-core';
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
  // Internal functions needed by @rapid/runtime and @rapid/web
  setOwner,
  createOwner,
  attachNodeToOwner,
  getNodeOwner,
  setServerMode,
} from './lifecycle.js';
export type { Owner } from './lifecycle.js';

// Re-export types
export type { Signal, Computed, AnySignal } from '@rapid/signal-core';
