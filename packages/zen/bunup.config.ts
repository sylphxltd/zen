import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/index.ts', 'src/advanced.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  target: 'node',
  minify: true,
});
