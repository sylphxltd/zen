/**
 * Interactive Demo Component
 *
 * Showcases Zen's reactivity with live, editable examples
 * Users can modify values and see immediate updates
 */

import { computed, signal } from '@zen/signal';
import { Show } from '@zen/zen';

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

          {/* Demo 3: Effect & Side Effects */}
          <EffectDemo />

          {/* Demo 4: Complex State */}
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
          <span style={{ fontSize: '64px', fontWeight: '700', color: '#667eea' }}>{count.value}</span>
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
            {celsius.value}°C
          </div>
          <div style={{ fontSize: '24px', color: '#666', marginBottom: '16px' }}>
            {fahrenheit.value}°F
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              background: computed(() => `${status.value.color}20`),
              color: status.value.color,
            }}
          >
            {status.value.text}
          </div>
        </div>

        <div class="demo-controls">
          <input
            type="range"
            min="-10"
            max="45"
            value={celsius.value}
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
 * Demo 3: Effect - Shows side effects
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
            value={name.value}
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
    { id: 1, text: 'Learn Zen', done: true },
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
                width: `${progress}%`,
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
