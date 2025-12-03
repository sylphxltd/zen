/**
 * @rapid/signal-extensions
 *
 * Unified package for all Rapid Signal extensions:
 * - patterns (store, async, map, deepMap)
 * - persistent (localStorage/sessionStorage sync)
 * - craft (immutable updates with JSON Patches)
 *
 * @example
 * ```typescript
 * // Import from specific modules
 * import { store, map } from '@rapid/signal-extensions/patterns';
 * import { persistentAtom } from '@rapid/signal-extensions/persistent';
 * import { produce } from '@rapid/signal-extensions/craft';
 * ```
 */

// Re-export all sub-modules
export * from '../patterns';
export * from '../persistent';
export * from '../craft';
