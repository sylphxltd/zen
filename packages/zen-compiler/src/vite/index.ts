/**
 * Vite plugin for Zen compiler
 */
import type { Plugin } from 'vite';
import type { CompilerOptions } from '../core/types.js';

export default function zenCompiler(_options: CompilerOptions = {}): Plugin {
  return {
    name: 'zen-compiler',

    enforce: 'pre',

    async transform(code: string, id: string) {
      // Only process TSX/JSX files
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null;
      }

      // TODO: Implement JSX transformation
      // 1. Parse JSX with Babel
      // 2. Transform lazy children
      // 3. Transform signal unwrap
      // 4. Generate code

      return {
        code,
        map: null,
      };
    },
  };
}
