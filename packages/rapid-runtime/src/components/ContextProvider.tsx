/**
 * Universal Context Provider Component
 *
 * This component solves the lazy children problem for Context.Provider.
 * Users can write pure JSX without manual getters!
 *
 * Usage:
 * ```tsx
 * // Instead of Context.Provider, use ContextProvider:
 * import { ContextProvider } from '@rapid/runtime';
 *
 * <ContextProvider context={MyContext} value={myValue}>
 *   <Child />
 * </ContextProvider>
 * ```
 *
 * The descriptor pattern automatically handles lazy children.
 * No manual getters needed!
 */

import type { Context } from './Context.js';

export interface ContextProviderProps<T> {
  context: Context<T>;
  value: T;
  children?: unknown;
}

/**
 * Universal Provider component that works with descriptor pattern
 *
 * This component properly forwards the lazy children getter to the
 * internal Provider without triggering it prematurely.
 */
export function ContextProvider<T>(props: ContextProviderProps<T>): object {
  const { context, value } = props;

  // Forward to the context's Provider
  // IMPORTANT: Use getter syntax to preserve lazy evaluation
  return context.Provider({
    value,
    get children() {
      return props.children;
    },
  });
}
