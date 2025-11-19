/**
 * ZenJS Demo App - 真正的 JSX 寫法！
 */

import { For, Match, Show, Switch, batch, computed, effect, signal } from 'zenjs';
import { BatchDemo, FineGrainedDemo, MemoryDemo } from './Showcase';

// ========== Counter Component ==========
function Counter() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);
  const squared = computed(() => count.value * count.value);

  return (
    <div class="demo-card">
      <h2>🔢 Counter - Signal & Computed</h2>

      <div class="counter-display">{count.value}</div>

      <div class="stats">
        <div>
          <strong>Doubled:</strong> {doubled.value}
        </div>
        <div>
          <strong>Squared:</strong> {squared.value}
        </div>
      </div>

      <div>
        <button onClick={() => (count.value -= 10)}>-10</button>
        <button onClick={() => count.value--}>-1</button>
        <button onClick={() => (count.value = 0)}>Reset</button>
        <button onClick={() => count.value++}>+1</button>
        <button onClick={() => (count.value += 10)}>+10</button>
      </div>

      <p class="label">Watch the values update automatically!</p>
    </div>
  );
}

// ========== Todo Component ==========
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

function TodoList() {
  const todos = signal<Todo[]>([]);
  const filter = signal<Filter>('all');
  let inputRef: HTMLInputElement;

  const filteredTodos = computed(() => {
    const list = todos.value;
    const f = filter.value;

    if (f === 'active') return list.filter((t) => !t.completed);
    if (f === 'completed') return list.filter((t) => t.completed);
    return list;
  });

  const stats = computed(() => {
    const list = todos.value;
    return {
      total: list.length,
      active: list.filter((t) => !t.completed).length,
      completed: list.filter((t) => t.completed).length,
    };
  });

  const addTodo = () => {
    const text = inputRef?.value.trim();
    if (!text) return;

    todos.value = [...todos.value, { id: Date.now(), text, completed: false }];
    if (inputRef) inputRef.value = '';
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((t) => t.id !== id);
  };

  return (
    <div class="demo-card">
      <h2>📝 Todo List - For & Show</h2>

      <input
        ref={(el: any) => (inputRef = el)}
        type="text"
        onKeyDown={(e: any) => e.key === 'Enter' && addTodo()}
        placeholder="Add a todo..."
      />
      <button onClick={addTodo}>Add</button>

      <div class="stats">
        <span>
          Total: <strong>{stats.value.total}</strong>
        </span>
        <span>
          Active: <strong>{stats.value.active}</strong>
        </span>
        <span>
          Completed: <strong>{stats.value.completed}</strong>
        </span>
      </div>

      <div class="filters">
        <button
          class={computed(() => (filter.value === 'all' ? 'active' : ''))}
          onClick={() => (filter.value = 'all')}
        >
          All
        </button>
        <button
          class={computed(() => (filter.value === 'active' ? 'active' : ''))}
          onClick={() => (filter.value = 'active')}
        >
          Active
        </button>
        <button
          class={computed(() => (filter.value === 'completed' ? 'active' : ''))}
          onClick={() => (filter.value = 'completed')}
        >
          Completed
        </button>
      </div>

      <Show
        when={computed(() => filteredTodos.value.length > 0)}
        fallback={<p style="color: #999; text-align: center;">No todos yet!</p>}
      >
        <ul class="todo-list">
          <For each={filteredTodos}>
            {(todo: Todo) => (
              <li class={todo.completed ? 'todo-item completed' : 'todo-item'}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.text}</span>
                <button onClick={() => removeTodo(todo.id)}>×</button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}

// ========== Performance Component ==========
function Performance() {
  const count = signal(0);

  return (
    <div class="demo-card">
      <h2>⚡ Performance - batch()</h2>

      <div class="performance-box">
        Count: <strong>{count.value}</strong>
      </div>

      <button onClick={() => count.value++}>Increment</button>

      <p class="label">Performance demo - simplified for debugging</p>
    </div>
  );
}

// ========== Conditional Component ==========
function Conditional() {
  const isLoggedIn = signal(false);
  const view = signal<'home' | 'profile' | 'settings'>('home');

  return (
    <div class="demo-card">
      <h2>🔀 Conditional - Show & Switch</h2>

      <h3>Show Component:</h3>
      <button onClick={() => (isLoggedIn.value = !isLoggedIn.value)}>Toggle Login</button>

      <Show
        when={isLoggedIn}
        fallback={
          <div style="padding: 12px; background: #f8d7da; border-radius: 6px; margin: 10px 0;">
            <strong style="color: red;">✗ Not Logged In</strong> - Please login
          </div>
        }
      >
        <div style="padding: 12px; background: #d4edda; border-radius: 6px; margin: 10px 0;">
          <strong style="color: green;">✓ Logged In</strong> - Welcome back!
        </div>
      </Show>

      <h3>Switch Component:</h3>
      <div style="display: flex; gap: 8px; margin: 10px 0;">
        <button onClick={() => (view.value = 'home')}>Home</button>
        <button onClick={() => (view.value = 'profile')}>Profile</button>
        <button onClick={() => (view.value = 'settings')}>Settings</button>
      </div>

      <Switch fallback={<div>Not Found</div>}>
        <Match when={() => view.value === 'home'}>
          <div style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
            <h3>🏠 Home</h3>
            <p>Welcome to the home page!</p>
          </div>
        </Match>
        <Match when={() => view.value === 'profile'}>
          <div style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
            <h3>👤 Profile</h3>
            <p>Your profile information</p>
          </div>
        </Match>
        <Match when={() => view.value === 'settings'}>
          <div style="padding: 12px; background: #f5f5f5; border-radius: 6px;">
            <h3>⚙️ Settings</h3>
            <p>App settings and preferences</p>
          </div>
        </Match>
      </Switch>
    </div>
  );
}

// ========== Main App ==========
function App() {
  return (
    <div class="container">
      <header>
        <h1>⚡ ZenJS Demo</h1>
        <p>Ultra-fast, ultra-lightweight reactive framework</p>
        <p class="subtitle">真正的 JSX 寫法！</p>
      </header>

      <div class="demos">
        <FineGrainedDemo />
        <BatchDemo />
        <MemoryDemo />
        <Counter />
        <TodoList />
        <Performance />
        <Conditional />
      </div>
    </div>
  );
}

export default App;
