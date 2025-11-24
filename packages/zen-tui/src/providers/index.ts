/**
 * Providers - Capability providers for TUI
 */

export {
  RenderSettingsProvider,
  useRenderSettings,
  setGlobalRenderSettings,
  getGlobalRenderSettings,
  type RenderSettings,
} from './RenderContext.js';

export {
  MouseProvider,
  useMouseContext,
  type MouseProviderProps,
  type MouseContextValue,
  type PressEvent,
  type DragEvent,
  type HoverEvent,
  type PressableHandler,
  type DraggableHandler,
  type HoverableHandler,
} from './MouseProvider.js';
