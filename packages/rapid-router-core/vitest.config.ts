import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@rapid/signal': path.resolve(__dirname, '../rapid-signal/src/index.ts'),
      '@rapid/signal-extensions/patterns': path.resolve(
        __dirname,
        '../rapid-signal-extensions/patterns/index.ts',
      ),
    },
  },
});
