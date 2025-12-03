/**
 * Webpack plugin for @rapid/signal-react
 *
 * Re-exports unplugin-rapid-signal with React preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Webpack plugin for Rapid Signals in React
 *
 * @example
 * ```ts
 * // webpack.config.js
 * const { zenSignal } = require('@rapid/signal-react/webpack');
 *
 * module.exports = {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.webpack({ framework: 'react', ...options });

export default zenSignal;
