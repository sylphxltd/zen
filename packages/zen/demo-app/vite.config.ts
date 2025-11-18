import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'zenjs',
  },
  resolve: {
    alias: [
      {
        find: /^zenjs\/jsx-dev-runtime$/,
        replacement: resolve(__dirname, '../src/jsx-runtime.ts'),
      },
      { find: /^zenjs\/jsx-runtime$/, replacement: resolve(__dirname, '../src/jsx-runtime.ts') },
      { find: /^zenjs$/, replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
});
