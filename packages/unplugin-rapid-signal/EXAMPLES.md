# unplugin-rapid-signal Examples

Complete examples for all supported frameworks.

---

## Table of Contents

- [React](#react)
- [Vue](#vue)
- [Svelte](#svelte)
- [Rapid Framework](#rapid-framework)
- [Advanced](#advanced)

---

## React

### Basic Counter (Runtime Mode)

**1. Install dependencies:**
```bash
npm install vite @vitejs/plugin-react unplugin-rapid-signal @rapid/signal
```

**2. Configure Vite:**
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    react(),
    zenSignal(),  // Auto-detects React + configures runtime
  ],
});
```

**3. Create counter component:**
```tsx
// src/Counter.tsx
import { signal } from '@rapid/signal';

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => count.value++}>Increment</button>
      <button onClick={() => count.value--}>Decrement</button>
      <button onClick={() => count.value = 0}>Reset</button>
    </div>
  );
}
```

**4. Run:**
```bash
npm run dev
```

**That's it!** Signal auto-unwraps in JSX.

---

### TodoList (Computed Values)

```tsx
import { signal, computed } from '@rapid/signal';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const todos = signal<Todo[]>([]);
  const filter = signal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = computed(() => {
    const list = todos.value;
    switch (filter.value) {
      case 'active':
        return list.filter(t => !t.completed);
      case 'completed':
        return list.filter(t => t.completed);
      default:
        return list;
    }
  });

  const activeCount = computed(() =>
    todos.value.filter(t => !t.completed).length
  );

  function addTodo(text: string) {
    todos.value = [
      ...todos.value,
      { id: Date.now(), text, completed: false }
    ];
  }

  function toggleTodo(id: number) {
    todos.value = todos.value.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  }

  function deleteTodo(id: number) {
    todos.value = todos.value.filter(t => t.id !== id);
  }

  return (
    <div>
      <h1>Todos ({activeCount} active)</h1>

      <input
        type="text"
        placeholder="Add todo..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value) {
            addTodo(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />

      <div>
        <button onClick={() => filter.value = 'all'}>All</button>
        <button onClick={() => filter.value = 'active'}>Active</button>
        <button onClick={() => filter.value = 'completed'}>Completed</button>
      </div>

      <ul>
        {filteredTodos.value.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Compiler Mode (Production)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    react(),
    zenSignal({
      mode: process.env.NODE_ENV === 'production' ? 'compiler' : 'runtime'
    }),
  ],
});
```

**Benefits:**
- Dev: Runtime mode (fast builds, easy debugging)
- Prod: Compiler mode (20-30% faster rendering)

---

## Vue

### Basic Counter (Runtime Mode)

**1. Install dependencies:**
```bash
npm install vite @vitejs/plugin-vue unplugin-rapid-signal @rapid/signal
```

**2. Configure Vite:**
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    vue(),
    zenSignal(),  // Auto-detects Vue
  ],
});
```

**3. Create counter component:**
```vue
<!-- src/Counter.vue -->
<script setup>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<template>
  <div>
    <h1>Counter: {{ count }}</h1>
    <button @click="count.value++">Increment</button>
    <button @click="count.value--">Decrement</button>
    <button @click="count.value = 0">Reset</button>
  </div>
</template>
```

**That's it!** Vue templates auto-unwrap signals natively.

---

### Form Handling

```vue
<script setup>
import { signal, computed } from '@rapid/signal';

const email = signal('');
const password = signal('');
const confirmPassword = signal('');

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);

const isPasswordValid = computed(() =>
  password.value.length >= 8
);

const doPasswordsMatch = computed(() =>
  password.value === confirmPassword.value
);

const isFormValid = computed(() =>
  isEmailValid.value && isPasswordValid.value && doPasswordsMatch.value
);

function handleSubmit() {
  if (isFormValid.value) {
    console.log('Form submitted:', {
      email: email.value,
      password: password.value
    });
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input
        v-model="email.value"
        type="email"
        placeholder="Email"
      />
      <span v-if="email.value && !isEmailValid">
        Invalid email
      </span>
    </div>

    <div>
      <input
        v-model="password.value"
        type="password"
        placeholder="Password"
      />
      <span v-if="password.value && !isPasswordValid">
        Min 8 characters
      </span>
    </div>

    <div>
      <input
        v-model="confirmPassword.value"
        type="password"
        placeholder="Confirm password"
      />
      <span v-if="confirmPassword.value && !doPasswordsMatch">
        Passwords don't match
      </span>
    </div>

    <button :disabled="!isFormValid">
      Submit
    </button>
  </form>
</template>
```

---

## Svelte

### Basic Counter (Runtime Mode)

**1. Install dependencies:**
```bash
npm install vite @sveltejs/vite-plugin-svelte unplugin-rapid-signal @rapid/signal
```

**2. Configure Vite:**
```js
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    svelte(),
    zenSignal(),  // Auto-detects Svelte
  ],
});
```

**3. Configure Svelte preprocessor:**
```js
// svelte.config.js
import { zenSignalPreprocessor } from 'unplugin-rapid-signal/svelte-preprocessor';

export default {
  preprocess: [
    zenSignalPreprocessor(),
  ],
};
```

**4. Create counter component:**
```svelte
<!-- src/Counter.svelte -->
<script>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<div>
  <h1>Counter: {count}</h1>
  <button on:click={() => count.value++}>Increment</button>
  <button on:click={() => count.value--}>Decrement</button>
  <button on:click={() => count.value = 0}>Reset</button>
</div>
```

---

### Store Pattern

```svelte
<!-- src/store.js -->
<script context="module">
import { signal, computed } from '@rapid/signal';

export const cart = signal([]);

export const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const itemCount = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0)
);

export function addToCart(product) {
  const existing = cart.value.find(item => item.id === product.id);

  if (existing) {
    cart.value = cart.value.map(item =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    cart.value = [...cart.value, { ...product, quantity: 1 }];
  }
}

export function removeFromCart(productId) {
  cart.value = cart.value.filter(item => item.id !== productId);
}
</script>

<!-- src/Cart.svelte -->
<script>
import { cart, total, itemCount, removeFromCart } from './store.js';
</script>

<div>
  <h2>Cart ({itemCount})</h2>

  {#each cart.value as item}
    <div>
      <span>{item.name}</span>
      <span>${item.price} × {item.quantity}</span>
      <button on:click={() => removeFromCart(item.id)}>Remove</button>
    </div>
  {/each}

  <div>
    <strong>Total: ${total.toFixed(2)}</strong>
  </div>
</div>
```

---

## Rapid Framework

### Basic Counter (NO PLUGIN NEEDED!)

**1. Install dependencies:**
```bash
npm install vite @rapid/web @rapid/signal
```

**2. Configure Vite (OPTIONAL):**
```ts
// vite.config.ts
import { defineConfig } from 'vite';
// NO PLUGIN NEEDED! Rapid has native signal support.
// Only add zenSignal() if you want compiler mode (~10% faster):
// import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    // zenSignal(),  // OPTIONAL: enables compiler mode for extra speed
  ],
});
```

**3. Create counter component:**
```tsx
// src/Counter.tsx
import { signal } from '@rapid/signal';

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => count.value++}>Increment</button>
      <button onClick={() => count.value--}>Decrement</button>
      <button onClick={() => count.value = 0}>Reset</button>
    </div>
  );
}
```

**That's it!** Signals work natively in Rapid - no plugin configuration required.

---

## Advanced

### Derived State

```ts
import { signal, computed } from '@rapid/signal';

const firstName = signal('John');
const lastName = signal('Doe');

// Computed value (memoized)
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe" (auto-updates)
```

---

### Effects (Side Effects)

```ts
import { signal, effect } from '@rapid/signal';

const count = signal(0);

// Run side effect when count changes
effect(() => {
  console.log(`Count is now: ${count.value}`);
  document.title = `Count: ${count.value}`;
});

count.value++; // Logs + updates title
```

---

### Batched Updates

```ts
import { signal, batch } from '@rapid/signal';

const x = signal(0);
const y = signal(0);

// Without batching: triggers 2 updates
x.value = 10;
y.value = 20;

// With batching: triggers 1 update
batch(() => {
  x.value = 10;
  y.value = 20;
});
```

---

### Async Data Fetching

```tsx
import { signal, computed } from '@rapid/signal';

const userId = signal(1);
const userData = signal(null);
const loading = signal(false);
const error = signal(null);

// Fetch user when ID changes
effect(() => {
  const id = userId.value;
  loading.value = true;
  error.value = null;

  fetch(`https://api.example.com/users/${id}`)
    .then(res => res.json())
    .then(data => {
      userData.value = data;
      loading.value = false;
    })
    .catch(err => {
      error.value = err.message;
      loading.value = false;
    });
});

// React component
function UserProfile() {
  return (
    <div>
      <input
        type="number"
        value={userId.value}
        onChange={e => userId.value = parseInt(e.target.value)}
      />

      {loading.value && <p>Loading...</p>}
      {error.value && <p>Error: {error.value}</p>}
      {userData.value && (
        <div>
          <h2>{userData.value.name}</h2>
          <p>{userData.value.email}</p>
        </div>
      )}
    </div>
  );
}
```

---

### Global State Management

```ts
// store.ts
import { signal, computed } from '@rapid/signal';

// State
export const user = signal(null);
export const theme = signal('light');
export const notifications = signal([]);

// Computed
export const isLoggedIn = computed(() => user.value !== null);
export const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
);

// Actions
export function login(userData) {
  user.value = userData;
}

export function logout() {
  user.value = null;
  notifications.value = [];
}

export function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}

export function addNotification(notification) {
  notifications.value = [...notifications.value, notification];
}
```

```tsx
// App.tsx
import { user, theme, unreadCount, login, logout, toggleTheme } from './store';

function App() {
  return (
    <div data-theme={theme.value}>
      <header>
        {user.value ? (
          <>
            <span>Welcome, {user.value.name}</span>
            <span>Notifications: {unreadCount}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => login({ name: 'John' })}>Login</button>
        )}
        <button onClick={toggleTheme}>Toggle Theme</button>
      </header>
    </div>
  );
}
```

---

### Performance Monitoring

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default defineConfig({
  plugins: [
    zenSignal({
      mode: 'hybrid',  // Runtime in dev, compiler in prod
      debug: true,     // Enable logging
    }),
  ],
});
```

**Console output:**
```
[rapid-signal] Auto-detected framework: react
[rapid-signal] Hybrid mode: using 'runtime' (development)
[rapid-signal] Configuring React runtime mode (Vite)
```

---

### TypeScript Support

```tsx
import { signal, computed } from '@rapid/signal';

interface User {
  id: number;
  name: string;
  email: string;
}

// Typed signal
const user = signal<User | null>(null);

// Type inference in computed
const userName = computed(() => user.value?.name ?? 'Guest');

// Type-safe usage
function UserCard() {
  const currentUser = user.value;

  if (!currentUser) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <h2>{currentUser.name}</h2>
      <p>{currentUser.email}</p>
    </div>
  );
}
```

---

## Troubleshooting

### Signals not updating UI

**Problem:** Changes to signal don't trigger re-renders

**Solution:** Ensure plugin is configured:
```ts
// vite.config.ts
export default {
  plugins: [
    zenSignal(),  // Must be present!
  ],
};
```

### Build errors

**Problem:** TypeScript errors about signal types

**Solution:** Install `@rapid/signal`:
```bash
npm install @rapid/signal
```

### React: "jsxImportSource not found"

**Problem:** Custom JSX runtime not resolved

**Solution:** Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## More Examples

See the [official documentation](./README.md) for more details.
