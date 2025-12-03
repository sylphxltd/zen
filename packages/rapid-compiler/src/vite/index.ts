/**
 * Vite plugin for Rapid compiler
 */
import type { Plugin } from 'vite';
import { transformRapidJSX } from '../core/transform.js';
import type { CompilerOptions } from '../core/types.js';

export default function zenCompiler(options: CompilerOptions = {}): Plugin {
  return {
    name: 'rapid-compiler',

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
        const result = transformRapidJSX(code, id, options);

        if (!result) {
          return null;
        }

        return {
          code: result.code,
          map: result.map,
        };
      } catch (_error) {
        return null;
      }
    },
  };
}
