/**
 * Render Context
 *
 * Internal context for tracking render settings (fullscreen, mouse, etc.)
 * Used by FullscreenLayout and MouseProvider to communicate with renderer.
 */

import { createContext, signal, useContext } from '@zen/runtime';

export interface RenderSettings {
  /** Whether fullscreen mode is active */
  fullscreen: ReturnType<typeof signal<boolean>>;
  /** Whether mouse tracking is enabled */
  mouse: ReturnType<typeof signal<boolean>>;
}

const RenderSettingsContext = createContext<RenderSettings | null>(null);

/**
 * Internal provider - created automatically by render()
 */
export function RenderSettingsProvider(props: { children: unknown }): unknown {
  const settings: RenderSettings = {
    fullscreen: signal(false),
    mouse: signal(false),
  };

  return RenderSettingsContext.Provider({
    value: settings,
    get children() {
      return props.children;
    },
  });
}

/**
 * Internal hook to access render settings
 */
export function useRenderSettings(): RenderSettings | null {
  return useContext(RenderSettingsContext);
}

/**
 * Get global render settings (for renderer to read)
 */
let globalSettings: RenderSettings | null = null;

export function setGlobalRenderSettings(settings: RenderSettings | null): void {
  globalSettings = settings;
}

export function getGlobalRenderSettings(): RenderSettings | null {
  return globalSettings;
}
