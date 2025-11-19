/**
 * Vite plugin for Zen compiler
 */
import type { Plugin } from 'vite';
import type { CompilerOptions } from '../core/types.js';
import { transformZenJSX } from '../core/transform.js';

export default function zenCompiler(options: CompilerOptions = {}): Plugin {
  return {
    name: 'zen-compiler',

    enforce: 'pre',

    async transform(code: string, id: string) {
      // Only process TSX/JSX files
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null;
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return null;
      }

      try {
        const result = transformZenJSX(code, id, options);

        if (!result) {
          return null;
        }

        return {
          code: result.code,
          map: result.map,
        };
      } catch (error) {
        // Log error but don't fail the build
        console.error(`[zen-compiler] Error transforming ${id}:`, error);
        return null;
      }
    },
  };
}
