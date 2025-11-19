import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite/index.ts',
  },
  format: ['esm'],
  dts: false, // Disable for now
  clean: true,
  minify: false, // Keep readable for debugging
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  external: ['vite', '@babel/core', '@babel/traverse', '@babel/types'],
});
