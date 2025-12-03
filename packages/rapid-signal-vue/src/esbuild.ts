/**
 * esbuild plugin for @rapid/signal-vue
 *
 * Re-exports unplugin-rapid-signal with Vue preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * esbuild plugin for Rapid Signals in Vue
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.esbuild({ framework: 'vue', ...options });

export default zenSignal;
