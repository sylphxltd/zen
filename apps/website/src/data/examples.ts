/**
 * Shared examples data source
 * Used by both Examples page and Playground
 */

export interface Example {
  id: string;
  title: string;
  description: string;
  icon: string; // iconify icon name
  category: 'basic' | 'components' | 'async' | 'advanced';
  code: string;
}

export const examples: Example[] = [
  {
    id: 'counter',
    title: 'Counter',
    description: 'Basic reactive state with signal() and computed()',
    icon: 'lucide:hash',
    category: 'basic',
    code: `// Create reactive state
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Create component
const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'var(--text)' }}>
    <h2>Counter: {count.value}</h2>
    <p>Doubled: {doubled.value}</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={() => count.value--}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        -
      </button>
      <button
        onClick={() => count.value++}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        +
      </button>
      <button
        onClick={() => count.value = 0}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        Reset
      </button>
    </div>
  </div>
);`,
  },
  {
    id: 'finegrained',
    title: 'Fine-grained Reactivity',
    description: 'Component renders once, only signals update',
    icon: 'lucide:zap',
    category: 'basic',
    code: `// Fine-grained reactivity - component only renders ONCE
console.log('🎨 Component created');

const count = signal(0);
const renderCount = signal(0);

// Timer at component level (SolidJS style)
const timer = setInterval(() => {
  count.value++;
  console.log(\`⏰ Timer tick: count = \${count.value}\`);
}, 1000);

// Register cleanup - will run when component is removed
onCleanup(() => {
  console.log('🧹 Cleaning up timer');
  clearInterval(timer);
});

// Track effect runs (not component re-renders)
effect(() => {
  renderCount.value++;
  console.log(\`✨ Effect ran: count = \${count.value}\`);
});

const app = (
  <div style={{
    padding: '20px',
    fontFamily: 'sans-serif',
    color: 'var(--text)',
    backgroundColor: 'var(--bg)',
    borderRadius: '8px'
  }}>
    <h2 style={{ marginBottom: '16px' }}>⚡ Fine-grained Reactivity</h2>
    <div style={{
      padding: '16px',
      backgroundColor: 'var(--bg-light)',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <p style={{ fontSize: '24px', margin: '8px 0' }}>
        Count: <strong>{count.value}</strong>
      </p>
      <p style={{ fontSize: '16px', margin: '8px 0', opacity: 0.7 }}>
        Effect runs: {renderCount.value}
      </p>
    </div>
    <div style={{
      padding: '12px',
      backgroundColor: 'var(--bg-lighter)',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'monospace'
    }}>
      <p style={{ margin: '4px 0' }}>✅ Component created ONCE</p>
      <p style={{ margin: '4px 0' }}>✅ Only text nodes update</p>
      <p style={{ margin: '4px 0' }}>✅ No re-renders, no VDOM diff</p>
      <p style={{ margin: '4px 0' }}>✅ onCleanup clears timer on re-run</p>
      <p style={{ margin: '4px 0', marginTop: '12px', opacity: 0.7 }}>
        Watch console for cleanup logs 👉
      </p>
    </div>
  </div>
);`,
  },
  {
    id: 'todo',
    title: 'Todo List',
    description: 'List rendering with For component and state management',
    icon: 'lucide:check-square',
    category: 'components',
    code: `// Todo list example
const todos = signal([]);
const input = signal('');

const addTodo = () => {
  if (input.value.trim()) {
    todos.value = [...todos.value, { id: Date.now(), text: input.value, done: false }];
    input.value = '';
  }
};

const toggleTodo = (id) => {
  todos.value = todos.value.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
};

const app = (
  <div style={{
    padding: '20px',
    fontFamily: 'sans-serif',
    maxWidth: '500px',
    color: 'var(--text)'
  }}>
    <h2 style={{ marginBottom: '16px' }}>Todo List</h2>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <input
        type="text"
        value={input.value}
        onInput={(e) => input.value = e.target.value}
        placeholder="Add a todo..."
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          backgroundColor: 'var(--bg)',
          color: 'var(--text)'
        }}
      />
      <button
        onClick={addTodo}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Add
      </button>
    </div>
    <div>
      {todos.value.map(todo => (
        <div key={todo.id} style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '8px',
          padding: '8px',
          backgroundColor: 'var(--bg-light)',
          borderRadius: '4px'
        }}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{
            textDecoration: todo.done ? 'line-through' : 'none',
            opacity: todo.done ? 0.5 : 1
          }}>
            {todo.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);`,
  },
  {
    id: 'form',
    title: 'Form Validation',
    description: 'Real-time form validation with computed values',
    icon: 'lucide:file-text',
    category: 'components',
    code: `// Form with validation
const name = signal('');
const email = signal('');
const submitted = signal(false);

const isValid = computed(() =>
  name.value.length > 0 && email.value.includes('@')
);

const handleSubmit = () => {
  if (isValid.value) {
    submitted.value = true;
  }
};

const app = (
  <div style={{
    padding: '20px',
    fontFamily: 'sans-serif',
    maxWidth: '400px',
    color: 'var(--text)'
  }}>
    <h2 style={{ marginBottom: '16px' }}>Contact Form</h2>
    <Show when={computed(() => !submitted.value)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Name:</label>
          <input
            type="text"
            value={name.value}
            onInput={(e) => name.value = e.target.value}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email:</label>
          <input
            type="email"
            value={email.value}
            onInput={(e) => email.value = e.target.value}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)'
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isValid.value}
          style={{
            padding: '10px 16px',
            opacity: isValid.value ? 1 : 0.5,
            cursor: isValid.value ? 'pointer' : 'not-allowed',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Submit
        </button>
      </div>
    </Show>
    <Show when={submitted}>
      <div style={{
        color: 'var(--success)',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-light)',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '8px' }}>✓ Form submitted!</h3>
        <p style={{ margin: '4px 0' }}>Name: {name.value}</p>
        <p style={{ margin: '4px 0' }}>Email: {email.value}</p>
      </div>
    </Show>
  </div>
);`,
  },
  {
    id: 'async',
    title: 'Async Data Fetching',
    description: 'Loading states and error handling',
    icon: 'lucide:loader',
    category: 'async',
    code: `// Async data fetching
const loading = signal(false);
const data = signal(null);
const error = signal(null);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch('https://api.github.com/repos/zenjs/zen');
    const json = await res.json();
    data.value = json;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const app = (
  <div style={{
    padding: '20px',
    fontFamily: 'sans-serif',
    color: 'var(--text)'
  }}>
    <h2 style={{ marginBottom: '16px' }}>GitHub Repo Info</h2>
    <button
      onClick={fetchData}
      disabled={loading.value}
      style={{
        padding: '10px 16px',
        cursor: loading.value ? 'not-allowed' : 'pointer',
        backgroundColor: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        opacity: loading.value ? 0.6 : 1
      }}
    >
      {loading.value ? 'Loading...' : 'Fetch Data'}
    </button>

    <Show when={error}>
      <div style={{
        color: 'var(--danger)',
        marginTop: '20px',
        padding: '12px',
        backgroundColor: 'var(--bg-light)',
        borderRadius: '4px'
      }}>
        Error: {error.value}
      </div>
    </Show>

    <Show when={computed(() => data.value !== null)}>
      {(d) => (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: 'var(--bg-light)',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '8px' }}>{d.name}</h3>
          <p style={{ marginBottom: '12px', opacity: 0.8 }}>{d.description}</p>
          <p style={{ margin: '4px 0' }}>⭐ Stars: {d.stargazers_count}</p>
          <p style={{ margin: '4px 0' }}>🍴 Forks: {d.forks_count}</p>
        </div>
      )}
    </Show>
  </div>
);`,
  },
];

export const categories = [
  { id: 'basic', name: 'Basic', icon: 'lucide:book-open' },
  { id: 'components', name: 'Components', icon: 'lucide:layout' },
  { id: 'async', name: 'Async', icon: 'lucide:cloud' },
  { id: 'advanced', name: 'Advanced', icon: 'lucide:sparkles' },
] as const;
