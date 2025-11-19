import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'jsx-runtime': 'src/jsx-runtime.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  minify: false,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  external: ['@zen/runtime', '@zen/signal', 'chalk', 'cli-boxes', 'string-width', 'strip-ansi'],
});
