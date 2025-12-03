/**
 * CrossPlatform Section
 *
 * Showcases Rapid's unique cross-platform capabilities:
 * - Same reactive primitives across web and terminal
 * - @rapid/web for browser DOM
 * - @rapid/tui for terminal UI
 * - Shared @rapid/runtime components (Show, For, Switch, Context)
 */

import { computed, signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from './Icon.tsx';

export function CrossPlatform() {
  const activeTab = signal<'web' | 'tui' | 'shared'>('web');

  const platforms = [
    {
      id: 'web' as const,
      name: 'Web',
      icon: 'lucide:globe',
      package: '@rapid/web',
      size: '<5 KB',
      description: 'Fine-grained DOM rendering',
    },
    {
      id: 'tui' as const,
      name: 'Terminal',
      icon: 'lucide:terminal',
      package: '@rapid/tui',
      size: '<8 KB',
      description: 'Ink-like TUI with signals',
    },
    {
      id: 'shared' as const,
      name: 'Shared',
      icon: 'lucide:share-2',
      package: '@rapid/runtime',
      size: '<2 KB',
      description: 'Platform-agnostic components',
    },
  ];

  const codeExamples = {
    web: {
      title: 'Browser DOM Rendering',
      description: 'Fine-grained updates directly to the DOM. No Virtual DOM overhead.',
      code: `import { signal, computed } from '@rapid/signal'
import { render, Show, For } from '@rapid/web'

function App() {
  const todos = signal([
    { id: 1, text: 'Learn Rapid', done: true },
    { id: 2, text: 'Build app', done: false },
  ])

  const remaining = computed(() =>
    todos.value.filter(t => !t.done).length
  )

  return (
    <div>
      <h1>Todos ({remaining} remaining)</h1>
      <For each={todos.value}>
        {todo => (
          <div class={todo.done ? 'done' : ''}>
            {todo.text}
          </div>
        )}
      </For>
    </div>
  )
}

render(() => <App />, document.body)`,
      features: [
        'Direct DOM manipulation',
        'No reconciliation overhead',
        'SSR + Hydration support',
        'Event delegation',
      ],
    },
    tui: {
      title: 'Terminal UI Rendering',
      description: 'Build beautiful CLI apps with the same reactive model. Like Ink, but faster.',
      code: `import { signal, computed } from '@rapid/signal'
import { render, Box, Text, TextInput } from '@rapid/tui'

function App() {
  const name = signal('')
  const greeting = computed(() =>
    name.value ? \`Hello, \${name.value}!\` : 'Enter your name...'
  )

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Welcome to Rapid TUI</Text>

      <Box marginY={1}>
        <Text>Name: </Text>
        <TextInput
          value={name}
          onChange={v => name.value = v}
        />
      </Box>

      <Text color="green">{greeting}</Text>
    </Box>
  )
}

render(<App />)`,
      features: [
        'Flexbox layout (Yoga)',
        'Mouse & keyboard input',
        'Focus management',
        'Styled text & borders',
      ],
    },
    shared: {
      title: 'Shared Components',
      description: 'Write once, run on both platforms. Same API, different renderers.',
      code: `// These components work on BOTH web and terminal!
import { Show, For, Switch, Match } from '@rapid/runtime'
import { createContext, useContext } from '@rapid/runtime'

// Conditional rendering
<Show when={isLoggedIn} fallback={<Login />}>
  <Dashboard />
</Show>

// List rendering with keyed updates
<For each={items} key={item => item.id}>
  {item => <Item data={item} />}
</For>

// Pattern matching
<Switch>
  <Match when={status === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status === 'error'}>
    <Error message={error} />
  </Match>
  <Match when={status === 'success'}>
    <Content data={data} />
  </Match>
</Switch>

// Context for dependency injection
const ThemeContext = createContext('light')

<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>`,
      features: [
        'Show / For / Switch',
        'Context API',
        'Suspense & ErrorBoundary',
        'Same code, any platform',
      ],
    },
  };

  const currentExample = computed(() => codeExamples[activeTab.value]);

  return (
    <section class="py-20 px-0 bg-gradient-to-b from-bg to-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary font-medium mb-6">
            <Icon icon="lucide:layers" width="20" height="20" />
            <span>Cross-Platform</span>
          </div>
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">
            One Framework,{' '}
            <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Multiple Platforms
            </span>
          </h2>
          <p class="text-xl text-text-muted max-w-3xl mx-auto">
            The same reactive primitives power both browser and terminal applications.
            <br />
            Write components once, deploy anywhere.
          </p>
        </div>

        {/* Platform Architecture Diagram */}
        <div class="bg-bg-light border border-border rounded-rapid p-8 mb-12">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Signal Core */}
            <div class="md:col-span-3 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-rapid p-6 text-center">
              <div class="flex items-center justify-center gap-3 mb-2">
                <Icon icon="lucide:atom" width="28" height="28" class="text-primary" />
                <span class="text-xl font-bold text-text">@rapid/signal-core</span>
                <span class="px-2 py-0.5 bg-success/20 text-success text-sm rounded font-medium">
                  1.75 KB
                </span>
              </div>
              <p class="text-text-muted">Pure reactive primitives: signal, computed, effect</p>
            </div>

            {/* Runtime */}
            <div class="md:col-span-3 bg-bg border border-border rounded-rapid p-6 text-center">
              <div class="flex items-center justify-center gap-3 mb-2">
                <Icon icon="lucide:box" width="24" height="24" class="text-secondary" />
                <span class="text-lg font-bold text-text">@rapid/runtime</span>
                <span class="px-2 py-0.5 bg-secondary/20 text-secondary text-sm rounded font-medium">
                  &lt;2 KB
                </span>
              </div>
              <p class="text-text-muted text-sm">
                Platform-agnostic: Show, For, Switch, Context, Suspense
              </p>
            </div>

            {/* Renderers */}
            <For each={platforms.filter((p) => p.id !== 'shared')}>
              {(platform) => (
                <div
                  class={`bg-bg border rounded-rapid p-6 text-center cursor-pointer transition-all ${
                    activeTab.value === platform.id
                      ? 'border-primary shadow-rapid'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    activeTab.value = platform.id;
                  }}
                >
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <Icon icon={platform.icon} width="24" height="24" class="text-primary" />
                    <span class="text-lg font-bold text-text">{platform.package}</span>
                  </div>
                  <span class="px-2 py-0.5 bg-success/20 text-success text-sm rounded font-medium">
                    {platform.size}
                  </span>
                  <p class="text-text-muted text-sm mt-2">{platform.description}</p>
                </div>
              )}
            </For>

            {/* Future: Native */}
            <div class="bg-bg border border-dashed border-border rounded-rapid p-6 text-center opacity-60">
              <div class="flex items-center justify-center gap-2 mb-2">
                <Icon icon="lucide:smartphone" width="24" height="24" class="text-text-muted" />
                <span class="text-lg font-bold text-text-muted">@rapid/native</span>
              </div>
              <span class="px-2 py-0.5 bg-bg-lighter text-text-muted text-sm rounded font-medium">
                Coming Soon
              </span>
              <p class="text-text-muted text-sm mt-2">React Native alternative</p>
            </div>
          </div>
        </div>

        {/* Platform Tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={platforms}>
            {(platform) => (
              <button
                type="button"
                class={
                  activeTab.value === platform.id
                    ? 'px-6 py-3 bg-primary text-white rounded-rapid font-medium transition-all shadow-rapid flex items-center gap-2'
                    : 'px-6 py-3 bg-bg-light hover:bg-bg-lighter text-text-muted hover:text-text border border-border rounded-rapid font-medium transition-all flex items-center gap-2'
                }
                onClick={() => {
                  activeTab.value = platform.id;
                }}
              >
                <Icon icon={platform.icon} width="20" height="20" />
                {platform.name}
              </button>
            )}
          </For>
        </div>

        {/* Code Example */}
        <div class="bg-bg-light border border-border rounded-rapid overflow-hidden">
          <div class="bg-bg-lighter border-b border-border px-6 py-4">
            <h3 class="text-xl font-bold text-text mb-1">{() => currentExample.value.title}</h3>
            <p class="text-text-muted">{() => currentExample.value.description}</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Code */}
            <div class="lg:col-span-2 p-6 bg-[#1e1e2e] overflow-x-auto">
              <pre class="text-sm font-mono text-[#cdd6f4]">{() => currentExample.value.code}</pre>
            </div>

            {/* Features */}
            <div class="p-6 border-t lg:border-t-0 lg:border-l border-border">
              <h4 class="text-lg font-semibold text-text mb-4">Features</h4>
              <ul class="space-y-3">
                <For each={computed(() => currentExample.value.features)}>
                  {(feature) => (
                    <li class="flex items-start gap-2 text-text-muted">
                      <Icon
                        icon="lucide:check"
                        width="20"
                        height="20"
                        class="text-success flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  )}
                </For>
              </ul>

              <div class="mt-6 pt-6 border-t border-border">
                <Show when={computed(() => activeTab.value === 'tui')}>
                  <a
                    href="/docs/tui"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-rapid transition-all"
                  >
                    <Icon icon="lucide:terminal" width="18" height="18" />
                    TUI Documentation
                  </a>
                </Show>
                <Show when={computed(() => activeTab.value === 'web')}>
                  <a
                    href="/docs"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-rapid transition-all"
                  >
                    <Icon icon="lucide:book-open" width="18" height="18" />
                    Web Documentation
                  </a>
                </Show>
                <Show when={computed(() => activeTab.value === 'shared')}>
                  <a
                    href="/docs/components"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-rapid transition-all"
                  >
                    <Icon icon="lucide:component" width="18" height="18" />
                    Component Reference
                  </a>
                </Show>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div class="bg-bg border border-border rounded-rapid p-6 text-center">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:repeat" width="24" height="24" class="text-primary" />
            </div>
            <h4 class="text-lg font-semibold text-text mb-2">Code Reuse</h4>
            <p class="text-text-muted text-sm">
              Share business logic between web and CLI applications
            </p>
          </div>

          <div class="bg-bg border border-border rounded-rapid p-6 text-center">
            <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:brain" width="24" height="24" class="text-secondary" />
            </div>
            <h4 class="text-lg font-semibold text-text mb-2">One Mental Model</h4>
            <p class="text-text-muted text-sm">
              Learn once, apply everywhere. Same patterns across platforms
            </p>
          </div>

          <div class="bg-bg border border-border rounded-rapid p-6 text-center">
            <div class="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:gauge" width="24" height="24" class="text-success" />
            </div>
            <h4 class="text-lg font-semibold text-text mb-2">Consistent Performance</h4>
            <p class="text-text-muted text-sm">
              Fine-grained reactivity delivers optimal updates on any platform
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
