/**
 * ZenJS Portal Component
 *
 * Render children into a different part of the DOM tree
 *
 * Features:
 * - Render outside parent hierarchy
 * - Useful for modals, tooltips, popovers
 * - Maintains reactive context
 */

interface PortalProps {
  mount?: Element;
  children: Node;
}

/**
 * Portal component - Render children into different DOM location
 *
 * @example
 * <Portal mount={document.body}>
 *   <Modal>...</Modal>
 * </Portal>
 */
export function Portal(props: PortalProps): Node {
  const { mount = document.body, children } = props;

  // Create marker
  const marker = document.createComment('portal');

  // Mount children to target
  if (children instanceof Node) {
    mount.appendChild(children);
  }

  // Cleanup on dispose
  (marker as any)._dispose = () => {
    if (children instanceof Node && children.parentNode === mount) {
      mount.removeChild(children);
    }
  };

  return marker;
}
