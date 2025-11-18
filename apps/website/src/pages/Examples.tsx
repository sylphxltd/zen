import { signal, computed, For, Show } from '@zen/zen';

export function Examples() {
  const activeExample = signal('counter');

  const examples = [
    { id: 'counter', title: 'Counter', icon: '🔢' },
    { id: 'todo', title: 'Todo List', icon: '✓' },
    { id: 'form', title: 'Form Validation', icon: '📝' },
    { id: 'async', title: 'Async Data', icon: '🔄' },
    { id: 'router', title: 'Routing', icon: '🧭' },
    { id: 'portal', title: 'Portal/Modal', icon: '🚪' },
  ];

  return (
    <div class="page-examples">
      <div class="container">
        <header class="page-header">
          <h1>Examples</h1>
          <p>Real-world examples showcasing Zen's powerful features</p>
        </header>

        <div class="examples-layout">
          <aside class="examples-sidebar">
            <For each={examples}>
              {(example) => (
                <button
                  class={activeExample.value === example.id ? 'example-nav-item active' : 'example-nav-item'}
                  onClick={() => activeExample.value = example.id}
                >
                  <span class="example-icon">{example.icon}</span>
                  {example.title}
                </button>
              )}
            </For>
          </aside>

          <main class="examples-content">
            <Show when={activeExample.value === 'counter'}>
              <CounterExample />
            </Show>
            <Show when={activeExample.value === 'todo'}>
              <TodoExample />
            </Show>
            <Show when={activeExample.value === 'form'}>
              <FormExample />
            </Show>
            <Show when={activeExample.value === 'async'}>
              <AsyncExample />
            </Show>
            <Show when={activeExample.value === 'router'}>
              <RouterExample />
            </Show>
            <Show when={activeExample.value === 'portal'}>
              <PortalExample />
            </Show>
          </main>
        </div>
      </div>
    </div>
  );
}

function CounterExample() {
  const count = signal(0);
  const step = signal(1);
  const doubled = computed(() => count.value * 2);

  return (
    <div class="example">
      <h2>Counter with Step</h2>
      <p>Demonstrates signal() and computed() with dynamic step control</p>

      <div class="example-demo">
        <div class="counter-display">
          <div class="value-large">{count.value}</div>
          <div class="value-computed">Doubled: {doubled.value}</div>
        </div>
        <div class="counter-controls">
          <label>
            Step:
            <input
              type="number"
              value={step.value}
              onInput={(e) => step.value = parseInt((e.target as HTMLInputElement).value) || 1}
              class="input input-small"
            />
          </label>
          <div class="button-group">
            <button class="btn" onClick={() => count.value -= step.value}>- {step.value}</button>
            <button class="btn btn-primary" onClick={() => count.value += step.value}>+ {step.value}</button>
            <button class="btn btn-secondary" onClick={() => count.value = 0}>Reset</button>
          </div>
        </div>
      </div>

      <pre class="code-block">{`const count = signal(0);
const step = signal(1);
const doubled = computed(() => count.value * 2);

<button onClick={() => count.value += step.value}>
  + {step.value}
</button>`}</pre>
    </div>
  );
}

function TodoExample() {
  const todos = signal([
    { id: 1, text: 'Learn Zen', done: false },
    { id: 2, text: 'Build app', done: true },
  ]);
  const newTodo = signal('');
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
  );

  const addTodo = () => {
    if (newTodo.value.trim()) {
      todos.value = [...todos.value, {
        id: Date.now(),
        text: newTodo.value,
        done: false,
      }];
      newTodo.value = '';
    }
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
  };

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter(t => t.id !== id);
  };

  return (
    <div class="example">
      <h2>Todo List with Filters</h2>
      <p>Shows For component, computed filtering, and state management</p>

      <div class="example-demo">
        <div class="todo-app">
          <div class="todo-input-row">
            <input
              type="text"
              value={newTodo.value}
              onInput={(e) => newTodo.value = (e.target as HTMLInputElement).value}
              onKeyPress={(e) => (e as KeyboardEvent).key === 'Enter' && addTodo()}
              placeholder="What needs to be done?"
              class="input"
            />
            <button onClick={addTodo} class="btn btn-primary">Add</button>
          </div>

          <div class="todo-filters">
            <button
              class={filter.value === 'all' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => filter.value = 'all'}
            >
              All
            </button>
            <button
              class={filter.value === 'active' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => filter.value = 'active'}
            >
              Active ({activeCount.value})
            </button>
            <button
              class={filter.value === 'completed' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => filter.value = 'completed'}
            >
              Completed
            </button>
          </div>

          <ul class="todo-list">
            <For each={filteredTodos.value}>
              {(todo) => (
                <li class={todo.done ? 'todo-item done' : 'todo-item'}>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span class="todo-text">{todo.text}</span>
                  <button onClick={() => removeTodo(todo.id)} class="btn-icon">×</button>
                </li>
              )}
            </For>
          </ul>

          <Show when={filteredTodos.value.length === 0}>
            <div class="todo-empty">No todos in this filter</div>
          </Show>
        </div>
      </div>

      <pre class="code-block">{`const todos = signal([...]);
const filter = signal('all');

const filteredTodos = computed(() => {
  const f = filter.value;
  if (f === 'active') return todos.value.filter(t => !t.done);
  if (f === 'completed') return todos.value.filter(t => t.done);
  return todos.value;
});

<For each={filteredTodos.value}>
  {(todo) => <li>{todo.text}</li>}
</For>`}</pre>
    </div>
  );
}

function FormExample() {
  const email = signal('');
  const password = signal('');
  const confirmPassword = signal('');
  const submitted = signal(false);

  const emailValid = computed(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  );

  const passwordValid = computed(() =>
    password.value.length >= 8
  );

  const passwordsMatch = computed(() =>
    password.value === confirmPassword.value && password.value.length > 0
  );

  const formValid = computed(() =>
    emailValid.value && passwordValid.value && passwordsMatch.value
  );

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (formValid.value) {
      submitted.value = true;
      setTimeout(() => submitted.value = false, 3000);
    }
  };

  return (
    <div class="example">
      <h2>Form Validation</h2>
      <p>Real-time validation with computed values</p>

      <div class="example-demo">
        <form onSubmit={handleSubmit} class="demo-form">
          <div class="form-field">
            <label>Email</label>
            <input
              type="email"
              value={email.value}
              onInput={(e) => email.value = (e.target as HTMLInputElement).value}
              class="input"
            />
            <Show when={email.value && !emailValid.value}>
              <div class="form-error">Invalid email format</div>
            </Show>
            <Show when={emailValid.value}>
              <div class="form-success">✓ Valid email</div>
            </Show>
          </div>

          <div class="form-field">
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              value={password.value}
              onInput={(e) => password.value = (e.target as HTMLInputElement).value}
              class="input"
            />
            <Show when={password.value && !passwordValid.value}>
              <div class="form-error">Password must be at least 8 characters</div>
            </Show>
            <Show when={passwordValid.value}>
              <div class="form-success">✓ Strong password</div>
            </Show>
          </div>

          <div class="form-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword.value}
              onInput={(e) => confirmPassword.value = (e.target as HTMLInputElement).value}
              class="input"
            />
            <Show when={confirmPassword.value && !passwordsMatch.value}>
              <div class="form-error">Passwords don't match</div>
            </Show>
            <Show when={passwordsMatch.value}>
              <div class="form-success">✓ Passwords match</div>
            </Show>
          </div>

          <button type="submit" disabled={!formValid.value} class="btn btn-primary btn-large">
            Submit
          </button>

          <Show when={submitted.value}>
            <div class="form-success-message">✓ Form submitted successfully!</div>
          </Show>
        </form>
      </div>

      <pre class="code-block">{`const email = signal('');
const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);

<Show when={email.value && !emailValid.value}>
  <div class="error">Invalid email</div>
</Show>`}</pre>
    </div>
  );
}

function AsyncExample() {
  const userId = signal(1);
  const user = signal(null);
  const loading = signal(false);
  const error = signal(null);

  const fetchUser = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId.value}`);
      user.value = await res.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="example">
      <h2>Async Data Fetching</h2>
      <p>Loading states with Show component</p>

      <div class="example-demo">
        <div class="async-controls">
          <label>
            User ID:
            <input
              type="number"
              value={userId.value}
              onInput={(e) => userId.value = parseInt((e.target as HTMLInputElement).value) || 1}
              min="1"
              max="10"
              class="input input-small"
            />
          </label>
          <button onClick={fetchUser} class="btn btn-primary">Fetch User</button>
        </div>

        <div class="async-result">
          <Show when={loading.value}>
            <div class="loading-spinner">Loading...</div>
          </Show>

          <Show when={error.value}>
            <div class="error-message">Error: {error.value}</div>
          </Show>

          <Show when={!loading.value && !error.value && user.value}>
            {(u) => (
              <div class="user-card">
                <h3>{u.name}</h3>
                <p><strong>Email:</strong> {u.email}</p>
                <p><strong>Phone:</strong> {u.phone}</p>
                <p><strong>Website:</strong> {u.website}</p>
                <p><strong>Company:</strong> {u.company?.name}</p>
              </div>
            )}
          </Show>
        </div>
      </div>

      <pre class="code-block">{`const loading = signal(false);
const user = signal(null);

const fetchUser = async () => {
  loading.value = true;
  const res = await fetch('/api/user');
  user.value = await res.json();
  loading.value = false;
};

<Show when={loading.value}>
  <Spinner />
</Show>
<Show when={!loading.value && user.value}>
  {(u) => <div>{u.name}</div>}
</Show>`}</pre>
    </div>
  );
}

function RouterExample() {
  return (
    <div class="example">
      <h2>Client-side Routing</h2>
      <p>Router component with Link navigation</p>

      <pre class="code-block">{`import { Router, Link } from '@zen/zen';

function App() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/users/123">User</Link>
      </nav>

      <Router
        routes={[
          { path: '/', component: () => <Home /> },
          { path: '/about', component: () => <About /> },
          { path: '/users/:id', component: (props) => (
            <User id={props.params.id} />
          )},
        ]}
        fallback={() => <NotFound />}
      />
    </div>
  );
}`}</pre>

      <p>The router is already in use on this website! Try navigating between pages.</p>
    </div>
  );
}

function PortalExample() {
  const showModal = signal(false);

  return (
    <div class="example">
      <h2>Portal & Modal</h2>
      <p>Render content outside parent DOM hierarchy</p>

      <div class="example-demo">
        <button onClick={() => showModal.value = true} class="btn btn-primary">
          Open Modal
        </button>

        <Show when={showModal.value}>
          <div class="modal-overlay" onClick={() => showModal.value = false}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Modal Title</h3>
              <p>This modal is rendered using a Portal component!</p>
              <p>It's rendered outside the normal DOM hierarchy.</p>
              <button onClick={() => showModal.value = false} class="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Show>
      </div>

      <pre class="code-block">{`import { Portal, Show, signal } from '@zen/zen';

const showModal = signal(false);

<Portal mount={document.body}>
  <Show when={showModal.value}>
    <div class="modal">
      <h3>Modal</h3>
      <button onClick={() => showModal.value = false}>
        Close
      </button>
    </div>
  </Show>
</Portal>`}</pre>
    </div>
  );
}
