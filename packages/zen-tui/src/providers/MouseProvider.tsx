/**
 * MouseProvider Component
 *
 * Enables mouse tracking for descendant components.
 * Required for Pressable, Draggable, and Hoverable to work.
 *
 * @example
 * ```tsx
 * <MouseProvider>
 *   <Pressable onPress={() => console.log('clicked')}>
 *     <Box><Text>Click me</Text></Box>
 *   </Pressable>
 * </MouseProvider>
 *
 * // Conditionally enabled
 * <MouseProvider enabled={() => $settings.value.mouseEnabled}>
 *   <App />
 * </MouseProvider>
 * ```
 */

import {
  createContext,
  createUniqueId,
  effect,
  onCleanup,
  onMount,
  signal,
  useContext,
} from '@zen/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import { registerMouseInterest } from '../core/tui-renderer.js';
import type { TUINode } from '../core/types.js';
import type { MouseEvent } from '../utils/mouse-parser.js';

// ============================================================================
// Types
// ============================================================================

export interface MouseContextValue {
  /** Whether mouse is currently enabled */
  enabled: ReturnType<typeof signal<boolean>>;
  /** Register a pressable element */
  registerPressable: (id: string, handler: PressableHandler) => () => void;
  /** Register a draggable element */
  registerDraggable: (id: string, handler: DraggableHandler) => () => void;
  /** Register a hoverable element */
  registerHoverable: (id: string, handler: HoverableHandler) => () => void;
  /** Dispatch mouse event (called by renderer) */
  dispatchMouseEvent: (
    event: MouseEvent,
    hitNode: TUINode | null,
    localX: number,
    localY: number,
  ) => void;
}

export interface PressableHandler {
  onPressIn?: (event: PressEvent) => void;
  onPressOut?: (event: PressEvent) => void;
  onPress?: (event: PressEvent) => void;
  disabled?: boolean;
}

export interface DraggableHandler {
  onDragStart?: (event: DragEvent) => boolean | undefined;
  onDrag?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  disabled?: boolean;
}

export interface HoverableHandler {
  onHoverIn?: (event: HoverEvent) => void;
  onHoverOut?: (event: HoverEvent) => void;
  disabled?: boolean;
}

export interface PressEvent {
  x: number;
  y: number;
  localX: number;
  localY: number;
  button: 'left' | 'middle' | 'right';
  modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean };
  stopPropagation: () => void;
}

export interface DragEvent extends PressEvent {
  deltaX: number;
  deltaY: number;
  startX: number;
  startY: number;
}

export interface HoverEvent {
  x: number;
  y: number;
  localX: number;
  localY: number;
}

// ============================================================================
// Context
// ============================================================================

const MouseContext = createContext<MouseContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface MouseProviderProps {
  children?: unknown;
  /** Enable mouse tracking (default: true) */
  enabled?: boolean | (() => boolean);
}

export function MouseProvider(props: MouseProviderProps): TUINode {
  const enabled = signal(true);
  const providerId = createUniqueId();
  let mouseCleanup: (() => void) | null = null;

  // Register mouse interest with renderer (reference counting)
  onMount(() => {
    const updateEnabled = () => {
      const isEnabled =
        typeof props.enabled === 'function' ? props.enabled() : props.enabled !== false;
      enabled.value = isEnabled;

      if (isEnabled && !mouseCleanup) {
        // Register interest - renderer will enable mouse if this is first consumer
        mouseCleanup = registerMouseInterest(`mouse-provider-${providerId}`);
      } else if (!isEnabled && mouseCleanup) {
        // Unregister - renderer will disable mouse if this was last consumer
        mouseCleanup();
        mouseCleanup = null;
      }
    };

    updateEnabled();

    // If enabled is reactive, set up effect
    if (typeof props.enabled === 'function') {
      effect(() => {
        updateEnabled();
      });
    }
  });

  onCleanup(() => {
    // Unregister on cleanup
    if (mouseCleanup) {
      mouseCleanup();
      mouseCleanup = null;
    }
  });

  // Handler registries
  const pressables = new Map<string, PressableHandler>();
  const draggables = new Map<string, DraggableHandler>();
  const hoverables = new Map<string, HoverableHandler>();

  // Drag state
  let activeDrag: { id: string; startX: number; startY: number } | null = null;
  let lastHoveredId: string | null = null;

  const registerPressable = (id: string, handler: PressableHandler) => {
    pressables.set(id, handler);
    return () => pressables.delete(id);
  };

  const registerDraggable = (id: string, handler: DraggableHandler) => {
    draggables.set(id, handler);
    return () => draggables.delete(id);
  };

  const registerHoverable = (id: string, handler: HoverableHandler) => {
    hoverables.set(id, handler);
    return () => hoverables.delete(id);
  };

  const dispatchMouseEvent = (
    event: MouseEvent,
    hitNode: TUINode | null,
    localX: number,
    localY: number,
  ) => {
    if (!enabled.value) return;

    const nodeId = hitNode?.props?.__mouseId as string | undefined;
    let propagationStopped = false;

    const createPressEvent = (): PressEvent => ({
      x: event.x,
      y: event.y,
      localX,
      localY,
      button: event.button as 'left' | 'middle' | 'right',
      modifiers: {
        ctrl: event.ctrl,
        shift: event.shift,
        meta: event.meta,
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    const createDragEvent = (startX: number, startY: number): DragEvent => ({
      ...createPressEvent(),
      deltaX: event.x - startX,
      deltaY: event.y - startY,
      startX,
      startY,
    });

    // Handle drag events first (they have priority)
    if (activeDrag) {
      const handler = draggables.get(activeDrag.id);
      if (handler && !handler.disabled) {
        if (event.type === 'mousemove') {
          handler.onDrag?.(createDragEvent(activeDrag.startX, activeDrag.startY));
          return;
        }
        if (event.type === 'mouseup') {
          handler.onDragEnd?.(createDragEvent(activeDrag.startX, activeDrag.startY));
          activeDrag = null;
          return;
        }
      }
    }

    // Handle hover
    if (event.type === 'mousemove') {
      // Check if we're entering/leaving hoverable elements
      if (nodeId !== lastHoveredId) {
        // Leave old
        if (lastHoveredId) {
          const oldHandler = hoverables.get(lastHoveredId);
          if (oldHandler && !oldHandler.disabled) {
            oldHandler.onHoverOut?.({ x: event.x, y: event.y, localX, localY });
          }
        }
        // Enter new
        if (nodeId) {
          const newHandler = hoverables.get(nodeId);
          if (newHandler && !newHandler.disabled) {
            newHandler.onHoverIn?.({ x: event.x, y: event.y, localX, localY });
          }
        }
        lastHoveredId = nodeId || null;
      }
      return;
    }

    if (!nodeId) return;

    // Handle mousedown - check for drag start first
    if (event.type === 'mousedown') {
      const dragHandler = draggables.get(nodeId);
      if (dragHandler && !dragHandler.disabled) {
        const dragEvent = createDragEvent(event.x, event.y);
        const shouldDrag = dragHandler.onDragStart?.(dragEvent);
        if (shouldDrag !== false) {
          activeDrag = { id: nodeId, startX: event.x, startY: event.y };
          return;
        }
      }

      // Then check for press
      const pressHandler = pressables.get(nodeId);
      if (pressHandler && !pressHandler.disabled) {
        pressHandler.onPressIn?.(createPressEvent());
      }
      return;
    }

    // Handle mouseup - press complete
    if (event.type === 'mouseup') {
      const pressHandler = pressables.get(nodeId);
      if (pressHandler && !pressHandler.disabled) {
        const pressEvent = createPressEvent();
        pressHandler.onPressOut?.(pressEvent);
        if (!propagationStopped) {
          pressHandler.onPress?.(pressEvent);
        }
      }
    }
  };

  const contextValue: MouseContextValue = {
    enabled,
    registerPressable,
    registerDraggable,
    registerHoverable,
    dispatchMouseEvent,
  };

  // Store context in node for renderer to access
  // Use flex: 1 to make provider transparent to layout
  const node: TUINode = {
    type: 'box',
    tagName: 'mouse-provider',
    props: {
      __mouseContext: contextValue,
    },
    children: [],
    style: {
      flex: 1,
      flexDirection: 'column',
    },
  };

  if (props.children !== undefined) {
    appendChild(node, props.children);
  }

  return MouseContext.Provider({
    value: contextValue,
    get children() {
      return node;
    },
  }) as unknown as TUINode;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access mouse context (internal use)
 */
export function useMouseContext(): MouseContextValue | null {
  return useContext(MouseContext);
}
