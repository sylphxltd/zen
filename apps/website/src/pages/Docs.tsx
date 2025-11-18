import { signal, Show } from '@zen/zen';

export function Docs() {
  const activeSection = signal('intro');

  const sections = [
    { id: 'intro', title: 'Introduction', icon: '📖' },
    { id: 'signal', title: '@zen/signal', icon: '⚡' },
    { id: 'framework', title: '@zen/zen', icon: '🎯' },
    { id: 'components', title: 'Components', icon: '🧩' },
    { id: 'patterns', title: 'Patterns', icon: '💡' },
    { id: 'integrations', title: 'Integrations', icon: '🔌' },
  ];

  return (
    <div class="page-docs">
      <div class="docs-container">
        <aside class="docs-sidebar">
          <h3>Documentation</h3>
          <nav class="docs-nav">
            {sections.map((section) => (
              <button
                class={activeSection.value === section.id ? 'docs-nav-item active' : 'docs-nav-item'}
                onClick={() => activeSection.value = section.id}
              >
                <span class="docs-nav-icon">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        <main class="docs-content">
          <Show when={activeSection.value === 'intro'}>
            <article>
              <h1>Introduction to Zen Ecosystem</h1>
              <p class="lead">
                Zen is a modern reactive ecosystem consisting of two core packages:
                <strong>@zen/signal</strong> for reactive primitives and <strong>@zen/zen</strong> for the fine-grained framework.
              </p>

              <h2>Why Zen?</h2>
              <ul>
                <li><strong>Ultra-fast</strong>: 150M+ signal updates per second</li>
                <li><strong>Tiny</strong>: Signal core is only 1.75 KB, full framework &lt;5 KB</li>
                <li><strong>No Virtual DOM</strong>: Direct DOM updates for maximum performance</li>
                <li><strong>Fine-grained</strong>: Only changed nodes update, not entire components</li>
                <li><strong>Auto-tracking</strong>: Dependencies tracked automatically</li>
              </ul>

              <h2>Architecture</h2>
              <pre class="code-block">{`@zen/signal (1.75 KB)
  ↓
  ├─ signal()     - Reactive state
  ├─ computed()   - Derived values
  ├─ effect()     - Side effects
  └─ batch()      - Batched updates

@zen/zen (<5 KB)
  ↓
  ├─ JSX Runtime  - Fine-grained rendering
  ├─ Components   - For, Show, Switch, Portal, ErrorBoundary
  └─ Router       - Client-side routing`}</pre>

              <h2>Philosophy</h2>
              <p>
                Zen is built on the principle of <strong>extreme minimalism meets maximum power</strong>.
                Every feature is carefully designed to provide the best developer experience
                while maintaining the smallest possible bundle size and fastest possible performance.
              </p>
            </article>
          </Show>

          <Show when={activeSection.value === 'signal'}>
            <article>
              <h1>@zen/signal</h1>
              <p class="lead">
                Ultra-fast reactive primitives with automatic dependency tracking.
                The foundation of the Zen ecosystem.
              </p>

              <h2>signal()</h2>
              <p>Create reactive state</p>
              <pre class="code-block">{`import { signal } from '@zen/signal';

const count = signal(0);

// Read
console.log(count.value); // 0

// Write
count.value = 1;
count.value++;`}</pre>

              <h2>computed()</h2>
              <p>Create derived values with auto-tracking</p>
              <pre class="code-block">{`import { signal, computed } from '@zen/signal';

const count = signal(0);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 0
count.value = 5;
console.log(doubled.value); // 10`}</pre>

              <h2>effect()</h2>
              <p>Run side effects when dependencies change</p>
              <pre class="code-block">{`import { signal, effect } from '@zen/signal';

const count = signal(0);

effect(() => {
  console.log('Count:', count.value);
});

count.value++; // Logs: "Count: 1"`}</pre>

              <h2>batch()</h2>
              <p>Batch multiple updates into one notification</p>
              <pre class="code-block">{`import { signal, batch } from '@zen/signal';

const a = signal(1);
const b = signal(2);

batch(() => {
  a.value = 10;
  b.value = 20;
  // Only notifies subscribers once
});`}</pre>

              <h2>Advanced: peek()</h2>
              <p>Read signal value without tracking</p>
              <pre class="code-block">{`import { signal, effect, peek } from '@zen/signal';

const count = signal(0);

effect(() => {
  console.log(peek(count)); // Doesn't track
});

count.value++; // Effect won't run`}</pre>
            </article>
          </Show>

          <Show when={activeSection.value === 'framework'}>
            <article>
              <h1>@zen/zen Framework</h1>
              <p class="lead">
                Fine-grained reactive framework with no virtual DOM.
                Components render once, signals handle all updates.
              </p>

              <h2>JSX Setup</h2>
              <pre class="code-block">{`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/zen"
  }
}

// vite.config.ts
export default {
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@zen/zen',
  },
};`}</pre>

              <h2>Basic Component</h2>
              <pre class="code-block">{`import { signal, render } from '@zen/zen';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}

render(() => <Counter />, document.getElementById('app'));`}</pre>

              <h2>How It Works</h2>
              <ul>
                <li><strong>Component runs once</strong>: Function executes only during initial render</li>
                <li><strong>Signals auto-update</strong>: DOM nodes update when signal values change</li>
                <li><strong>No re-renders</strong>: No virtual DOM diffing, no component re-execution</li>
                <li><strong>Fine-grained</strong>: Only exact DOM nodes that need updating are touched</li>
              </ul>

              <h2>Event Handling</h2>
              <pre class="code-block">{`// All standard DOM events
<button onClick={handleClick}>Click</button>
<input onInput={handleInput} />
<form onSubmit={handleSubmit} />
<div onMouseEnter={handleEnter} />`}</pre>

              <h2>Refs</h2>
              <pre class="code-block">{`function Component() {
  const inputRef = signal(null);

  return (
    <input
      ref={(el) => inputRef.value = el}
      type="text"
    />
  );
}`}</pre>
            </article>
          </Show>

          <Show when={activeSection.value === 'components'}>
            <article>
              <h1>Built-in Components</h1>
              <p class="lead">
                Zen provides powerful components for common patterns.
              </p>

              <h2>For - List Rendering</h2>
              <p>Optimized keyed list rendering with minimal DOM operations</p>
              <pre class="code-block">{`import { For, signal } from '@zen/zen';

const items = signal(['a', 'b', 'c']);

<For each={items.value}>
  {(item, index) => (
    <div>
      {index()}: {item}
    </div>
  )}
</For>`}</pre>

              <h2>Show - Conditional Rendering</h2>
              <p>Conditionally render with cleanup</p>
              <pre class="code-block">{`import { Show, signal } from '@zen/zen';

const isLoggedIn = signal(false);

<Show
  when={isLoggedIn.value}
  fallback={<Login />}
>
  <Dashboard />
</Show>`}</pre>

              <h2>Switch/Match - Multiple Conditions</h2>
              <pre class="code-block">{`import { Switch, Match, signal } from '@zen/zen';

const status = signal('loading');

<Switch>
  <Match when={status.value === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status.value === 'error'}>
    <Error />
  </Match>
  <Match when={status.value === 'success'}>
    <Content />
  </Match>
</Switch>`}</pre>

              <h2>Portal</h2>
              <p>Render content outside the parent DOM hierarchy</p>
              <pre class="code-block">{`import { Portal, signal } from '@zen/zen';

const showModal = signal(false);

<Portal mount={document.body}>
  <div class="modal">
    Modal content
  </div>
</Portal>`}</pre>

              <h2>ErrorBoundary</h2>
              <p>Catch and handle errors in component tree</p>
              <pre class="code-block">{`import { ErrorBoundary } from '@zen/zen';

<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>`}</pre>

              <h2>Router</h2>
              <p>Client-side routing with hash-based navigation</p>
              <pre class="code-block">{`import { Router, Link } from '@zen/zen';

<Router
  routes={[
    { path: '/', component: () => <Home /> },
    { path: '/about', component: () => <About /> },
    { path: '/users/:id', component: () => <User /> },
  ]}
  fallback={() => <NotFound />}
/>

// Links
<Link href="/">Home</Link>
<Link href="/about">About</Link>`}</pre>
            </article>
          </Show>

          <Show when={activeSection.value === 'patterns'}>
            <article>
              <h1>Common Patterns</h1>
              <p class="lead">
                Best practices and patterns for building with Zen.
              </p>

              <h2>Global State</h2>
              <pre class="code-block">{`// store.ts
import { signal, computed } from '@zen/signal';

export const user = signal(null);
export const isLoggedIn = computed(() => user.value !== null);

// Component.tsx
import { user, isLoggedIn } from './store';

function Header() {
  return (
    <Show when={isLoggedIn.value}>
      <p>Welcome, {user.value.name}</p>
    </Show>
  );
}`}</pre>

              <h2>Form Handling</h2>
              <pre class="code-block">{`import { signal, computed } from '@zen/zen';

function Form() {
  const email = signal('');
  const password = signal('');

  const isValid = computed(() =>
    email.value.includes('@') &&
    password.value.length >= 8
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid.value) {
      // Submit form
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email.value}
        onInput={(e) => email.value = e.target.value}
      />
      <input
        type="password"
        value={password.value}
        onInput={(e) => password.value = e.target.value}
      />
      <button disabled={!isValid.value}>
        Submit
      </button>
    </form>
  );
}`}</pre>

              <h2>Async Data Fetching</h2>
              <pre class="code-block">{`import { signal, effect } from '@zen/zen';

function UserProfile() {
  const userId = signal(1);
  const user = signal(null);
  const loading = signal(false);

  effect(() => {
    loading.value = true;
    fetch(\`/api/users/\${userId.value}\`)
      .then(res => res.json())
      .then(data => {
        user.value = data;
        loading.value = false;
      });
  });

  return (
    <Show when={!loading.value} fallback={<Spinner />}>
      <Show when={user.value}>
        {(u) => <div>{u.name}</div>}
      </Show>
    </Show>
  );
}`}</pre>

              <h2>Derived State</h2>
              <pre class="code-block">{`import { signal, computed } from '@zen/zen';

const todos = signal([
  { id: 1, text: 'Learn Zen', done: false },
  { id: 2, text: 'Build app', done: false },
]);

const filter = signal('all');

const filteredTodos = computed(() => {
  const f = filter.value;
  const t = todos.value;
  if (f === 'active') return t.filter(t => !t.done);
  if (f === 'completed') return t.filter(t => t.done);
  return t;
});

const activeCount = computed(() =>
  todos.value.filter(t => !t.done).length
);`}</pre>
            </article>
          </Show>

          <Show when={activeSection.value === 'integrations'}>
            <article>
              <h1>Framework Integrations</h1>
              <p class="lead">
                Use Zen Signal with your favorite frameworks.
              </p>

              <h2>React</h2>
              <pre class="code-block">{`import { useZen } from '@zen/signal-react';
import { signal } from '@zen/signal';

const count = signal(0);

function Counter() {
  const value = useZen(count);

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}`}</pre>

              <h2>Vue</h2>
              <pre class="code-block">{`import { useZen } from '@zen/signal-vue';
import { signal } from '@zen/signal';

const count = signal(0);

export default {
  setup() {
    const value = useZen(count);
    return { value, count };
  }
}`}</pre>

              <h2>Svelte</h2>
              <pre class="code-block">{`import { toStore } from '@zen/signal-svelte';
import { signal } from '@zen/signal';

const count = signal(0);
const countStore = toStore(count);

// In component
$: value = $countStore;`}</pre>

              <h2>Solid</h2>
              <pre class="code-block">{`import { toSolidSignal } from '@zen/signal-solid';
import { signal } from '@zen/signal';

const zenCount = signal(0);
const solidCount = toSolidSignal(zenCount);

// Use as Solid signal
const doubled = () => solidCount() * 2;`}</pre>

              <h2>Preact</h2>
              <pre class="code-block">{`import { useZen } from '@zen/signal-preact';
import { signal } from '@zen/signal';

const count = signal(0);

export function Counter() {
  const value = useZen(count);

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}`}</pre>

              <h2>Available Packages</h2>
              <ul>
                <li><strong>@zen/signal-react</strong> - React hooks integration</li>
                <li><strong>@zen/signal-vue</strong> - Vue 3 Composition API</li>
                <li><strong>@zen/signal-svelte</strong> - Svelte stores compatibility</li>
                <li><strong>@zen/signal-solid</strong> - SolidJS primitives</li>
                <li><strong>@zen/signal-preact</strong> - Preact signals integration</li>
              </ul>
            </article>
          </Show>
        </main>
      </div>
    </div>
  );
}
