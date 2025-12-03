/**
 * Interactive Demo Component
 *
 * Showcases Rapid's reactivity with live, editable examples
 * Users can modify values and see immediate updates
 */

import { createContext, useContext } from '@rapid/runtime';
import { computed, signal } from '@rapid/signal';
import { Match, Show, Switch } from '@rapid/web';

export function InteractiveDemo() {
  return (
    <section
      class="section"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div class="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>
            Experience Reactivity
          </h2>
          <p
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            No compilation. No virtual DOM. Just pure, fine-grained reactivity.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Demo 1: Basic Signal */}
          <BasicSignalDemo />

          {/* Demo 2: Computed Values */}
          <ComputedDemo />

          {/* Demo 3: Switch/Match - Pattern Matching */}
          <SwitchDemo />

          {/* Demo 4: Context API */}
          <ContextDemo />

          {/* Demo 5: Effect & Side Effects */}
          <EffectDemo />

          {/* Demo 6: Complex State */}
          <ComplexStateDemo />
        </div>
      </div>
    </section>
  );
}

/**
 * Demo 1: Basic Signal - Shows fundamental reactivity
 */
function BasicSignalDemo() {
  const count = signal(0);

  return (
    <div class="demo-card">
      <h3 class="demo-title">Basic Signal</h3>
      <p class="demo-description">
        Click to increment. Signal updates trigger immediate DOM updates.
      </p>

      <div class="demo-visual">
        <div class="demo-output">
          <span style={{ fontSize: '64px', fontWeight: '700', color: '#667eea' }}>{count}</span>
        </div>

        <div class="demo-controls">
          <button type="button" class="btn btn-primary" onClick={() => count.value++}>
            Increment
          </button>
          <button type="button" class="btn btn-secondary" onClick={() => count.value--}>
            Decrement
          </button>
          <button
            type="button"
            class="btn btn-outline"
            onClick={() => {
              count.value = 0;
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const count = signal(0);

// In JSX:
<div>{count.value}</div>

// Update:
count.value++`}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Demo 2: Computed Values - Shows derived state
 */
function ComputedDemo() {
  const celsius = signal(20);
  const fahrenheit = computed(() => (celsius.value * 9) / 5 + 32);
  const status = computed(() => {
    const c = celsius.value;
    if (c < 0) return { text: 'Freezing ❄️', color: '#3b82f6' };
    if (c < 15) return { text: 'Cold 🧊', color: '#06b6d4' };
    if (c < 25) return { text: 'Comfortable 😊', color: '#10b981' };
    if (c < 35) return { text: 'Warm ☀️', color: '#f59e0b' };
    return { text: 'Hot 🔥', color: '#ef4444' };
  });

  return (
    <div class="demo-card">
      <h3 class="demo-title">Computed Values</h3>
      <p class="demo-description">Computed values automatically update when dependencies change.</p>

      <div class="demo-visual">
        <div class="demo-output">
          <div
            style={{ fontSize: '48px', fontWeight: '700', color: '#667eea', marginBottom: '16px' }}
          >
            {() => `${celsius.value}°C`}
          </div>
          <div style={{ fontSize: '24px', color: '#666', marginBottom: '16px' }}>
            {() => `${fahrenheit.value}°F`}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              background: () => `${status.value.color}20`,
              color: () => status.value.color,
            }}
          >
            {() => status.value.text}
          </div>
        </div>

        <div class="demo-controls">
          <input
            type="range"
            min="-10"
            max="45"
            value={celsius}
            onInput={(e) => {
              celsius.value = Number.parseInt((e.target as HTMLInputElement).value);
            }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const celsius = signal(20);
const fahrenheit = computed(() =>
  (celsius.value * 9/5) + 32
);

// Auto-updates when celsius changes!`}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Demo 3: Switch/Match - Pattern matching for conditional rendering
 */
function SwitchDemo() {
  const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  const cycleStatus = () => {
    const states: Array<'idle' | 'loading' | 'success' | 'error'> = [
      'idle',
      'loading',
      'success',
      'error',
    ];
    const currentIndex = states.indexOf(status.value);
    status.value = states[(currentIndex + 1) % states.length];
  };

  return (
    <div class="demo-card">
      <h3 class="demo-title">Switch / Match</h3>
      <p class="demo-description">Pattern matching for cleaner conditional rendering.</p>

      <div class="demo-visual">
        <div class="demo-output">
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              background: '#f9fafb',
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Switch>
              <Match when={computed(() => status.value === 'idle')}>
                <div style={{ color: '#6b7280' }}>
                  <span style={{ fontSize: '32px' }}>⏸️</span>
                  <p style={{ marginTop: '8px' }}>Ready to start</p>
                </div>
              </Match>
              <Match when={computed(() => status.value === 'loading')}>
                <div style={{ color: '#3b82f6' }}>
                  <span
                    style={{
                      fontSize: '32px',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    ⏳
                  </span>
                  <p style={{ marginTop: '8px' }}>Loading...</p>
                </div>
              </Match>
              <Match when={computed(() => status.value === 'success')}>
                <div style={{ color: '#22c55e' }}>
                  <span style={{ fontSize: '32px' }}>✅</span>
                  <p style={{ marginTop: '8px' }}>Success!</p>
                </div>
              </Match>
              <Match when={computed(() => status.value === 'error')}>
                <div style={{ color: '#ef4444' }}>
                  <span style={{ fontSize: '32px' }}>❌</span>
                  <p style={{ marginTop: '8px' }}>Something went wrong</p>
                </div>
              </Match>
            </Switch>
          </div>
        </div>

        <div class="demo-controls" style={{ marginTop: '16px' }}>
          <button type="button" class="btn btn-primary" onClick={cycleStatus}>
            Next State: {() => {
              const states = ['idle', 'loading', 'success', 'error'];
              const next = states[(states.indexOf(status.value) + 1) % states.length];
              return next;
            }}
          </button>
          <span style={{ marginLeft: '12px', color: '#666', fontSize: '14px' }}>
            Current: <strong>{status}</strong>
          </span>
        </div>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const status = signal('idle')

<Switch>
  <Match when={() => status.value === 'loading'}>
    <Spinner />
  </Match>
  <Match when={() => status.value === 'error'}>
    <Error />
  </Match>
  <Match when={() => status.value === 'success'}>
    <Content />
  </Match>
</Switch>`}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Demo 4: Context API - Dependency injection
 */
const ThemeContext = createContext<'light' | 'dark'>('light');

function ContextDemo() {
  const theme = signal<'light' | 'dark'>('light');

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  return (
    <div class="demo-card">
      <h3 class="demo-title">Context API</h3>
      <p class="demo-description">Share state across components without prop drilling.</p>

      <div class="demo-visual">
        <ThemeContext.Provider value={theme.value}>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: () => (theme.value === 'dark' ? '#1f2937' : '#f9fafb'),
              border: () => `2px solid ${theme.value === 'dark' ? '#374151' : '#e5e7eb'}`,
              transition: 'all 0.3s ease',
            }}
          >
            <ThemedHeader />
            <ThemedContent />
            <ThemedButton onToggle={toggleTheme} />
          </div>
        </ThemeContext.Provider>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const ThemeContext = createContext('light')

// Provider wraps app
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// Any child can consume
function Child() {
  const theme = useContext(ThemeContext)
  return <div class={theme}>...</div>
}`}</code>
        </pre>
      </div>
    </div>
  );
}

function ThemedHeader() {
  const theme = useContext(ThemeContext);
  return (
    <h4
      style={{
        margin: '0 0 12px 0',
        color: theme === 'dark' ? '#f9fafb' : '#111827',
        fontSize: '18px',
        fontWeight: '600',
      }}
    >
      🎨 Themed Component
    </h4>
  );
}

function ThemedContent() {
  const theme = useContext(ThemeContext);
  return (
    <p
      style={{
        margin: '0 0 16px 0',
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        fontSize: '14px',
      }}
    >
      Current theme: <strong>{theme}</strong>
      <br />
      All children receive the theme via Context.
    </p>
  );
}

function ThemedButton({ onToggle }: { onToggle: () => void }) {
  const theme = useContext(ThemeContext);
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: theme === 'dark' ? '#3b82f6' : '#667eea',
        color: 'white',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      Toggle Theme
    </button>
  );
}

/**
 * Demo 5: Effect - Shows side effects
 */
function EffectDemo() {
  const name = signal('');
  const log = signal<string[]>([]);

  // Effect runs automatically when name changes
  const logEffect = () => {
    if (name.value) {
      log.value = [...log.value, `Hello, ${name.value}!`].slice(-5); // Keep last 5
    }
  };

  return (
    <div class="demo-card">
      <h3 class="demo-title">Effects & Side Effects</h3>
      <p class="demo-description">Effects run automatically when dependencies change.</p>

      <div class="demo-visual">
        <div class="demo-controls">
          <input
            type="text"
            placeholder="Enter your name..."
            value={name}
            onInput={(e) => {
              name.value = (e.target as HTMLInputElement).value;
              logEffect();
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          />
        </div>

        <div class="demo-output">
          <div
            style={{
              minHeight: '150px',
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#374151',
            }}
          >
            <Show
              when={computed(() => log.value.length > 0)}
              fallback={<span style={{ color: '#9ca3af' }}>Type your name to see effects...</span>}
            >
              {computed(() =>
                log.value.map((entry) => (
                  <div key={entry} style={{ marginBottom: '4px' }}>
                    {entry}
                  </div>
                )),
              )}
            </Show>
          </div>
        </div>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const name = signal('');

effect(() => {
  console.log(\`Hello, \${name.value}!\`);
  // Runs automatically on change
});`}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Demo 4: Complex State - Shows nested reactivity
 */
function ComplexStateDemo() {
  const todos = signal([
    { id: 1, text: 'Learn Rapid', done: true },
    { id: 2, text: 'Build an app', done: false },
    { id: 3, text: 'Ship to production', done: false },
  ]);

  const completed = computed(() => todos.value.filter((t) => t.done).length);
  const total = computed(() => todos.value.length);
  const progress = computed(() => (total.value > 0 ? (completed.value / total.value) * 100 : 0));

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    );
  };

  const renderTodoItem = (todo: { id: number; text: string; done: boolean }) => (
    <button
      key={todo.id}
      type="button"
      onClick={() => toggleTodo(todo.id)}
      style={{
        padding: '12px',
        marginBottom: '8px',
        background: todo.done ? '#f0fdf4' : 'white',
        border: `1px solid ${todo.done ? '#86efac' : '#e5e7eb'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: `2px solid ${todo.done ? '#22c55e' : '#d1d5db'}`,
          background: todo.done ? '#22c55e' : 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'white',
        }}
      >
        {todo.done ? '✓' : ''}
      </div>
      <span
        style={{
          flex: 1,
          textDecoration: todo.done ? 'line-through' : 'none',
          color: todo.done ? '#9ca3af' : '#111827',
        }}
      >
        {todo.text}
      </span>
    </button>
  );

  return (
    <div class="demo-card">
      <h3 class="demo-title">Complex State</h3>
      <p class="demo-description">Manage complex, nested state with ease.</p>

      <div class="demo-visual">
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Progress</span>
            <span style={{ fontWeight: '600' }}>
              {completed}/{total}
            </span>
          </div>
          <div
            style={{
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                width: () => `${progress.value}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div class="demo-output">
          {computed(() => todos.value.map((todo) => renderTodoItem(todo)))}
        </div>
      </div>

      <div class="demo-code">
        <pre>
          <code>{`const todos = signal([...]);

const completed = computed(() =>
  todos.value.filter(t => t.done).length
);

// Update array immutably
todos.value = todos.value.map(...)`}</code>
        </pre>
      </div>
    </div>
  );
}
