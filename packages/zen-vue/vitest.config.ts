import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@sylphx/zen': path.resolve(__dirname, '../zen/src/index.ts'),
    },
  },
});
