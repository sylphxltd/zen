import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'jsx-runtime': 'src/jsx-runtime.ts',
    'jsx-runtime-server': 'src/jsx-runtime-server.ts',
    server: 'src/server.ts',
    hydrate: 'src/hydrate.ts',
  },
  format: ['esm'],
  dts: false, // Disable for now
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  external: ['@zen/runtime', '@zen/signal'],
});
