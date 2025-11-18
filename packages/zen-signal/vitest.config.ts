import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    benchmark: {
      include: ['src/**/*.bench.ts'],
    },
  },
});
