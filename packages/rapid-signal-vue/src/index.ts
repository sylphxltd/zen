/**
 * @rapid/signal-vue
 *
 * Vue integration for Rapid Signals
 * Provides signal primitives with Vue lifecycle integration
 */

// Re-export all signal primitives from core
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
} from '@rapid/signal-core';

// Re-export types
export type { Signal, Computed } from '@rapid/signal-core';
