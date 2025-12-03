import { For, Show, computed, signal } from '@rapid/web';
import { Icon } from '../components/Icon.tsx';

export function Docs() {
  const activeSection = signal('intro');

  const showIntro = computed(() => activeSection.value === 'intro');
  const showSignal = computed(() => activeSection.value === 'signal');
  const showFramework = computed(() => activeSection.value === 'framework');
  const showComponents = computed(() => activeSection.value === 'components');
  const showPatterns = computed(() => activeSection.value === 'patterns');
  const showIntegrations = computed(() => activeSection.value === 'integrations');

  const sections = [
    { id: 'intro', title: 'Introduction', icon: 'lucide:book-open' },
    { id: 'signal', title: '@rapid/signal', icon: 'lucide:zap' },
    { id: 'framework', title: '@rapid/web', icon: 'lucide:globe' },
    { id: 'components', title: 'Components', icon: 'lucide:layout' },
    { id: 'patterns', title: 'Patterns', icon: 'lucide:lightbulb' },
    { id: 'integrations', title: 'Integrations', icon: 'lucide:plug' },
  ];

  return (
    <div class="min-h-screen bg-bg">
      <div class="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Sidebar */}
        <aside class="hidden md:block w-64 flex-shrink-0">
          <div class="sticky top-24">
            <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Documentation
            </h3>
            <nav class="space-y-1">
              <For each={sections}>
                {(section) => (
                  <button
                    type="button"
                    class={
                      activeSection.value === section.id
                        ? 'w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-white rounded-xl font-medium transition-all'
                        : 'w-full flex items-center gap-3 px-4 py-2.5 text-text-muted hover:text-text hover:bg-bg-lighter rounded-xl transition-all'
                    }
                    onClick={() => {
                      activeSection.value = section.id;
                    }}
                  >
                    <Icon icon={section.icon} width="18" height="18" />
                    {section.title}
                  </button>
                )}
              </For>
            </nav>

            {/* Quick Links */}
            <div class="mt-8 pt-8 border-t border-border">
              <h4 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                Resources
              </h4>
              <div class="space-y-2">
                <a
                  href="/playground"
                  class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:play" width="16" height="16" />
                  Playground
                </a>
                <a
                  href="/examples"
                  class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:code" width="16" height="16" />
                  Examples
                </a>
                <a
                  href="https://github.com/SylphxAI/rapid"
                  target="_blank"
                  rel="noreferrer"
                  class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:github" width="16" height="16" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main class="flex-1 min-w-0">
          {/* Mobile navigation */}
          <div class="md:hidden mb-8">
            <select
              class="w-full px-4 py-3 bg-bg-light border border-border rounded-xl text-text"
              onChange={(e) => {
                activeSection.value = (e.target as HTMLSelectElement).value;
              }}
            >
              <For each={sections}>
                {(section) => <option value={section.id}>{section.title}</option>}
              </For>
            </select>
          </div>

          <Show when={showIntro}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Getting Started</span>
                <h1 class="heading-2 text-text mb-4">Introduction to Rapid</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Rapid is a modern reactive ecosystem with two core packages:{' '}
                  <strong class="text-text">@rapid/signal</strong> for reactive primitives and{' '}
                  <strong class="text-text">@rapid/web</strong> for fine-grained rendering.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div class="p-4 bg-bg-lighter rounded-xl border border-border">
                  <div class="text-3xl font-bold text-primary mb-1">1.75 KB</div>
                  <div class="text-sm text-text-muted">Signal Core Size</div>
                </div>
                <div class="p-4 bg-bg-lighter rounded-xl border border-border">
                  <div class="text-3xl font-bold text-success mb-1">150M+</div>
                  <div class="text-sm text-text-muted">Updates per Second</div>
                </div>
              </div>

              <h2 class="heading-3 text-text mb-4">Why Rapid?</h2>
              <ul class="space-y-3 mb-8">
                <For
                  each={[
                    {
                      icon: 'lucide:zap',
                      title: 'Ultra-fast',
                      desc: '150M+ signal updates per second',
                    },
                    { icon: 'lucide:feather', title: 'Tiny', desc: 'Signal core is only 1.75 KB' },
                    {
                      icon: 'lucide:target',
                      title: 'No Virtual DOM',
                      desc: 'Direct DOM updates for maximum performance',
                    },
                    {
                      icon: 'lucide:brain',
                      title: 'Auto-tracking',
                      desc: 'Dependencies tracked automatically',
                    },
                  ]}
                >
                  {(item) => (
                    <li class="flex items-start gap-3">
                      <div class="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg flex-shrink-0">
                        <Icon icon={item.icon} width="16" height="16" />
                      </div>
                      <div>
                        <strong class="text-text">{item.title}</strong>
                        <span class="text-text-muted"> - {item.desc}</span>
                      </div>
                    </li>
                  )}
                </For>
              </ul>

              <h2 class="heading-3 text-text mb-4">Architecture</h2>
              <pre class="code-block mb-8">{`@rapid/signal (1.75 KB)
  |
  |-- signal()     - Reactive state
  |-- computed()   - Derived values
  |-- effect()     - Side effects
  |-- batch()      - Batched updates

@rapid/web (<5 KB)
  |
  |-- JSX Runtime  - Fine-grained rendering
  |-- Components   - For, Show, Switch, Portal
  |-- Router       - Client-side routing`}</pre>

              <h2 class="heading-3 text-text mb-4">Quick Start</h2>
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-text-muted mb-2">1. Install packages</div>
                  <pre class="code-block">npm install @rapid/signal @rapid/web</pre>
                </div>
                <div>
                  <div class="text-sm text-text-muted mb-2">2. Configure TypeScript</div>
                  <pre class="code-block">{`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rapid/web"
  }
}`}</pre>
                </div>
                <div>
                  <div class="text-sm text-text-muted mb-2">3. Create your first component</div>
                  <pre class="code-block">{`import { signal } from '@rapid/signal';
import { render } from '@rapid/web';

const count = signal(0);

render(() => (
  <button onClick={() => count.value++}>
    Count: {count}
  </button>
), document.body);`}</pre>
                </div>
              </div>
            </article>
          </Show>

          <Show when={showSignal}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Core Package</span>
                <h1 class="heading-2 text-text mb-4">@rapid/signal</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Ultra-fast reactive primitives with automatic dependency tracking.
                </p>
              </div>

              <h2 class="heading-3 text-text mb-4">signal()</h2>
              <p class="text-text-muted mb-4">
                Create reactive state that automatically notifies subscribers.
              </p>
              <pre class="code-block mb-8">{`import { signal } from '@rapid/signal';

const count = signal(0);

// Read value
console.log(count.value); // 0

// Write value
count.value = 1;
count.value++;`}</pre>

              <h2 class="heading-3 text-text mb-4">computed()</h2>
              <p class="text-text-muted mb-4">
                Create derived values with automatic dependency tracking.
              </p>
              <pre class="code-block mb-8">{`import { signal, computed } from '@rapid/signal';

const count = signal(0);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 0
count.value = 5;
console.log(doubled.value); // 10`}</pre>

              <h2 class="heading-3 text-text mb-4">effect()</h2>
              <p class="text-text-muted mb-4">Run side effects when dependencies change.</p>
              <pre class="code-block mb-8">{`import { signal, effect } from '@rapid/signal';

const count = signal(0);

effect(() => {
  console.log('Count:', count.value);
});

count.value++; // Logs: "Count: 1"`}</pre>

              <h2 class="heading-3 text-text mb-4">batch()</h2>
              <p class="text-text-muted mb-4">Batch multiple updates into one notification.</p>
              <pre class="code-block">{`import { signal, batch } from '@rapid/signal';

const a = signal(1);
const b = signal(2);

batch(() => {
  a.value = 10;
  b.value = 20;
  // Only notifies subscribers once
});`}</pre>
            </article>
          </Show>

          <Show when={showFramework}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Framework</span>
                <h1 class="heading-2 text-text mb-4">@rapid/web</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Fine-grained reactive framework with no virtual DOM.
                </p>
              </div>

              <h2 class="heading-3 text-text mb-4">JSX Runtime</h2>
              <p class="text-text-muted mb-4">
                Components render once, signals handle all updates.
              </p>
              <pre class="code-block mb-8">{`import { signal } from '@rapid/signal';

function Counter() {
  const count = signal(0);

  // This component renders ONCE
  // Only the text node updates when count changes
  return (
    <button onClick={() => count.value++}>
      Count: {count}
    </button>
  );
}`}</pre>

              <h2 class="heading-3 text-text mb-4">render()</h2>
              <p class="text-text-muted mb-4">Mount your application to the DOM.</p>
              <pre class="code-block">{`import { render } from '@rapid/web';

render(() => <App />, document.getElementById('root'));`}</pre>
            </article>
          </Show>

          <Show when={showComponents}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Built-in</span>
                <h1 class="heading-2 text-text mb-4">Components</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Powerful components for common patterns.
                </p>
              </div>

              <h2 class="heading-3 text-text mb-4">Show</h2>
              <p class="text-text-muted mb-4">Conditionally render content.</p>
              <pre class="code-block mb-8">{`import { Show } from '@rapid/web';

<Show when={() => isLoggedIn.value} fallback={<Login />}>
  <Dashboard />
</Show>`}</pre>

              <h2 class="heading-3 text-text mb-4">For</h2>
              <p class="text-text-muted mb-4">Efficiently render lists.</p>
              <pre class="code-block mb-8">{`import { For } from '@rapid/web';

<For each={items}>
  {(item) => <Item data={item} />}
</For>`}</pre>

              <h2 class="heading-3 text-text mb-4">Switch / Match</h2>
              <p class="text-text-muted mb-4">Render based on multiple conditions.</p>
              <pre class="code-block">{`import { Switch, Match } from '@rapid/web';

<Switch>
  <Match when={() => status.value === 'loading'}>
    <Loading />
  </Match>
  <Match when={() => status.value === 'error'}>
    <Error />
  </Match>
  <Match when={() => status.value === 'success'}>
    <Content />
  </Match>
</Switch>`}</pre>
            </article>
          </Show>

          <Show when={showPatterns}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Best Practices</span>
                <h1 class="heading-2 text-text mb-4">Common Patterns</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Best practices for building with Rapid.
                </p>
              </div>

              <h2 class="heading-3 text-text mb-4">Form Handling</h2>
              <pre class="code-block mb-8">{`const form = signal({ name: '', email: '' });

function Form() {
  return (
    <form>
      <input
        value={form.value.name}
        onInput={(e) => {
          form.value = { ...form.value, name: e.target.value };
        }}
      />
    </form>
  );
}`}</pre>

              <h2 class="heading-3 text-text mb-4">Async Data</h2>
              <pre class="code-block">{`const data = signal(null);
const loading = signal(true);
const error = signal(null);

effect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(json => {
      data.value = json;
      loading.value = false;
    })
    .catch(err => {
      error.value = err;
      loading.value = false;
    });
});`}</pre>
            </article>
          </Show>

          <Show when={showIntegrations}>
            <article class="card">
              <div class="mb-8">
                <span class="badge badge-primary mb-4">Ecosystem</span>
                <h1 class="heading-2 text-text mb-4">Integrations</h1>
                <p class="text-lg text-text-muted leading-relaxed">
                  Use Rapid Signal with your favorite tools.
                </p>
              </div>

              <h2 class="heading-3 text-text mb-4">With Vite</h2>
              <pre class="code-block mb-8">{`// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@rapid/web'
  }
});`}</pre>

              <h2 class="heading-3 text-text mb-4">With TypeScript</h2>
              <pre class="code-block">{`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rapid/web",
    "strict": true
  }
}`}</pre>
            </article>
          </Show>
        </main>
      </div>
    </div>
  );
}
