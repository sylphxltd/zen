import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false, // Disable for now - types come from @zen/signal
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  external: ['@zen/signal'],
});
