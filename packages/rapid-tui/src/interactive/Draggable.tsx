/**
 * Draggable Component
 *
 * Makes child elements draggable. Requires MouseProvider ancestor.
 *
 * @example
 * ```tsx
 * <MouseProvider>
 *   <Draggable
 *     onDragStart={() => console.log('drag started')}
 *     onDrag={(e) => console.log(`moved ${e.deltaX}, ${e.deltaY}`)}
 *     onDragEnd={() => console.log('drag ended')}
 *   >
 *     <Box style={{ position: 'absolute', left: x, top: y }}>
 *       <Text>Drag me</Text>
 *     </Box>
 *   </Draggable>
 * </MouseProvider>
 * ```
 */

import { createUniqueId, onCleanup, onMount } from '@rapid/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import type { TUINode } from '../core/types.js';
import { type DragEvent, useMouseContext } from '../providers/MouseProvider.js';

export interface DraggableProps {
  children?: unknown;
  /** Called when drag starts. Return false to prevent drag. */
  onDragStart?: (event: DragEvent) => boolean | undefined;
  /** Called during drag with delta from start position */
  onDrag?: (event: DragEvent) => void;
  /** Called when drag ends */
  onDragEnd?: (event: DragEvent) => void;
  /** Disable drag handling */
  disabled?: boolean;
}

export function Draggable(props: DraggableProps): TUINode {
  const id = `draggable-${createUniqueId()}`;

  // Register with mouse context (delayed to mount for proper context resolution)
  onMount(() => {
    const mouseContext = useMouseContext();
    if (!mouseContext) {
      // Warn in development - MouseProvider is required for Draggable to work
      if (process.env['NODE_ENV'] !== 'production') {
      }
      return;
    }

    const cleanup = mouseContext.registerDraggable(id, {
      onDragStart: props.onDragStart,
      onDrag: props.onDrag,
      onDragEnd: props.onDragEnd,
      disabled: props.disabled,
    });

    onCleanup(cleanup);
  });

  // Create wrapper node with mouse ID
  const node: TUINode = {
    type: 'box',
    tagName: 'draggable',
    props: {
      __mouseId: id,
    },
    children: [],
    style: {},
  };

  if (props.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
