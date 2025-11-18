import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.bench.ts',
        'src/test.ts', // Manual test file
        'src/index.ts', // Just exports
      ],
    },
  },
  resolve: {
    alias: {
      '@zen/signal': path.resolve(__dirname, '../zen/src/index.ts'),
    },
  },
});
