import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@zen/signal': path.resolve(__dirname, '../zen/src/index.ts'),
    },
  },
});
