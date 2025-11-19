/**
 * ZenJS Context API
 *
 * Provides a way to pass data through the component tree
 * without having to pass props down manually at every level.
 *
 * Similar to React's Context API and SolidJS's Context API.
 */

import { getOwner } from '@zen/signal';

/**
 * Context object that holds the default value
 */
export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: (props: { value: T; children: Node | Node[] }) => Node;
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
  const context: Context<T> = {
    id: Symbol('context'),
    defaultValue,
    Provider: (props: { value: T; children: Node | Node[] }) => {
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
export function Provider<T>(
  context: Context<T>,
  props: { value: T; children: Node | Node[] },
): Node {
  const { value, children } = props;
  const owner = getOwner();

  if (!owner) {
    throw new Error('Provider must be used within a component');
  }

  // Store the context value in the current owner
  let values = contextMap.get(owner);
  if (!values) {
    values = new Map();
    contextMap.set(owner, values);
  }
  values.set(context.id, value);

  // Return children as a document fragment
  const fragment = document.createDocumentFragment();
  const childArray = Array.isArray(children) ? children : [children];

  for (const child of childArray) {
    if (child instanceof Node) {
      fragment.appendChild(child);
    } else if (child) {
      fragment.appendChild(document.createTextNode(String(child)));
    }
  }

  return fragment;
}
