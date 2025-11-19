import zenCompiler from '@zen/compiler';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    zenCompiler(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      defaultClass: 'icon',
    }),
  ],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@zen/zen',
  },
});
