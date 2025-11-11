# Async Computed API

## computedAsync()

Creates a reactive async computed value that automatically re-executes when dependencies change.

```typescript
function computedAsync<T>(
  dependencies: AnyZen | ReadonlyArray<AnyZen>,
  asyncFn: (...values: unknown[]) => Promise<T>,
  options?: ComputedAsyncOptions
): ComputedAsyncZen<T>
```

### Parameters

- `dependencies` - Single Zen store or array of stores to depend on
- `asyncFn` - Async function that computes the value from dependencies
- `options` - Optional configuration:
  - `staleTime?: number` - Time in ms until data is considered stale (triggers background refetch)
  - `equalityFn?: (a: T, b: T) => boolean` - Custom equality function to determine if data changed

### Returns

A read-only Zen store with async state containing `loading`, `data`, and `error`.

### Basic Example

```typescript
import { zen, computedAsync, subscribe } from '@sylphx/zen';

const userId = zen(1);

const user = computedAsync([userId], async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Subscribe to get updates
subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// Automatically refetches when dependency changes!
userId.value = 2; // ✅ Triggers automatic refetch
```

---

## State Structure

The `computedAsync` value has the following state structure:

```typescript
interface ZenAsyncState<T> {
  loading: boolean;
  data: T | undefined;
  error: Error | undefined;
}
```

### State Transitions

```typescript
// Initial state
{ loading: false, data: undefined, error: undefined }

// Loading
{ loading: true, data: undefined, error: undefined }

// Success
{ loading: false, data: result, error: undefined }

// Error
{ loading: false, data: undefined, error: Error }

// Loading with cached data
{ loading: true, data: previousData, error: undefined }
```

---

## Characteristics

### Automatic Reactivity

Automatically re-executes when dependencies change:

```typescript
const searchTerm = zen('react');

const searchResults = computedAsync([searchTerm], async (term) => {
  const response = await fetch(`/api/search?q=${term}`);
  return response.json();
});

subscribe(searchResults, (state) => {
  console.log('Results:', state.data);
});

// Automatically refetches when search term changes
searchTerm.value = 'vue'; // ✅ Triggers new API call
```

### Race Condition Protection

Handles rapid dependency changes gracefully:

```typescript
const query = zen('a');

const results = computedAsync([query], async (q) => {
  await delay(1000);
  return fetchResults(q);
});

query.value = 'b'; // Start request 1
query.value = 'c'; // Start request 2

// Even if request 1 completes after request 2,
// only request 2's result will be used (latest wins)
```

### Lazy Evaluation

Only executes when someone is listening:

```typescript
const data = computedAsync([input], async (val) => {
  console.log('Fetching...');
  return fetchData(val);
});

// No fetch yet - no listeners

const unsub = subscribe(data, (state) => {
  console.log(state.data);
}); // Now it fetches!

unsub(); // Stop fetching when no listeners
```

### Keeps Previous Data During Loading

Maintains previous data while loading new data:

```typescript
subscribe(user, (state) => {
  if (state.loading && state.data) {
    // Show previous data with loading indicator
    console.log('Updating...', state.data);
  }
});
```

---

## Multiple Dependencies

Depend on multiple stores:

```typescript
const userId = zen(1);
const includeProfile = zen(true);

const userData = computedAsync(
  [userId, includeProfile],
  async (id, include) => {
    const url = `/api/users/${id}${include ? '?profile=true' : ''}`;
    const response = await fetch(url);
    return response.json();
  }
);
```

---

## Chaining

Chain async computed values:

```typescript
const userId = zen(1);

const user = computedAsync([userId], async (id) => {
  return fetchUser(id);
});

const posts = computedAsync([user], async (state) => {
  if (!state.data) return [];
  return fetchUserPosts(state.data.id);
});
```

---

## Framework Integration

### React

```tsx
import { useStore } from '@sylphx/zen-react';

const userId = zen(1);
const user = computedAsync([userId], fetchUser);

function UserProfile() {
  const { loading, data, error } = useStore(user);

  if (loading && !data) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No user</div>;

  return <div>{data.name}</div>;
}
```

### Vue

```vue
<script setup>
import { useStore } from '@sylphx/zen-vue';

const userId = zen(1);
const user = computedAsync([userId], fetchUser);

const state = useStore(user);
</script>

<template>
  <div v-if="state.loading && !state.data">Loading...</div>
  <div v-else-if="state.error">Error: {{ state.error.message }}</div>
  <div v-else-if="state.data">{{ state.data.name }}</div>
</template>
```

---

## Options

### staleTime

Specify how long data is considered fresh:

```typescript
const user = computedAsync(
  [userId],
  fetchUser,
  { staleTime: 60000 } // 1 minute
);
```

### equalityFn

Custom equality function to prevent unnecessary updates:

```typescript
const data = computedAsync(
  [source],
  fetchData,
  {
    equalityFn: (a, b) => a.id === b.id
  }
);
```

---

## Common Patterns

### Search with Debouncing

```typescript
const searchTerm = zen('');
let debounceTimer: NodeJS.Timeout;

subscribe(searchTerm, (term) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearchTerm.value = term;
  }, 300);
});

const debouncedSearchTerm = zen('');
const results = computedAsync([debouncedSearchTerm], async (term) => {
  if (!term) return [];
  return fetchSearchResults(term);
});
```

### Dependent Queries

```typescript
const userId = zen(1);

const user = computedAsync([userId], async (id) => {
  return fetchUser(id);
});

const projects = computedAsync([user], async (userState) => {
  if (!userState.data) return [];
  return fetchUserProjects(userState.data.id);
});
```

### Conditional Fetching

```typescript
const enabled = zen(true);
const query = zen('react');

const results = computedAsync([enabled, query], async (isEnabled, q) => {
  if (!isEnabled || !q) return null;
  return fetchResults(q);
});
```

### Pagination

```typescript
const page = zen(0);
const pageSize = zen(20);

const items = computedAsync([page, pageSize], async (p, size) => {
  const response = await fetch(`/api/items?page=${p}&limit=${size}`);
  return response.json();
});
```

---

## Error Handling

Errors are captured in the state:

```typescript
const data = computedAsync([input], async (val) => {
  const response = await fetch(`/api/data/${val}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
});

subscribe(data, (state) => {
  if (state.error) {
    console.error('Fetch failed:', state.error.message);
  }
});
```

---

## Disposal

Clean up resources when done:

```typescript
import { computedAsync, disposeAsync } from '@sylphx/zen';

const data = computedAsync([input], fetchData);

// Later, when no longer needed
disposeAsync(data);
```

---

## Best Practices

### ✅ Use for reactive async data

```typescript
// ✅ Good - automatically refetches on dependency change
const user = computedAsync([userId], fetchUser);
```

### ✅ Handle all states

```typescript
// ✅ Good - handles loading, data, and error
const { loading, data, error } = state;
if (loading) return <Spinner />;
if (error) return <Error error={error} />;
if (!data) return <Empty />;
return <Content data={data} />;
```

### ✅ Debounce user input

```typescript
// ✅ Good - debounce before creating computedAsync
const debouncedTerm = debounce(searchTerm, 300);
const results = computedAsync([debouncedTerm], search);
```

### ❌ Don't use for one-time fetches

```typescript
// ❌ Bad - use regular async function for one-time fetches
const data = computedAsync([], async () => fetchOnce());

// ✅ Good - use regular function
async function loadOnce() {
  const data = await fetchOnce();
  store.value = data;
}
```

---

## Comparison with Manual Async

### Manual Approach

```typescript
const data = zen<User | null>(null);
const loading = zen(false);
const error = zen<Error | null>(null);

subscribe(userId, async (id) => {
  loading.value = true;
  error.value = null;
  try {
    data.value = await fetchUser(id);
  } catch (err) {
    error.value = err as Error;
  } finally {
    loading.value = false;
  }
});
```

### computedAsync Approach

```typescript
const user = computedAsync([userId], fetchUser);

// Automatically handles loading, error, and race conditions!
```

---

## Type Definition

```typescript
interface ComputedAsyncZen<T> {
  readonly value: ZenAsyncState<T>;
}

interface ZenAsyncState<T> {
  loading: boolean;
  data: T | undefined;
  error: Error | undefined;
}

interface ComputedAsyncOptions {
  staleTime?: number;
  equalityFn?: <T>(a: T, b: T) => boolean;
}
```

---

## See Also

- [Async Operations Guide](/guide/async) - Detailed guide
- [Core API](/api/core) - Basic stores
- [Computed API](/api/computed) - Sync computed values
