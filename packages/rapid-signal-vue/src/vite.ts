/**
 * Vite plugin for @rapid/signal-vue
 *
 * Re-exports unplugin-rapid-signal with Vue preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Vite plugin for Rapid Signals in Vue
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@rapid/signal-vue/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'vue', ...options });

export default zenSignal;
