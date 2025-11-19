import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
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
