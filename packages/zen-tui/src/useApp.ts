/**
 * useApp hook for TUI
 *
 * Provides application-level control (Ink-compatible API).
 * Allows components to exit the application programmatically.
 */

export interface AppContext {
  exit: (error?: Error) => void;
}

/**
 * Hook to access application instance (Ink-compatible API)
 *
 * Returns methods to control the CLI application lifecycle.
 *
 * @example
 * ```tsx
 * import { useApp } from '@zen/tui';
 *
 * function MyComponent() {
 *   const { exit } = useApp();
 *
 *   // Exit normally
 *   exit();
 *
 *   // Exit with error (sets exit code to 1)
 *   exit(new Error('Something went wrong'));
 * }
 * ```
 */
export function useApp(): AppContext {
  return {
    exit: (error?: Error) => {
      if (error) {
        process.exit(1);
      } else {
        // Normal exit with code 0
        process.exit(0);
      }
    },
  };
}
