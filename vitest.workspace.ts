import path from 'node:path';
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'zen-craft',
      root: './packages/zen-craft',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'zen-patterns',
      root: './packages/zen-patterns',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'zen-router',
      root: './packages/zen-router',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
        '@sylphx/zen-patterns': path.resolve(__dirname, './packages/zen-patterns/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'zen-persistent',
      root: './packages/zen-persistent',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
        '@sylphx/zen-patterns': path.resolve(__dirname, './packages/zen-patterns/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'zen-vue',
      root: './packages/zen-vue',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'zen-router-react',
      root: './packages/zen-router-react',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/zen': path.resolve(__dirname, './packages/zen/src/index.ts'),
        '@sylphx/zen-patterns': path.resolve(__dirname, './packages/zen-patterns/src/index.ts'),
        '@sylphx/zen-router': path.resolve(__dirname, './packages/zen-router/src/index.ts'),
      },
    },
  },
]);
