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
    <section class="py-16 px-0 bg-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <h2 class="text-5xl font-bold text-center mb-16 text-text">Live Demos</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Counter Demo */}
          <div class="bg-bg border border-border rounded-zen p-8">
            <h3 class="text-2xl font-semibold mb-6 text-text">Counter</h3>
            <div class="mb-6">
              <div class="text-center mb-8">
                <div class="text-6xl font-bold text-primary mb-4">{count.value}</div>
                <div class="text-xl text-text-muted">Doubled: {doubled.value}</div>
              </div>
              <div class="flex gap-3 justify-center">
                <button
                  type="button"
                  class="px-6 py-2 bg-bg-lighter hover:bg-bg border border-border text-text font-medium rounded-zen transition-colors"
                  onClick={() => count.value--}
                >
                  -
                </button>
                <button
                  type="button"
                  class="px-6 py-2 bg-bg-lighter hover:bg-bg border border-border text-text font-medium rounded-zen transition-colors"
                  onClick={() => count.value++}
                >
                  +
                </button>
                <button
                  type="button"
                  class="px-6 py-2 bg-secondary hover:bg-secondary/80 text-white font-medium rounded-zen transition-colors"
                  onClick={() => {
                    count.value = 0;
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <pre class="bg-bg-lighter border border-border rounded-zen p-4 text-sm text-text-muted overflow-x-auto font-mono">{`const count = signal(0);
const doubled = computed(() => count.value * 2);

<div>{count.value}</div>
<div>Doubled: {doubled.value}</div>
<button onClick={() => count.value++}>+</button>`}</pre>
          </div>

          {/* Todo Demo */}
          <div class="bg-bg border border-border rounded-zen p-8">
            <h3 class="text-2xl font-semibold mb-6 text-text">Todo List</h3>
            <div class="mb-6">
              <div class="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTodo.value}
                  onInput={(e) => {
                    newTodo.value = (e.target as HTMLInputElement).value;
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a todo..."
                  class="flex-1 px-4 py-2 bg-bg-lighter border border-border rounded-zen text-text placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={addTodo}
                  class="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-zen transition-colors"
                >
                  Add
                </button>
              </div>
              <ul class="space-y-2">
                <For each={todos}>
                  {(todo, index) => (
                    <li class="flex items-center justify-between p-3 bg-bg-lighter border border-border rounded-zen">
                      <span class="text-text">{todo}</span>
                      <button
                        type="button"
                        onClick={() => removeTodo(index())}
                        class="w-8 h-8 flex items-center justify-center bg-bg hover:bg-border text-text-muted hover:text-text rounded transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </li>
                  )}
                </For>
              </ul>
              <Show when={() => todos.value.length === 0}>
                <div class="text-center text-text-muted py-8">No todos yet. Add one above!</div>
              </Show>
            </div>
            <pre class="bg-bg-lighter border border-border rounded-zen p-4 text-sm text-text-muted overflow-x-auto font-mono">{`const todos = signal<string[]>([]);
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
