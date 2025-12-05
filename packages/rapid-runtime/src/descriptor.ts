/**
 * Component Descriptor Pattern
 *
 * Solves JSX eager evaluation problem that breaks Context propagation.
 *
 * ## Problem
 * Standard JSX: jsx(Provider, { children: jsx(Child, {}) })
 * Child executes BEFORE Provider → Context not found ❌
 *
 * ## Solution
 * Phase 1: jsx() returns descriptors (lightweight objects)
 * Phase 2: Orchestrator executes in parent-first order
 *
 * See ADR-011 for full details.
 */

import { attachNodeToOwner } from '@rapid/signal';
import { executeComponent } from './reactive-utils.js';

/**
 * Component descriptor - returned by jsx() for components
 * Delays execution until orchestrator processes it
 */
export interface ComponentDescriptor {
  /** Marker to identify descriptors */
  _jsx: true;
  /** Component function to execute */
  type: ComponentFunction;
  /** Props to pass when executing */
  props: Record<string, unknown> | null;
}

type ComponentFunction = (props: Record<string, unknown> | null) => unknown;

/**
 * Check if value is a component descriptor
 */
export function isDescriptor(value: unknown): value is ComponentDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_jsx' in value &&
    (value as ComponentDescriptor)._jsx === true
  );
}

/**
 * Execute component descriptor with proper owner setup
 *
 * This is Phase 2 of the descriptor pattern.
 * Creates owner scope and executes component with lazy props.
 */
export function executeDescriptor(desc: ComponentDescriptor): unknown {
  // Make props lazy (children will be executed on-demand)
  const lazyProps = makeLazyPropsForDescriptor(desc.props);

  // Execute with owner scope
  let result = executeComponent(
    () => desc.type(lazyProps),
    (node: any, owner: any) => {
      // Only attach single nodes to owner tree
      // Arrays/fragments handle attachment themselves
      if (!Array.isArray(node)) {
        attachNodeToOwner(node, owner);
      }
    },
  );

  // IMPORTANT: Component may return another descriptor
  // This happens when a component returns another component: () => <OtherComponent />
  // Execute recursively until we get a real node
  if (isDescriptor(result)) {
    result = executeDescriptor(result);
  }

  // Handle array of descriptors
  if (Array.isArray(result)) {
    result = result.map((item) => (isDescriptor(item) ? executeDescriptor(item) : item));
  }

  return result;
}

/**
 * Make props with lazy children getter for descriptors
 *
 * Transforms:
 *   { children: ComponentDescriptor }
 * Into:
 *   { get children() { return executeDescriptor(...) } }
 *
 * This ensures children execute AFTER parent component body,
 * allowing Context to be set up before children try to access it.
 */
function makeLazyPropsForDescriptor(
  props: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!props || !('children' in props)) {
    return props;
  }

  const children = props['children'];

  // Single descriptor - make lazy with memoization
  if (isDescriptor(children)) {
    let executed: unknown = undefined;
    let hasExecuted = false;

    return {
      ...props,
      get children() {
        // Memoize: execute only once, return cached result on subsequent reads
        // This allows props.children to be read multiple times safely
        if (!hasExecuted) {
          executed = executeDescriptor(children);
          // IMPORTANT: DocumentFragment children are MOVED when appended to DOM,
          // leaving the fragment empty. Extract children as array BEFORE they get moved.
          // This fixes the bug where components returning <> (Fragment) disappear after re-render.
          if (
            executed &&
            typeof executed === 'object' &&
            'nodeName' in executed &&
            (executed as Node).nodeName === '#document-fragment'
          ) {
            const fragment = executed as DocumentFragment;
            if (fragment.childNodes.length > 0) {
              executed = Array.from(fragment.childNodes);
            }
          }
          hasExecuted = true;
        }
        return executed;
      },
    };
  }

  // Array with descriptors - make lazy with memoization
  if (Array.isArray(children)) {
    const hasDescriptors = children.some(isDescriptor);
    if (hasDescriptors) {
      let executed: unknown = undefined;
      let hasExecuted = false;

      return {
        ...props,
        get children() {
          if (!hasExecuted) {
            executed = children.map((child) =>
              isDescriptor(child) ? executeDescriptor(child) : child,
            );
            hasExecuted = true;
          }
          return executed;
        },
      };
    }
  }

  // No descriptors - return as-is
  return props;
}
