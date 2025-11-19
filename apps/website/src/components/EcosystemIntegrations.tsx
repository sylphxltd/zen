import { For, signal } from '@zen/zen';
import { Icon } from './Icon.tsx';

export function EcosystemIntegrations() {
  const activeCategory = signal('css');

  const categories = [
    { id: 'css', name: 'CSS Frameworks', icon: 'lucide:palette' },
    { id: 'icons', name: 'Icon Libraries', icon: 'lucide:sparkles' },
    { id: 'ui', name: 'UI Components', icon: 'lucide:layout' },
    { id: 'tools', name: 'Dev Tools', icon: 'lucide:wrench' },
  ];

  const integrations = {
    css: [
      {
        name: 'Tailwind CSS',
        logo: 'lucide:wind',
        description: 'Most popular utility-first CSS framework',
        setup: `// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {}
  }
}

// Use directly
function Button() {
  return (
    <button class="px-4 py-2 bg-blue-500 text-white rounded">
      Click me
    </button>
  )
}`,
        features: ['Works out of the box', 'Full support', 'JIT mode', 'Custom themes'],
      },
      {
        name: 'Panda CSS',
        logo: 'lucide:square-code',
        description: 'Zero-runtime CSS-in-JS',
        setup: `// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  outdir: 'styled-system'
})

// Usage
import { css } from '../styled-system/css'

function Button() {
  return (
    <button class={css({
      px: 4,
      py: 2,
      bg: 'blue.500',
      color: 'white',
      rounded: 'md'
    })}>
      Click me
    </button>
  )
}`,
        features: ['Zero runtime', 'Type-safe', 'Perfect integration', 'Design tokens'],
      },
      {
        name: 'UnoCSS',
        logo: 'lucide:zap',
        description: 'Instant on-demand atomic CSS engine',
        setup: `// uno.config.ts
import { defineConfig } from 'unocss'

export default defineConfig({
  // Preset configuration
})

// Use directly
function Card() {
  return (
    <div class="p-4 bg-white rounded-lg shadow-md">
      Card content
    </div>
  )
}`,
        features: ['Blazing fast', 'Flexible config', 'Rich presets', 'Plugin ecosystem'],
      },
    ],
    icons: [
      {
        name: 'Iconify',
        logo: 'lucide:target',
        description: '200,000+ icons, unified access',
        setup: `// Install
npm install @iconify/react

// Usage
import { Icon } from '@iconify/react'

function Header() {
  return (
    <div>
      <Icon icon="mdi:home" />
      <Icon icon="heroicons:user" />
      <Icon icon="ph:heart-fill" />
    </div>
  )
}`,
        features: ['200k+ icons', 'On-demand loading', 'SVG optimized', 'Offline support'],
      },
      {
        name: 'Lucide',
        logo: 'lucide:star',
        description: 'Beautiful SVG icon library',
        setup: `// Install
npm install lucide

// Usage
import { Home, User, Heart } from 'lucide'

function Nav() {
  return (
    <nav>
      <Home size={24} />
      <User size={24} />
      <Heart size={24} />
    </nav>
  )
}`,
        features: ['Beautifully designed', 'Small size', 'Easy to customize', 'Tree-shakable'],
      },
      {
        name: 'Phosphor Icons',
        logo: 'lucide:gem',
        description: 'Flexible icon family',
        setup: `// Install
npm install phosphor-icons

// Usage
import { House, User, Heart } from 'phosphor-icons'

function Icons() {
  return (
    <div>
      <House weight="fill" />
      <User weight="duotone" />
      <Heart weight="bold" />
    </div>
  )
}`,
        features: ['Multiple styles', '6 weights', 'Complete set', 'React friendly'],
      },
    ],
    ui: [
      {
        name: 'Build Your Own',
        logo: 'lucide:palette',
        description: 'Build your own UI components with Zen',
        setup: `// Button.tsx
import { signal } from '@zen/zen'

export function Button({ variant = 'primary', children, onClick }) {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600'
  }

  return (
    <button
      class={\`px-4 py-2 rounded text-white \${variants[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
        features: ['Full control', 'Lightweight & flexible', 'No dependencies', 'Easy to maintain'],
      },
      {
        name: 'Headless UI',
        logo: 'lucide:component',
        description: 'Unstyled accessible UI components',
        setup: `// Integrate Headless UI concepts
import { signal, Show } from '@zen/zen'

export function Dropdown({ items }) {
  const isOpen = signal(false)

  return (
    <div class="relative">
      <button onClick={() => isOpen.value = !isOpen.value}>
        Menu
      </button>
      <Show when={() => isOpen.value}>
        <div class="absolute mt-2 bg-white shadow-lg">
          {items.map(item => (
            <a href={item.href}>{item.label}</a>
          ))}
        </div>
      </Show>
    </div>
  )
}`,
        features: ['Accessibility', 'Keyboard navigation', 'Custom styling', 'Full control'],
      },
    ],
    tools: [
      {
        name: 'Vite',
        logo: 'lucide:zap',
        description: 'Lightning-fast dev server',
        setup: `// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@zen/zen'
  }
})`,
        features: ['Instant HMR', 'Lightning fast builds', 'Native ESM', 'Rich plugin ecosystem'],
      },
      {
        name: 'Biome',
        logo: 'lucide:leaf',
        description: 'All-in-one toolchain',
        setup: `// biome.json
{
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true
  }
}

// Single command to format and lint
biome check --apply .`,
        features: ['Formatting', 'Linting', 'Blazing fast', 'Zero config'],
      },
      {
        name: 'TypeScript',
        logo: 'lucide:code',
        description: 'Full type support',
        setup: `// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/zen",
    "strict": true,
    "types": ["@zen/zen"]
  }
}

// Full type inference
const count = signal(0)  // Signal<number>
const doubled = computed(() => count.value * 2)  // Computed<number>`,
        features: ['Type safety', 'IntelliSense', 'Refactoring tools', 'Error checking'],
      },
    ],
  };

  return (
    <section class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">Ecosystem Integrations</h2>
          <p class="text-xl text-text-muted max-w-3xl mx-auto">
            Works perfectly with popular tools, ready out of the box
          </p>
        </div>

        {/* Category tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={categories}>
            {(cat) => (
              <button
                type="button"
                class={
                  activeCategory.value === cat.id
                    ? 'px-6 py-3 bg-primary text-white rounded-zen font-medium transition-all shadow-zen'
                    : 'px-6 py-3 bg-bg-light hover:bg-bg-lighter text-text-muted hover:text-text border border-border rounded-zen font-medium transition-all'
                }
                onClick={() => {
                  activeCategory.value = cat.id;
                }}
              >
                <Icon icon={cat.icon} width="20" height="20" class="mr-2" />
                {cat.name}
              </button>
            )}
          </For>
        </div>

        {/* Integrations grid */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <For each={integrations[activeCategory.value]}>
            {(integration) => (
              <div class="bg-bg-light border border-border rounded-zen overflow-hidden hover:border-primary/50 transition-colors">
                <div class="bg-bg-lighter border-b border-border px-6 py-4">
                  <div class="flex items-center gap-3 mb-2">
                    <Icon icon={integration.logo} width="40" height="40" class="text-primary flex-shrink-0" />
                    <div>
                      <h3 class="text-xl font-bold text-text">{integration.name}</h3>
                      <p class="text-sm text-text-muted">{integration.description}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-3">
                    <For each={integration.features}>
                      {(feature) => (
                        <span class="px-2 py-1 bg-bg border border-border rounded text-xs text-text-muted">
                          ✓ {feature}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
                <div class="p-6">
                  <pre class="text-sm text-text-muted font-mono overflow-x-auto bg-bg border border-border rounded-zen p-4">
                    {integration.setup}
                  </pre>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Bottom message */}
        <div class="mt-12 text-center bg-bg-light border border-border rounded-zen p-8">
          <p class="text-lg text-text mb-2">
            <span class="font-semibold text-primary">Fully compatible with existing ecosystem</span>
          </p>
          <p class="text-text-muted">
            No special configuration needed, works with any JavaScript/TypeScript tool
          </p>
        </div>
      </div>
    </section>
  );
}
