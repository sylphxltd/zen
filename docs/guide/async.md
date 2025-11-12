# Async Operations

Zen provides flexible approaches for handling asynchronous operations using core primitives.

## Async State Pattern (Recommended)

For reactive async data fetching with loading/error states, use the [Async State Pattern](/patterns/async-state):

```typescript
import { zen, effect } from '@sylphx/zen';
import { createAsyncState } from './patterns/async-state';

const userId = zen(1);

const user = createAsyncState(
  async () => {
    const res = await fetch(`/api/user/${userId.value}`);
    return res.json();
  },
  [userId] // Auto-refetch when userId changes
);

// Access state
console.log(user.state.value.loading); // boolean
console.log(user.state.value.data);    // User | undefined
console.log(user.state.value.error);   // Error | undefined

// Manual refetch
user.refetch();
```

**See [Async State Pattern](/patterns/async-state) for full documentation.**

---

## Manual Pattern

For simple cases, manage loading/error states manually:

```typescript
import { zen } from '@sylphx/zen';

const data = zen<User | null>(null);
const loading = zen(false);
const error = zen<Error | null>(null);

async function fetchUser(id: number) {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/users/${id}`);
    data.value = await response.json();
  } catch (err) {
    error.value = err as Error;
  } finally {
    loading.value = false;
  }
}
```

---

## React Integration

### With Async State Pattern

```tsx
import { useZen } from '@sylphx/zen-react';

function UserProfile() {
  const { loading, data, error } = useZen(user.state);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No user</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={user.refetch}>Refresh</button>
    </div>
  );
}
```

### Manual Pattern

```tsx
import { useZen } from '@sylphx/zen-react';
import { useEffect } from 'react';

const users = zen<User[]>([]);
const loading = zen(false);

function UserList() {
  const data = useZen(users);
  const isLoading = useZen(loading);

  useEffect(() => {
    loading.value = true;
    fetch('/api/users')
      .then(res => res.json())
      .then(data => users.value = data)
      .finally(() => loading.value = false);
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Vue Integration

```vue
<script setup>
import { useZen } from '@sylphx/zen-vue';

const state = useZen(user.state);
</script>

<template>
  <div v-if="state.loading">Loading...</div>
  <div v-else-if="state.error">Error: {{ state.error.message }}</div>
  <div v-else-if="state.data">
    <h1>{{ state.data.name }}</h1>
    <button @click="user.refetch">Refresh</button>
  </div>
</template>
```

---

## Common Patterns

### Debouncing

```typescript
import { zen, effect } from '@sylphx/zen';

const searchTerm = zen('');
const debouncedQuery = zen('');

let timeout: any;
effect(() => {
  const term = searchTerm.value;
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    debouncedQuery.value = term;
  }, 300);
});

// Use debouncedQuery in async state
const results = createAsyncState(
  async () => {
    const query = debouncedQuery.value;
    if (!query) return [];
    const res = await fetch(`/api/search?q=${query}`);
    return res.json();
  },
  [debouncedQuery]
);
```

### Cancellation

```typescript
let abortController: AbortController | null = null;

async function fetchData() {
  abortController?.abort();
  abortController = new AbortController();

  try {
    const res = await fetch('/api/data', {
      signal: abortController.signal
    });
    return res.json();
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  }
}
```

See [Async State Pattern](/patterns/async-state) for full cancellation example.

### Optimistic Updates

```typescript
const todos = zen<Todo[]>([]);

async function toggleTodo(id: number) {
  // Optimistic update
  const oldTodos = todos.value;
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  try {
    await fetch(`/api/todos/${id}/toggle`, { method: 'POST' });
  } catch (err) {
    // Rollback on error
    todos.value = oldTodos;
  }
}
```

### Polling

```typescript
const data = zen<Data | null>(null);

let pollInterval: any;

function startPolling(intervalMs = 5000) {
  const poll = async () => {
    const res = await fetch('/api/data');
    data.value = await res.json();
  };

  poll(); // Initial fetch
  pollInterval = setInterval(poll, intervalMs);
}

function stopPolling() {
  clearInterval(pollInterval);
}
```

### Pagination

```typescript
const items = zen<Item[]>([]);
const page = zen(0);
const hasMore = zen(true);
const loading = zen(false);

async function loadMore() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const res = await fetch(`/api/items?page=${page.value}&limit=20`);
    const data = await res.json();

    items.value = [...items.value, ...data.items];
    hasMore.value = data.hasMore;
    page.value++;
  } finally {
    loading.value = false;
  }
}
```

### Parallel Requests

```typescript
async function loadAll() {
  const [usersRes, postsRes] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/posts')
  ]);

  users.value = await usersRes.json();
  posts.value = await postsRes.json();
}
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    }
  }
}
```

---

## Next Steps

- **[Async State Pattern](/patterns/async-state)** - Full async state documentation
- **[Store Pattern](/patterns/store-pattern)** - Zustand-style stores
- **[Computed Values](/guide/computed)** - Derived state
- **[Batching](/guide/batching)** - Optimize updates
