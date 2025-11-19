/**
 * @zen/compiler - Optional JSX transformer for Zen
 *
 * Transforms JSX to enable:
 * 1. Auto-lazy children: <Show><Child /></Show> → <Show>{() => <Child />}</Show>
 * 2. Signal auto-unwrap: {signal} → {() => signal.value}
 *
 * Platform-agnostic - works with @zen/web, @zen/native, @zen/tui
 */

export { default } from './vite/index.js'; // Default export for convenience
export { default as vitePlugin } from './vite/index.js';
export { default as zenCompiler } from './vite/index.js'; // Alias
export { transformZenJSX } from './core/transform.js';
export type { CompilerOptions } from './core/types.js';
