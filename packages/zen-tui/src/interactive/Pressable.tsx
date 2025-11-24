/**
 * Pressable Component
 *
 * Makes child elements clickable. Requires MouseProvider ancestor.
 *
 * @example
 * ```tsx
 * <MouseProvider>
 *   <Pressable onPress={() => console.log('clicked!')}>
 *     <Box style={{ borderStyle: 'single' }}>
 *       <Text>Click me</Text>
 *     </Box>
 *   </Pressable>
 * </MouseProvider>
 * ```
 */

import { onCleanup, onMount, signal } from '@zen/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import type { TUINode } from '../core/types.js';
import { useMouseContext, type PressEvent } from '../providers/MouseProvider.js';

export interface PressableProps {
  children?: unknown;
  /** Called when press completes (mouseup) */
  onPress?: (event: PressEvent) => void;
  /** Called when press starts (mousedown) */
  onPressIn?: (event: PressEvent) => void;
  /** Called when press ends (mouseup, before onPress) */
  onPressOut?: (event: PressEvent) => void;
  /** Disable press handling */
  disabled?: boolean;
}

let pressableIdCounter = 0;

export function Pressable(props: PressableProps): TUINode {
  const id = `pressable-${++pressableIdCounter}`;

  // Register with mouse context (delayed to mount for proper context resolution)
  onMount(() => {
    const mouseContext = useMouseContext();
    if (!mouseContext) {
      // Silent - MouseProvider may not be present for non-interactive apps
      return;
    }

    const cleanup = mouseContext.registerPressable(id, {
      onPress: props.onPress,
      onPressIn: props.onPressIn,
      onPressOut: props.onPressOut,
      disabled: props.disabled,
    });

    onCleanup(cleanup);
  });

  // Create wrapper node with mouse ID
  const node: TUINode = {
    type: 'box',
    tagName: 'pressable',
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
