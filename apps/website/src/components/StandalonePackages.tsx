import { For } from '@rapid/web';
import { Icon } from './Icon.tsx';

export function StandalonePackages() {
  const packages = [
    {
      name: '@rapid/signal',
      size: '1.75 KB',
      description: 'Ultra-lightweight reactive primitives',
      features: [
        'Use in any framework (React, Vue, Svelte, Solid)',
        'Works in vanilla JS projects',
        '150M+ operations/second',
        'Automatic dependency tracking',
        'Zero dependencies',
      ],
      integrations: [
        { name: 'React', pkg: '@rapid/signal-react', icon: 'lucide:atom' },
        { name: 'Vue', pkg: '@rapid/signal-vue', icon: 'lucide:triangle' },
        { name: 'Svelte', pkg: '@rapid/signal-svelte', icon: 'lucide:flame' },
        { name: 'Solid', pkg: '@rapid/signal-solid', icon: 'lucide:box' },
        { name: 'Preact', pkg: '@rapid/signal-preact', icon: 'lucide:zap' },
      ],
      example: `// Vanilla JS
import { signal, computed, effect } from '@rapid/signal'

const count = signal(0)
const doubled = computed(() => count.value * 2)

effect(() => {
  console.log('Count:', count.value)
})

count.value++ // Logs: "Count: 1"`,
    },
    {
      name: '@rapid/router',
      size: '<3 KB',
      description: 'Lightweight routing solution',
      features: [
        'Framework-agnostic, works in any project',
        'Supports dynamic route parameters',
        'Hash or History mode',
        'TypeScript type-safe',
        'Simple and easy to use',
      ],
      integrations: [
        { name: 'Rapid', pkg: '@rapid/web', icon: 'lucide:zap' },
        { name: 'React', pkg: 'react-router', icon: 'lucide:atom' },
        { name: 'Vue', pkg: 'vue-router', icon: 'lucide:triangle' },
        { name: 'Vanilla', pkg: '@rapid/router', icon: 'lucide:package' },
      ],
      example: `// Works in any project
import { createRouter } from '@rapid/router'

const router = createRouter({
  '/': () => renderHome(),
  '/about': () => renderAbout(),
  '/users/:id': ({ params }) => renderUser(params.id),
  '*': () => render404()
})

router.navigate('/users/123')`,
    },
    {
      name: '@rapid/signal-patterns',
      size: '<2 KB',
      description: 'Common state management patterns',
      features: [
        'Store (like Redux/Zustand)',
        'Async Signal (handle async state)',
        'Computed Map (batch computations)',
        'Signal Array/Map (reactive collections)',
        'Ready-to-use pattern library',
      ],
      integrations: [],
      example: `// Create a Store
import { createStore } from '@rapid/signal-patterns'

const useStore = createStore({
  count: 0,
  user: null,

  increment() {
    this.count++
  },

  async login(credentials) {
    const user = await api.login(credentials)
    this.user = user
  }
})

// Use anywhere
const store = useStore()
store.increment()`,
    },
    {
      name: '@rapid/signal-persistent',
      size: '<1 KB',
      description: 'Persistent signals',
      features: [
        'Auto-sync to localStorage',
        'Supports sessionStorage',
        'Customizable storage backend',
        'Type-safe serialization',
        'Cross-tab synchronization',
      ],
      integrations: [],
      example: `// Auto-persistence
import { persistentSignal } from '@rapid/signal-persistent'

const theme = persistentSignal('theme', 'dark')
const settings = persistentSignal('settings', {
  language: 'en',
  notifications: true
})

// Auto-saves to localStorage
theme.value = 'light'
settings.value.language = 'en'`,
    },
    {
      name: '@rapid/tui',
      size: '<8 KB',
      description: 'Terminal UI with fine-grained reactivity',
      features: [
        'Ink-like API for terminal apps',
        'Same reactive model as web',
        'Flexbox layout (Yoga engine)',
        'Rich component library',
        'Mouse & keyboard support',
      ],
      integrations: [
        { name: 'Box', pkg: 'layout', icon: 'lucide:square' },
        { name: 'Text', pkg: 'primitives', icon: 'lucide:type' },
        { name: 'Input', pkg: 'forms', icon: 'lucide:text-cursor' },
        { name: 'Spinner', pkg: 'feedback', icon: 'lucide:loader' },
      ],
      example: `// Terminal UI app
import { signal } from '@rapid/signal'
import { render, Box, Text, TextInput } from '@rapid/tui'

function App() {
  const name = signal('')

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Welcome!</Text>
      <TextInput
        value={name}
        placeholder="Your name..."
        onChange={v => name.value = v}
      />
      <Text color="green">
        Hello, {() => name.value || 'stranger'}!
      </Text>
    </Box>
  )
}

render(<App />)`,
    },
  ];

  return (
    <section class="py-16 px-0 bg-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">Standalone Packages</h2>
          <p class="text-xl text-text-muted max-w-3xl mx-auto">
            You don't need to use the entire framework, use any package independently
            <br />
            <span class="text-primary font-medium">
              Works in React/Vue/Svelte/Solid or any project
            </span>
          </p>
        </div>

        <div class="space-y-12">
          <For each={packages}>
            {(pkg) => (
              <div class="bg-bg border border-border rounded-rapid overflow-hidden">
                {/* Package header */}
                <div class="bg-bg-lighter border-b border-border px-8 py-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-2xl font-bold text-primary mb-2">{pkg.name}</h3>
                      <p class="text-lg text-text-muted">{pkg.description}</p>
                    </div>
                    <div class="px-4 py-2 bg-success/20 text-success rounded-rapid font-bold text-lg">
                      {pkg.size}
                    </div>
                  </div>

                  {/* Framework integrations */}
                  {pkg.integrations.length > 0 && (
                    <div class="flex flex-wrap gap-2">
                      <span class="text-sm text-text-muted mr-2">Works with:</span>
                      <For each={pkg.integrations}>
                        {(integration) => (
                          <span class="px-3 py-1 bg-bg border border-border rounded-full text-sm text-text flex items-center gap-2">
                            <Icon
                              icon={integration.icon}
                              width="16"
                              height="16"
                              class="text-primary"
                            />
                            {integration.name}
                          </span>
                        )}
                      </For>
                    </div>
                  )}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Features */}
                  <div class="p-8 border-b lg:border-b-0 lg:border-r border-border">
                    <h4 class="text-lg font-semibold text-text mb-4">Features</h4>
                    <ul class="space-y-3">
                      <For each={pkg.features}>
                        {(feature) => (
                          <li class="flex items-start gap-2 text-text-muted">
                            <span class="text-success mt-1">✓</span>
                            <span>{feature}</span>
                          </li>
                        )}
                      </For>
                    </ul>

                    <div class="mt-6">
                      <code class="px-3 py-1 bg-bg-lighter border border-border rounded text-sm text-primary font-mono">
                        npm install {pkg.name}
                      </code>
                    </div>
                  </div>

                  {/* Example */}
                  <div class="p-8 bg-bg-lighter">
                    <h4 class="text-lg font-semibold text-text mb-4">Usage Example</h4>
                    <pre class="text-sm text-text-muted font-mono overflow-x-auto">
                      {pkg.example}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* CTA */}
        <div class="mt-12 text-center">
          <p class="text-lg text-text-muted mb-6">
            All packages can be used independently, no need to migrate your entire project
          </p>
          <a
            href="/docs/packages"
            class="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-rapid shadow-rapid transition-all hover:scale-105"
          >
            View Full Package Documentation →
          </a>
        </div>
      </div>
    </section>
  );
}
