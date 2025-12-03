/**
 * esbuild plugin for @rapid/signal-react
 *
 * Re-exports unplugin-rapid-signal with React preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * esbuild plugin for Rapid Signals in React
 *
 * @example
 * ```ts
 * // esbuild.config.js
 * import { zenSignal } from '@rapid/signal-react/esbuild';
 *
 * build({
 *   plugins: [zenSignal()]
 * });
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.esbuild({ framework: 'react', ...options });

export default zenSignal;
