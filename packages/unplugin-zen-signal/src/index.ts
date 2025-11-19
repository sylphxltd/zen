/**
 * unplugin-zen-signal
 *
 * Universal plugin for using Zen Signals across all frameworks with unified syntax.
 * Transforms `signal.value` accesses to framework-specific reactive patterns at compile time.
 */

import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { createUnplugin } from 'unplugin';
import { transformReact } from './transforms/react';
import { transformSvelte } from './transforms/svelte';
import { transformVue } from './transforms/vue';

export interface Options {
  /**
   * Target framework
   * @default 'react'
   */
  framework?: 'react' | 'vue' | 'svelte' | 'solid' | 'preact';

  /**
   * Include patterns (default: all .tsx, .jsx, .vue, .svelte files)
   */
  include?: string | RegExp | (string | RegExp)[];

  /**
   * Exclude patterns (default: node_modules)
   */
  exclude?: string | RegExp | (string | RegExp)[];

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

const defaultInclude = [/\.[jt]sx?$/, /\.vue$/, /\.svelte$/];
const defaultExclude = [/node_modules/];

export const unplugin = createUnplugin<Options>((options = {}) => {
  const {
    framework = 'react',
    include = defaultInclude,
    exclude = defaultExclude,
    debug = false,
  } = options;

  const filter = createFilter(include, exclude);

  return {
    name: 'unplugin-zen-signal',

    enforce: 'pre',

    transformInclude(id) {
      return filter(id);
    },

    transform(code, id) {
      // Skip if no signal imports detected
      if (!code.includes('@zen/signal')) {
        return null;
      }

      // Skip if no .value access detected
      if (!code.includes('.value')) {
        return null;
      }

      if (debug) {
      }

      const s = new MagicString(code);
      // Apply framework-specific transformation
      switch (framework) {
        case 'react':
        case 'preact':
          transformReact(code, s, id, debug);
          break;
        case 'vue':
          transformVue(code, s, id, debug);
          break;
        case 'svelte':
          transformSvelte(code, s, id, debug);
          break;
        case 'solid':
          // Solid.js signals work natively, no transformation needed
          return null;
        default:
          throw new Error(`Unsupported framework: ${framework}`);
      }

      if (!s.hasChanged()) {
        return null;
      }

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true, source: id }),
      };
    },
  };
});

export const vitePlugin = unplugin.vite;
export const rollupPlugin = unplugin.rollup;
export const webpackPlugin = unplugin.webpack;
export const esbuildPlugin = unplugin.esbuild;
