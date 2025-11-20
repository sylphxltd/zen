/**
 * ZenJS Context API
 *
 * Provides a way to pass data through the component tree
 * without having to pass props down manually at every level.
 *
 * Similar to React's Context API and SolidJS's Context API.
 */

import { getNodeOwner, getOwner } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children } from '../utils/children.js';

/**
 * Context object that holds the default value
 */
export interface Context<T> {
  id: symbol;
  defaultValue: T;
  // biome-ignore lint/suspicious/noExplicitAny: Provider children can be any JSX element type
  Provider: (props: { value: T; children: any | any[] }) => any;
}

/**
 * Internal storage for context values
 * Maps context ID to value, stored per owner
 */
// biome-ignore lint/suspicious/noExplicitAny: Owner type is internal to @zen/signal, context values can be any type
const contextMap = new WeakMap<any, Map<symbol, any>>();

/**
 * Creates a new context with an optional default value
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext({ color: 'blue' });
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value={{ color: 'red' }}>
 *       <Child />
 *     </ThemeContext.Provider>
 *   );
 * }
 *
 * function Child() {
 *   const theme = useContext(ThemeContext);
 *   return <div style={{ color: theme.color }}>Hello</div>;
 * }
 * ```
 */
export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    id: Symbol('context'),
    defaultValue,
    // biome-ignore lint/suspicious/noExplicitAny: Provider children can be any JSX element type
    Provider: (props: { value: T; children: any | any[] }) => {
      return Provider(context, props);
    },
  };
  return context;
}

/**
 * Retrieves the value of a context from the nearest Provider
 *
 * @param context The context object created by createContext
 * @returns The context value, or the default value if no Provider is found
 *
 * @example
 * ```tsx
 * function Component() {
 *   const theme = useContext(ThemeContext);
 *   return <div style={{ color: theme.color }}>Hello</div>;
 * }
 * ```
 */
export function useContext<T>(context: Context<T>): T {
  let owner = getOwner();

  // Walk up the owner tree to find the context value
  while (owner) {
    const values = contextMap.get(owner);
    if (values?.has(context.id)) {
      return values.get(context.id) as T;
    }
    owner = owner.parent;
  }

  // No provider found, return default value
  return context.defaultValue;
}

/**
 * Provider component that makes a context value available to descendants
 *
 * **Usage with lazy children (recommended):**
 *
 * With @zen/compiler (automatic):
 * ```tsx
 * <ThemeContext.Provider value={{ color: 'red' }}>
 *   <Child />
 * </ThemeContext.Provider>
 * ```
 *
 * Without compiler (manual children() helper):
 * ```tsx
 * import { children } from '@zen/runtime';
 *
 * function CustomProvider(props) {
 *   const c = children(() => props.children);
 *   setupContext(props.value);  // Set context first
 *   return c();                  // Then resolve children
 * }
 * ```
 *
 * **Note:** Without lazy children (no compiler, no manual helper), nested/sibling
 * Providers may not work correctly due to JSX eager evaluation.
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext({ color: 'blue' });
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value={{ color: 'red' }}>
 *       <Child />
 *     </ThemeContext.Provider>
 *   );
 * }
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Provider children can be any JSX element type
export function Provider<T>(context: Context<T>, props: { value: T; children: any | any[] }): any {
  const owner = getOwner();

  if (!owner) {
    throw new Error('Provider must be used within a component');
  }

  // Store context in Provider's own owner.
  //
  // With lazy children (via @zen/compiler or manual children() helper):
  //   Owner tree:
  //     App (owner)
  //     └─ Provider (owner, parent: App) <- stores context HERE
  //        └─ Children (owner, parent: Provider) <- lazy evaluation, finds context!
  //
  // Without lazy children (eager JSX):
  //   Owner tree:
  //     App (owner)
  //     ├─ Provider (owner, parent: App) <- stores context here
  //     └─ Children (owner, parent: App) <- sibling, won't find context ❌
  //
  // Solution: Use @zen/compiler for automatic lazy children, or manually use
  // children() helper in custom provider components.
  let values = contextMap.get(owner);
  if (!values) {
    values = new Map();
    contextMap.set(owner, values);
  }
  values.set(context.id, props.value);

  // Use children() helper for runtime lazy evaluation
  // This ensures children are evaluated AFTER context is set,
  // even without compiler transformation
  const c = children(() => props.children);

  // Get platform operations
  const ops = getPlatformOps();

  // Resolve children lazily
  const resolved = c();
  const childArray = Array.isArray(resolved) ? resolved : [resolved];
  const fragment = ops.createFragment();
  for (const child of childArray) {
    if (child) {
      ops.appendToFragment(fragment, child);
    }
  }

  return fragment;
}
