import { For, Show, computed, signal } from '@zen/zen';

export function Demo() {
  // Counter demo
  const count = signal(0);
  const doubled = computed(() => count.value * 2);

  // Todo demo
  const todos = signal<string[]>([]);
  const newTodo = signal('');

  const addTodo = () => {
    if (newTodo.value.trim()) {
      todos.value = [...todos.value, newTodo.value];
      newTodo.value = '';
    }
  };

  const removeTodo = (index: number) => {
    todos.value = todos.value.filter((_, i) => i !== index);
  };

  return (
    <section class="demo">
      <div class="container">
        <h2 class="section-title">Live Demos</h2>

        <div class="demo-grid">
          {/* Counter Demo */}
          <div class="demo-card">
            <h3 class="demo-title">Counter</h3>
            <div class="demo-content">
              <div class="demo-display">
                <div class="demo-value">{count}</div>
                <div class="demo-computed">Doubled: {doubled}</div>
              </div>
              <div class="demo-actions">
                <button type="button" class="btn" onClick={() => count.value--}>
                  -
                </button>
                <button type="button" class="btn" onClick={() => count.value++}>
                  +
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={() => {
                    count.value = 0;
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <pre class="demo-code">{`const count = signal(0);
const doubled = computed(() => count.value * 2);

<div>{count}</div>
<div>Doubled: {doubled}</div>
<button onClick={() => count.value++}>+</button>`}</pre>
          </div>

          {/* Todo Demo */}
          <div class="demo-card">
            <h3 class="demo-title">Todo List</h3>
            <div class="demo-content">
              <div class="todo-input">
                <input
                  type="text"
                  value={newTodo.value}
                  onInput={(e) => {
                    newTodo.value = (e.target as HTMLInputElement).value;
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a todo..."
                  class="input"
                />
                <button type="button" onClick={addTodo} class="btn btn-primary">
                  Add
                </button>
              </div>
              <ul class="todo-list">
                <For each={todos}>
                  {(todo, index) => (
                    <li class="todo-item">
                      <span>{todo}</span>
                      <button type="button" onClick={() => removeTodo(index())} class="btn-icon">
                        ×
                      </button>
                    </li>
                  )}
                </For>
              </ul>
              <Show when={todos.value.length === 0}>
                <div class="todo-empty">No todos yet. Add one above!</div>
              </Show>
            </div>
            <pre class="demo-code">{`const todos = signal<string[]>([]);
const newTodo = signal('');

const addTodo = () => {
  todos.value = [...todos.value, newTodo.value];
  newTodo.value = '';
};`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
