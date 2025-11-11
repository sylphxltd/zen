import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Zen',
  description: 'Tiny, fast, and elegant reactive state management',
  base: '/',
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/core' },
      { text: 'Examples', link: '/examples/counter' },
      {
        text: 'Ecosystem',
        items: [
          { text: 'Router', link: '/ecosystem/router' },
          { text: 'Persistence', link: '/ecosystem/persistent' },
          { text: 'Craft', link: '/ecosystem/craft' },
        ],
      },
      {
        text: 'v2.0.0',
        items: [
          { text: 'Changelog', link: '/guide/changelog' },
          { text: 'Migration Guide', link: '/guide/migration' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Zen?', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Performance', link: '/guide/performance' },
          ],
        },
        {
          text: 'Framework Integration',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'Vue', link: '/guide/vue' },
            { text: 'Svelte', link: '/guide/svelte' },
            { text: 'Solid', link: '/guide/solid' },
            { text: 'Preact', link: '/guide/preact' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Computed Values', link: '/guide/computed' },
            { text: 'Async Operations', link: '/guide/async' },
            { text: 'Map Stores', link: '/guide/maps' },
            { text: 'Batching Updates', link: '/guide/batching' },
          ],
        },
        {
          text: 'Other',
          items: [
            { text: 'Migration from v1', link: '/guide/migration' },
            { text: 'Changelog', link: '/guide/changelog' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'Computed', link: '/api/computed' },
            { text: 'Map Store', link: '/api/map' },
            { text: 'Utilities', link: '/api/utilities' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Counter', link: '/examples/counter' },
            { text: 'Todo List', link: '/examples/todo' },
            { text: 'Form Handling', link: '/examples/form' },
            { text: 'Data Fetching', link: '/examples/fetching' },
          ],
        },
      ],
      '/ecosystem/': [
        {
          text: 'Ecosystem',
          items: [
            { text: 'Router', link: '/ecosystem/router' },
            { text: 'Persistence', link: '/ecosystem/persistent' },
            { text: 'Craft (Immutable)', link: '/ecosystem/craft' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sylphxltd/zen' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present SylphX',
    },

    search: {
      provider: 'local',
    },
  },
});
