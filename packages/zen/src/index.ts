/**
 * ZenJS - Ultra-fast, ultra-lightweight reactive framework
 *
 * Beyond SolidJS in performance and simplicity.
 * Powered by @zen/signal reactive core.
 *
 * This package is a convenience meta-package that re-exports
 * @zen/runtime (platform-agnostic) + @zen/web (web renderer).
 *
 * For other platforms:
 * - @zen/native - iOS/Android
 * - @zen/tui - Terminal UI
 */

// Re-export everything from @zen/web (which includes @zen/runtime)
export * from '@zen/web';
