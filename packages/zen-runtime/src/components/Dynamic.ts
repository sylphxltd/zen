/**
 * Dynamic - Render component dynamically
 *
 * Useful for rendering components based on runtime conditions.
 *
 * @example
 * ```tsx
 * const Comp = isButton ? Button : Link;
 * <Dynamic component={Comp} {...props} />
 * ```
 */

type Component<P = any> = (props: P) => Node;

interface DynamicProps<P = any> {
  component: Component<P>;
  [key: string]: any;
}

/**
 * Dynamic component renderer
 */
export function Dynamic<P = any>(props: DynamicProps<P>): Node {
  const { component, ...restProps } = props;

  if (typeof component !== 'function') {
    throw new Error('Dynamic component must be a function');
  }

  return component(restProps as P);
}
