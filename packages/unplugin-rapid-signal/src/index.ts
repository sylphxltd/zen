/**
 * unplugin-rapid-signal
 *
 * Universal plugin for using Rapid Signals across all frameworks with unified syntax.
 *
 * **Runtime Mode (Default):**
 * - Configures custom JSX runtimes/preprocessors
 * - No code transformation needed
 * - Fast builds, easy debugging
 *
 * **Compiler Mode:**
 * - Transforms `signal.value` to framework-specific patterns
 * - Maximum performance (10-30% faster)
 * - Build-time transformations
 */

import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { createUnplugin } from 'unplugin';
import { type Framework, detectFramework } from './auto-detect';
import { getRuntimeConfig } from './runtime-config';
import { transformReact } from './transforms/react';
import { transformSvelte } from './transforms/svelte';
import { transformVue } from './transforms/vue';
import { transformRapid } from './transforms/rapid';

export interface Options {
  /**
   * Target framework
   * @default auto-detected from package.json
   */
  framework?: Framework;

  /**
   * Transformation mode
   * - 'runtime': Use custom JSX runtimes (default, zero config)
   * - 'compiler': Transform code at build time (faster, harder to debug)
   * - 'hybrid': Runtime in dev, compiler in prod
   * @default 'runtime'
   */
  mode?: 'runtime' | 'compiler' | 'hybrid';

  /**
   * Enable auto-detection of framework from package.json
   * @default true
   */
  autoDetect?: boolean;

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
    framework: userFramework,
    mode: userMode = 'runtime',
    autoDetect = true,
    include = defaultInclude,
    exclude = defaultExclude,
    debug = false,
  } = options;

  // Auto-detect framework if not specified
  let framework = userFramework;
  if (!framework && autoDetect) {
    const detected = detectFramework();
    if (detected) {
      framework = detected;
      if (debug) {
      }
    } else {
      if (debug) {
      }
      framework = 'react';
    }
  } else if (!framework) {
    framework = 'react';
  }

  // Determine mode (support hybrid)
  const isDev = process.env.NODE_ENV !== 'production';
  let mode = userMode;
  if (mode === 'hybrid') {
    mode = isDev ? 'runtime' : 'compiler';
    if (debug) {
    }
  }

  // Runtime mode: configure JSX runtime/preprocessor
  if (mode === 'runtime') {
    const runtimeConfig = getRuntimeConfig(framework, debug);

    return {
      name: runtimeConfig.name,

      // Vite-specific configuration
      vite: {
        config() {
          return runtimeConfig.vite?.() || {};
        },
      },

      // Webpack-specific configuration
      webpack(compiler: any) {
        const config = runtimeConfig.webpack?.();
        if (config) {
          // Merge webpack config
          Object.assign(compiler.options, config);
        }
      },

      // Rollup-specific configuration
      rollup: {
        options(options: any) {
          const config = runtimeConfig.rollup?.();
          if (config) {
            Object.assign(options, config);
          }
        },
      },

      // esbuild-specific configuration
      esbuild: {
        setup(build: any) {
          const config = runtimeConfig.esbuild?.();
          if (config) {
            build.initialOptions = {
              ...build.initialOptions,
              ...config,
            };
          }
        },
      },
    };
  }

  // Compiler mode: transform code at build time
  const filter = createFilter(include, exclude);

  return {
    name: 'unplugin-rapid-signal',

    enforce: 'pre',

    transformInclude(id) {
      return filter(id);
    },

    transform(code, id) {
      // Skip if no signal imports detected
      if (!code.includes('@rapid/signal')) {
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
          transformReact(code, s, id, debug);
          break;
        case 'vue':
          transformVue(code, s, id, debug);
          break;
        case 'svelte':
          transformSvelte(code, s, id, debug);
          break;
        case 'rapid':
          transformRapid(code, s, id, debug);
          break;
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

// Export for different bundlers
export const vitePlugin = unplugin.vite;
export const rollupPlugin = unplugin.rollup;
export const webpackPlugin = unplugin.webpack;
export const esbuildPlugin = unplugin.esbuild;

// Default export
export default unplugin;

// Re-export types
export type { Framework } from './auto-detect';
