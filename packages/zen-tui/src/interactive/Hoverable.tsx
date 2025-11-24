/**
 * Hoverable Component
 *
 * Tracks hover state for child elements. Requires MouseProvider ancestor.
 * Uses render prop pattern to provide hover state.
 *
 * @example
 * ```tsx
 * <MouseProvider>
 *   <Hoverable>
 *     {(isHovered) => (
 *       <Box style={{ backgroundColor: isHovered ? 'blue' : 'gray' }}>
 *         <Text>Hover me</Text>
 *       </Box>
 *     )}
 *   </Hoverable>
 * </MouseProvider>
 *
 * // With callbacks
 * <Hoverable
 *   onHoverIn={() => console.log('entered')}
 *   onHoverOut={() => console.log('left')}
 * >
 *   {(isHovered) => <Box>...</Box>}
 * </Hoverable>
 * ```
 */

import { onCleanup, onMount, signal } from '@zen/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import type { TUINode } from '../core/types.js';
import { useMouseContext, type HoverEvent } from '../providers/MouseProvider.js';

export interface HoverableProps {
  /** Render function receiving hover state */
  children: (isHovered: boolean) => unknown;
  /** Called when mouse enters element */
  onHoverIn?: (event: HoverEvent) => void;
  /** Called when mouse leaves element */
  onHoverOut?: (event: HoverEvent) => void;
  /** Disable hover tracking */
  disabled?: boolean;
}

let hoverableIdCounter = 0;

export function Hoverable(props: HoverableProps): TUINode {
  const id = `hoverable-${++hoverableIdCounter}`;
  const isHovered = signal(false);

  // Register with mouse context (delayed to mount for proper context resolution)
  onMount(() => {
    const mouseContext = useMouseContext();
    if (!mouseContext) {
      // Silent - MouseProvider may not be present for non-interactive apps
      return;
    }

    const cleanup = mouseContext.registerHoverable(id, {
      onHoverIn: (event) => {
        isHovered.value = true;
        props.onHoverIn?.(event);
      },
      onHoverOut: (event) => {
        isHovered.value = false;
        props.onHoverOut?.(event);
      },
      disabled: props.disabled,
    });

    onCleanup(cleanup);
  });

  // Create wrapper node with mouse ID
  const node: TUINode = {
    type: 'box',
    tagName: 'hoverable',
    props: {
      __mouseId: id,
    },
    children: [],
    style: {},
  };

  // Render children with hover state
  const renderChildren = () => {
    const content = props.children(isHovered.value);
    return content;
  };

  appendChild(node, renderChildren);

  return node;
}
