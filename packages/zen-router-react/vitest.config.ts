import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@sylphx/zen': path.resolve(__dirname, '../zen/src/index.ts'),
      '@sylphx/zen-patterns': path.resolve(__dirname, '../zen-patterns/src/index.ts'),
      '@sylphx/zen-router': path.resolve(__dirname, '../zen-router/src/index.ts'),
    },
  },
});
