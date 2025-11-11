# Async Operations

Zen provides two approaches for handling asynchronous operations:

1. **`computedAsync()`** - Reactive async computed values (recommended for most cases)
2. **Manual stores** - Separate stores for data, loading, and error states

## computedAsync() - Reactive Async (Recommended)

The simplest way to handle async operations is with `computedAsync()`, which automatically re-executes when dependencies change:

```typescript
import { zen, computedAsync, subscribe } from '@sylphx/zen';

const userId = zen(1);

// Automatically refetches when userId changes!
const user = computedAsync([userId], async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// Change dependency triggers automatic refetch
userId.value = 2;
```

**Benefits:**
- ✅ Automatic refetching when dependencies change
- ✅ Built-in loading/error states
- ✅ Race condition protection
- ✅ Lazy execution (only runs when subscribed)

See [Async Computed API](/api/computed-async) for full documentation.

---

## Manual Async Pattern

For more control, use separate stores for data, loading, and error states:

```typescript
import { zen } from '@sylphx/zen';

const dataStore = zen<User | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

async function fetchUser(id: number) {
  loadingStore.value = true;
  errorStore.value = null;

  try {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    dataStore.value = data;
  } catch (err) {
    errorStore.value = err as Error;
  } finally {
    loadingStore.value = false;
  }
}
```

## Loading States

### Simple Loading

```typescript
const loading = zen(false);
const data = zen<string | null>(null);

async function loadData() {
  loading.value = true;
  try {
    const response = await fetch('/api/data');
    data.value = await response.json();
  } finally {
    loading.value = false;
  }
}
```

### With Error Handling

```typescript
const loading = zen(false);
const data = zen<string | null>(null);
const error = zen<Error | null>(null);

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data.value = await response.json();
  } catch (err) {
    error.value = err as Error;
    data.value = null;
  } finally {
    loading.value = false;
  }
}
```

## React Integration

### Basic Async Component

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';
import { useEffect } from 'react';

const usersStore = zen<User[]>([]);
const loadingStore = zen(false);

function UserList() {
  const users = useStore(usersStore);
  const loading = useStore(loadingStore);

  useEffect(() => {
    loadingStore.value = true;
    fetch('/api/users')
      .then(res => res.json())
      .then(data => usersStore.value = data)
      .finally(() => loadingStore.value = false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### With Error Handling

```tsx
const dataStore = zen<Data | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

function DataDisplay() {
  const data = useStore(dataStore);
  const loading = useStore(loadingStore);
  const error = useStore(errorStore);

  useEffect(() => {
    loadingStore.value = true;
    errorStore.value = null;

    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => dataStore.value = data)
      .catch(err => errorStore.value = err)
      .finally(() => loadingStore.value = false);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

## Vue Integration

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const usersStore = zen<User[]>([]);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

const users = useStore(usersStore);
const loading = useStore(loadingStore);
const error = useStore(errorStore);

onMounted(async () => {
  loadingStore.value = true;
  errorStore.value = null;

  try {
    const response = await fetch('/api/users');
    usersStore.value = await response.json();
  } catch (err) {
    errorStore.value = err as Error;
  } finally {
    loadingStore.value = false;
  }
});
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>
```

## Debouncing

Debounce API calls when input changes frequently:

```typescript
import { zen, subscribe } from '@sylphx/zen';

const searchTerm = zen('');
const searchResults = zen<Result[]>([]);
const searching = zen(false);

let debounceTimer: NodeJS.Timeout;

subscribe(searchTerm, (term) => {
  clearTimeout(debounceTimer);

  if (!term) {
    searchResults.value = [];
    return;
  }

  debounceTimer = setTimeout(async () => {
    searching.value = true;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      searchResults.value = await response.json();
    } finally {
      searching.value = false;
    }
  }, 300);
});
```

### Debounce Helper

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const searchTerm = zen('');
const searchResults = zen<Result[]>([]);

const debouncedSearch = debounce(async (term: string) => {
  if (!term) return;
  const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
  searchResults.value = await response.json();
}, 300);

subscribe(searchTerm, debouncedSearch);
```

## Polling

Poll for updates at regular intervals:

```typescript
const data = zen<Data | null>(null);
const polling = zen(false);

let pollInterval: NodeJS.Timeout;

function startPolling(intervalMs = 5000) {
  polling.value = true;

  const poll = async () => {
    try {
      const response = await fetch('/api/data');
      data.value = await response.json();
    } catch (err) {
      console.error('Poll failed:', err);
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  pollInterval = setInterval(poll, intervalMs);
}

function stopPolling() {
  polling.value = false;
  clearInterval(pollInterval);
}
```

### With React

```tsx
function PollingComponent() {
  const data = useStore(data);
  const polling = useStore(polling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  return (
    <div>
      {polling && <span>Polling...</span>}
      <div>{JSON.stringify(data)}</div>
    </div>
  );
}
```

## Cancellation

Cancel in-flight requests:

```typescript
const data = zen<Data | null>(null);
const loading = zen(false);

let abortController: AbortController | null = null;

async function fetchData() {
  // Cancel previous request
  if (abortController) {
    abortController.abort();
  }

  abortController = new AbortController();
  loading.value = true;

  try {
    const response = await fetch('/api/data', {
      signal: abortController.signal
    });
    data.value = await response.json();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Fetch failed:', err);
    }
  } finally {
    loading.value = false;
  }
}
```

## Optimistic Updates

Update UI immediately, then sync with server:

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = zen<Todo[]>([]);

async function toggleTodo(id: number) {
  // Optimistic update
  const oldTodos = todos.value;
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  try {
    const response = await fetch(`/api/todos/${id}/toggle`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to toggle');
    }

    // Optionally sync with server response
    const updated = await response.json();
    todos.value = todos.value.map(todo =>
      todo.id === id ? updated : todo
    );
  } catch (err) {
    // Rollback on error
    todos.value = oldTodos;
    console.error('Failed to toggle todo:', err);
  }
}
```

## Pagination

Handle paginated API responses:

```typescript
const items = zen<Item[]>([]);
const page = zen(0);
const hasMore = zen(true);
const loading = zen(false);

async function loadMore() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  try {
    const response = await fetch(`/api/items?page=${page.value}&limit=20`);
    const data = await response.json();

    items.value = [...items.value, ...data.items];
    hasMore.value = data.hasMore;
    page.value++;
  } finally {
    loading.value = false;
  }
}
```

### Infinite Scroll with React

```tsx
function InfiniteList() {
  const items = useStore(itemsStore);
  const hasMore = useStore(hasMoreStore);
  const loading = useStore(loadingStore);

  const observerRef = useRef<IntersectionObserver>();
  const lastItemRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div>
      {items.map((item, index) => {
        if (index === items.length - 1) {
          return <div ref={lastItemRef} key={item.id}>{item.text}</div>;
        }
        return <div key={item.id}>{item.text}</div>;
      })}
      {loading && <div>Loading more...</div>}
    </div>
  );
}
```

## Parallel Requests

Fetch multiple resources in parallel:

```typescript
const users = zen<User[]>([]);
const posts = zen<Post[]>([]);
const loading = zen(false);

async function loadAll() {
  loading.value = true;

  try {
    const [usersResponse, postsResponse] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/posts')
    ]);

    users.value = await usersResponse.json();
    posts.value = await postsResponse.json();
  } finally {
    loading.value = false;
  }
}
```

## Sequential Requests

Fetch resources in sequence when one depends on another:

```typescript
const user = zen<User | null>(null);
const posts = zen<Post[]>([]);
const loading = zen(false);

async function loadUserAndPosts(userId: number) {
  loading.value = true;

  try {
    // First, fetch user
    const userResponse = await fetch(`/api/users/${userId}`);
    const userData = await userResponse.json();
    user.value = userData;

    // Then, fetch their posts
    const postsResponse = await fetch(`/api/users/${userId}/posts`);
    posts.value = await postsResponse.json();
  } finally {
    loading.value = false;
  }
}
```

## Retry Logic

Retry failed requests with exponential backoff:

```typescript
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  delay = 1000
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      return await response.json();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

const data = zen<Data | null>(null);

async function loadData() {
  try {
    data.value = await fetchWithRetry('/api/data');
  } catch (err) {
    console.error('All retries failed:', err);
  }
}
```

## Next Steps

- [Map Stores](/guide/maps) - Learn about map stores
- [Batching Updates](/guide/batching) - Optimize updates
- [Data Fetching Example](/examples/fetching) - See complete examples
