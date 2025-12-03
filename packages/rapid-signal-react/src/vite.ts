/**
 * Vite plugin for @rapid/signal-react
 *
 * Re-exports unplugin-rapid-signal with React preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Vite plugin for Rapid Signals in React
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@rapid/signal-react/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'react', ...options });

export default zenSignal;
