/**
 * Runtime mode configuration for each framework
 *
 * In runtime mode, the plugin configures the build tool to use
 * custom JSX runtimes or preprocessors that auto-unwrap signals.
 */

import type { Framework } from './auto-detect';

export interface RuntimeConfig {
  name: string;
  vite?: () => any;
  webpack?: () => any;
  rollup?: () => any;
  esbuild?: () => any;
}

type BundlerName = 'Vite' | 'Webpack' | 'Rollup' | 'esbuild';

/**
 * Log runtime configuration (with optional extra messages)
 */
function logRuntime(
  debug: boolean,
  _framework: string,
  _bundler: BundlerName,
  extraMessages?: string[],
): void {
  if (!debug) return;

  if (extraMessages) {
    for (const _msg of extraMessages) {
    }
  }
}

/**
 * Create runtime config with consistent logging
 */
function createRuntimeConfig(
  framework: string,
  debug: boolean,
  configs: {
    vite?: { config?: any; logs?: string[] };
    webpack?: { config?: any; logs?: string[] };
    rollup?: { config?: any; logs?: string[] };
    esbuild?: { config?: any; logs?: string[] };
  },
): RuntimeConfig {
  return {
    name: `rapid-signal-runtime:${framework}`,

    vite() {
      logRuntime(debug, framework, 'Vite', configs.vite?.logs);
      return configs.vite?.config ?? {};
    },

    webpack() {
      logRuntime(debug, framework, 'Webpack', configs.webpack?.logs);
      return configs.webpack?.config ?? {};
    },

    rollup() {
      logRuntime(debug, framework, 'Rollup', configs.rollup?.logs);
      return configs.rollup?.config ?? {};
    },

    esbuild() {
      logRuntime(debug, framework, 'esbuild', configs.esbuild?.logs);
      return configs.esbuild?.config ?? {};
    },
  };
}

/**
 * Get runtime configuration for a framework
 */
export function getRuntimeConfig(framework: Framework, debug: boolean): RuntimeConfig {
  switch (framework) {
    case 'react':
      return getReactRuntimeConfig(debug);
    case 'vue':
      return getVueRuntimeConfig(debug);
    case 'svelte':
      return getSvelteRuntimeConfig(debug);
    case 'rapid':
      return getZenRuntimeConfig(debug);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

/**
 * React runtime configuration
 * Sets up custom JSX runtime
 */
function getReactRuntimeConfig(debug: boolean): RuntimeConfig {
  const jsxImportSource = 'unplugin-rapid-signal/jsx-runtime/react';

  return createRuntimeConfig('react', debug, {
    vite: {
      config: {
        esbuild: { jsxImportSource },
      },
    },
    webpack: {
      config: {
        module: {
          rules: [
            {
              test: /\.[jt]sx?$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    [
                      '@babel/preset-react',
                      {
                        runtime: 'automatic',
                        importSource: jsxImportSource,
                      },
                    ],
                  ],
                },
              },
            },
          ],
        },
      },
    },
    rollup: {
      config: {
        esbuild: { jsxImportSource },
      },
    },
    esbuild: {
      config: { jsxImportSource },
    },
  });
}

/**
 * Vue runtime configuration
 * Templates work natively, JSX needs alias
 */
function getVueRuntimeConfig(debug: boolean): RuntimeConfig {
  return createRuntimeConfig('vue', debug, {
    vite: {
      logs: ['Vue templates work natively, no config needed'],
      config: {
        resolve: {
          alias: {
            // Only alias for JSX usage (optional)
            // Templates work without this
          },
        },
      },
    },
  });
}

/**
 * Svelte runtime configuration
 * Injects preprocessor
 */
function getSvelteRuntimeConfig(debug: boolean): RuntimeConfig {
  const preprocessorNote = 'Note: Svelte preprocessor should be added to svelte.config.js';

  return createRuntimeConfig('svelte', debug, {
    vite: { logs: [preprocessorNote] },
    webpack: { logs: [preprocessorNote] },
    rollup: { logs: [preprocessorNote] },
    esbuild: { logs: [preprocessorNote] },
  });
}

/**
 * Rapid runtime configuration
 * Native support, no configuration needed
 */
function getZenRuntimeConfig(debug: boolean): RuntimeConfig {
  return createRuntimeConfig('rapid', debug, {
    vite: {
      logs: ['Rapid framework has native signal support', 'No runtime configuration needed'],
    },
    webpack: {
      logs: ['Rapid framework has native signal support'],
    },
    rollup: {
      logs: ['Rapid framework has native signal support'],
    },
    esbuild: {
      logs: ['Rapid framework has native signal support'],
    },
  });
}
