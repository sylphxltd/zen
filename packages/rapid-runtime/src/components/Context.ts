/**
 * ZenJS Context API
 *
 * Provides a way to pass data through the component tree
 * without having to pass props down manually at every level.
 *
 * Similar to React's Context API and SolidJS's Context API.
 */

import { getOwner } from '@rapid/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children } from '../utils/children.js';
import { resolveChildren } from '../utils/resolve-children.js';

/**
 * Context object that holds the default value
 */
export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: (props: { value: T; children: any | any[] }) => any;
}

/**
 * Internal storage for context values
 * Maps context ID to value, stored per owner
 */
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
  // Create Provider as a proper component function
  // This allows it to be used with JSX: <Context.Provider value={...}>
  // The descriptor pattern will automatically handle lazy children
  const ProviderComponent = (props: { value: T; children: any | any[] }) => {
    return Provider(context, props);
  };

  // Set displayName for better debugging
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'development') {
    ProviderComponent.displayName = 'Context.Provider';
  }

  const context: Context<T> = {
    id: Symbol('context'),
    defaultValue,
    Provider: ProviderComponent,
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
 * With @rapid/compiler (automatic):
 * ```tsx
 * <ThemeContext.Provider value={{ color: 'red' }}>
 *   <Child />
 * </ThemeContext.Provider>
 * ```
 *
 * Without compiler (manual children() helper):
 * ```tsx
 * import { children } from '@rapid/runtime';
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
export function Provider<T>(context: Context<T>, props: { value: T; children: any | any[] }): any {
  const owner = getOwner();

  // Enforce that Provider must be used within a reactive scope
  // This ensures proper owner tree structure for context lookup
  if (!owner) {
    throw new Error(
      'Context.Provider must be called within a reactive scope.\n\n' +
        'Wrap your root component with createRoot():\n' +
        '  const app = createRoot(() => <App />);\n\n' +
        'This ensures proper reactivity and context propagation.',
    );
  }

  // Store context in Provider's own owner.
  //
  // With lazy children (via @rapid/compiler or manual children() helper):
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
  // Solution: Use @rapid/compiler for automatic lazy children, or manually use
  // children() helper in custom provider components.
  let values = contextMap.get(owner);
  if (!values) {
    values = new Map();
    contextMap.set(owner, values);
  }
  values.set(context.id, props.value);

  // IMPORTANT: Don't access props.children directly yet!
  // If props has a lazy getter for children (descriptor pattern),
  // accessing it would trigger execution BEFORE context is set.
  // Use Object.getOwnPropertyDescriptor to check if children is a getter.
  const childrenDescriptor = Object.getOwnPropertyDescriptor(props, 'children');
  const _hasChildrenGetter = childrenDescriptor?.get !== undefined;

  // Use children() helper for runtime lazy evaluation
  // If children is already a getter, wrap it to delay execution
  // If children is a plain value, wrap it anyway for consistency
  const c = children(() => props.children);

  // Get platform operations
  const ops = getPlatformOps();

  // Resolve children lazily with new owner context
  // This ensures children can find the context we just set
  // The c() call will trigger the getter AFTER context is set
  //
  // resolveChildren handles ALL forms uniformly:
  // - Functions: () => <Component /> (lazy children pattern)
  // - Descriptors: { _jsx: true, type, props } (deferred components)
  // - Arrays: [child1, child2] (multiple children)
  // - Nested combinations of the above
  const resolved = resolveChildren(c());

  const childArray = Array.isArray(resolved) ? resolved : [resolved];

  // Use container pattern - children are stored INSIDE the container
  const container = ops.createContainer('context-provider');
  const validChildren = childArray.filter((child) => child != null);
  ops.setChildren(container, validChildren);

  return container;
}
