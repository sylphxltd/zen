/**
 * Mouse Input Hook
 *
 * React Ink compatible mouse event handling.
 * Hooks into the global mouse dispatcher.
 *
 * Note: For new code, prefer MouseProvider + Pressable/Draggable/Hoverable.
 * These hooks are maintained for backward compatibility.
 */

import { createUniqueId, onCleanup } from '@zen/runtime';
import { registerMouseInterest } from '../core/tui-renderer.js';
import type { MouseEvent } from '../utils/mouse-parser.js';

// Global mouse event listeners
const mouseListeners = new Set<(event: MouseEvent) => void>();

/**
 * Dispatch mouse event to all registered listeners
 * Called by the renderer when mouse events are received
 */
export function dispatchMouseEvent(event: MouseEvent): void {
  for (const listener of mouseListeners) {
    listener(event);
  }
}

/**
 * Clear all mouse listeners
 * Useful for cleanup in tests
 */
export function clearMouseListeners(): void {
  mouseListeners.clear();
}

export interface UseMouseOptions {
  /**
   * Automatically enable mouse tracking when this hook is used.
   * Set to true if using useMouse without MouseProvider.
   * @default false
   */
  enableMouse?: boolean;
}

/**
 * Hook for handling mouse events
 *
 * @example
 * // With MouseProvider (recommended)
 * useMouse((event) => {
 *   if (event.button === 'left') {
 *     console.log(`Clicked at ${event.x}, ${event.y}`);
 *   }
 * });
 *
 * // Standalone (auto-enables mouse tracking)
 * useMouse((event) => {
 *   console.log(`Mouse at ${event.x}, ${event.y}`);
 * }, { enableMouse: true });
 */
export function useMouse(handler: (event: MouseEvent) => void, options?: UseMouseOptions): void {
  mouseListeners.add(handler);

  // Optionally register mouse interest for standalone usage
  let mouseCleanup: (() => void) | null = null;
  if (options?.enableMouse) {
    const hookId = createUniqueId();
    mouseCleanup = registerMouseInterest(`use-mouse-${hookId}`);
  }

  onCleanup(() => {
    mouseListeners.delete(handler);
    mouseCleanup?.();
  });
}

/**
 * Hook for handling click events only
 *
 * @example
 * useMouseClick((x, y, button) => {
 *   console.log(`${button} clicked at ${x}, ${y}`);
 * });
 */
export function useMouseClick(
  handler: (
    x: number,
    y: number,
    button: 'left' | 'middle' | 'right',
    modifiers?: { ctrl?: boolean; shift?: boolean; meta?: boolean },
  ) => void,
  options?: UseMouseOptions,
): void {
  useMouse((event) => {
    // mouseup = click complete (button released)
    if (
      event.type === 'mouseup' &&
      (event.button === 'left' || event.button === 'middle' || event.button === 'right')
    ) {
      const { ctrl, shift, meta } = event;
      handler(event.x, event.y, event.button, {
        ctrl,
        shift,
        meta,
      });
    }
  }, options);
}

/**
 * Hook for handling scroll events only
 *
 * @example
 * useMouseScroll((direction, x, y) => {
 *   if (direction === 'up') scrollOffset.value--;
 *   else scrollOffset.value++;
 * });
 */
export function useMouseScroll(
  handler: (direction: 'up' | 'down', x: number, y: number) => void,
  options?: UseMouseOptions,
): void {
  useMouse((event) => {
    if (event.type === 'scroll') {
      const direction = event.button === 'scroll-up' ? 'up' : 'down';
      handler(direction, event.x, event.y);
    }
  }, options);
}

/**
 * Hook for handling mouse drag (press, move, release)
 *
 * @example
 * useMouseDrag({
 *   onDragStart: (x, y) => { startDrag(x, y); },
 *   onDragMove: (x, y, startX, startY) => { updatePosition(x - startX, y - startY); },
 *   onDragEnd: (x, y) => { endDrag(); },
 * });
 */
export function useMouseDrag(
  handlers: {
    onDragStart?: (
      x: number,
      y: number,
      button: 'left' | 'middle' | 'right',
    ) => boolean | undefined;
    onDragMove?: (x: number, y: number, startX: number, startY: number) => void;
    onDragEnd?: (x: number, y: number) => void;
  },
  options?: UseMouseOptions,
): void {
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  useMouse((event) => {
    if (
      event.type === 'mousedown' &&
      (event.button === 'left' || event.button === 'middle' || event.button === 'right')
    ) {
      const shouldDrag = handlers.onDragStart?.(event.x, event.y, event.button);
      if (shouldDrag !== false) {
        isDragging = true;
        startX = event.x;
        startY = event.y;
      }
    } else if (event.type === 'mousemove' && isDragging) {
      handlers.onDragMove?.(event.x, event.y, startX, startY);
    } else if (event.type === 'mouseup' && isDragging) {
      isDragging = false;
      handlers.onDragEnd?.(event.x, event.y);
    }
  }, options);
}
