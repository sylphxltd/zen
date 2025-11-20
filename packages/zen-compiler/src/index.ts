/**
 * @zen/compiler - Optional JSX transformer for Zen
 *
 * Transforms JSX to enable:
 * 1. Auto-lazy children: <Show><Child /></Show> → <Show>{() => <Child />}</Show>
 * 2. Signal.value auto-unwrap: {signal.value} → {() => signal.value}
 *
 * Note: {signal} is NOT transformed - runtime handles it via isSignal()
 * Platform-agnostic - works with @zen/web, @zen/native, @zen/tui
 */

export { default } from './vite/index.js'; // Default export for convenience
export { default as vitePlugin } from './vite/index.js';
export { default as zenCompiler } from './vite/index.js'; // Alias
export { transformZenJSX } from './core/transform.js';
export type { CompilerOptions } from './core/types.js';
