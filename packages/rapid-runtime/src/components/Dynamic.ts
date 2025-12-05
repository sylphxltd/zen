/**
 * Dynamic - Render component dynamically
 *
 * @deprecated Dynamic does NOT support fine-grained reactivity.
 * If `component` prop depends on signals, changes will NOT trigger re-renders.
 *
 * Use reactive function children instead:
 * ```tsx
 * // ❌ WRONG - won't react to signal changes
 * <Dynamic component={isButton.value ? Button : Link} />
 *
 * // ✅ CORRECT - reactive function pattern
 * {() => {
 *   const Comp = isButton.value ? Button : Link;
 *   return <Comp {...props} />;
 * }}
 * ```
 *
 * @example
 * ```tsx
 * // Static usage (works, but prefer direct component call)
 * const Comp = isButton ? Button : Link;
 * <Dynamic component={Comp} {...props} />
 *
 * // Better: just call the component directly
 * const Comp = isButton ? Button : Link;
 * <Comp {...props} />
 * ```
 */

type Component<P = any> = (props: P) => any;

interface DynamicProps<P = any> {
  component: Component<P>;
  [key: string]: any;
}

/**
 * Dynamic component renderer
 *
 * @deprecated Use reactive function children instead: {() => <Component />}
 */
export function Dynamic<P = any>(props: DynamicProps<P>): any {
  const { component, ...restProps } = props;

  if (typeof component !== 'function') {
    throw new Error('Dynamic component must be a function');
  }

  // Warn in development
  if (process.env['NODE_ENV'] !== 'production') {
  }

  return component(restProps as P);
}
