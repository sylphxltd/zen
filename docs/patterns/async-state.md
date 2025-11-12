# Async State Pattern

This pattern shows how to implement async data fetching with loading/error states using Zen's core primitives.

## Basic Pattern

```typescript
import { zen, effect } from '@sylphx/zen';

function createAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: AnyZen[] = []
) {
  const state = zen<{
    loading: boolean;
    data: T | undefined;
    error: Error | undefined;
  }>({
    loading: false,
    data: undefined,
    error: undefined
  });

  const execute = async () => {
    state.value = { loading: true, data: state.value.data, error: undefined };

    try {
      const result = await asyncFn();
      state.value = { loading: false, data: result, error: undefined };
    } catch (err) {
      state.value = {
        loading: false,
        data: undefined,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  };

  // Auto-execute on deps change
  if (deps.length > 0) {
    effect(() => {
      // Track all deps
      deps.forEach(d => d.value);
      execute();
    });
  } else {
    // Manual mode - call execute() yourself
    execute();
  }

  return { state, refetch: execute };
}
```

## Usage

### React Example

```tsx
import { createAsyncState } from './patterns/async-state';
import { useZen } from '@sylphx/zen-react';

const userId = zen(1);

const user = createAsyncState(
  async () => {
    const res = await fetch(`/api/user/${userId.value}`);
    return res.json();
  },
  [userId] // Refetch when userId changes
);

function UserProfile() {
  const { loading, data, error } = useZen(user.state);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={user.refetch}>Refresh</button>
    </div>
  );
}
```

### Vue Example

```vue
<script setup>
import { createAsyncState } from './patterns/async-state';
import { useZen } from '@sylphx/zen-vue';

const userId = zen(1);

const user = createAsyncState(
  async () => {
    const res = await fetch(`/api/user/${userId.value}`);
    return res.json();
  },
  [userId]
);

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

## Advanced Pattern with Abort Controller

For better control over async operations:

```typescript
function createAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: AnyZen[] = []
) {
  const state = zen<{
    loading: boolean;
    data: T | undefined;
    error: Error | undefined;
  }>({
    loading: false,
    data: undefined,
    error: undefined
  });

  let abortController: AbortController | null = null;

  const execute = async () => {
    // Abort previous request
    abortController?.abort();
    abortController = new AbortController();

    state.value = { loading: true, data: state.value.data, error: undefined };

    try {
      const result = await asyncFn();

      // Check if aborted
      if (abortController.signal.aborted) return;

      state.value = { loading: false, data: result, error: undefined };
    } catch (err) {
      if (abortController.signal.aborted) return;

      state.value = {
        loading: false,
        data: undefined,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
  };

  // Auto-execute on deps change
  if (deps.length > 0) {
    effect(() => {
      deps.forEach(d => d.value);
      execute();
    });
  }

  return {
    state,
    refetch: execute,
    abort: () => abortController?.abort()
  };
}
```

### Usage with Abort

```typescript
const search = zen('');

const results = createAsyncState(
  async () => {
    const res = await fetch(`/api/search?q=${search.value}`);
    return res.json();
  },
  [search]
);

// Typing fast will abort previous requests
search.value = 'a';
search.value = 'ab';
search.value = 'abc'; // Only this request completes

// Manual abort
results.abort();
```

## Comparison with React Query / SWR

| Feature | React Query/SWR | Zen Pattern |
|---------|----------------|-------------|
| **Bundle Size** | ~13KB | ~0 bytes (uses core) |
| **Framework** | React only | All frameworks |
| **Customization** | Limited | Full control |
| **Caching** | Built-in | Manual (simple to add) |
| **Deduplication** | Built-in | Manual |

## Adding Caching

```typescript
const cache = new Map<string, any>();

function createCachedAsyncState<T>(
  key: string,
  asyncFn: () => Promise<T>,
  deps: AnyZen[] = []
) {
  const result = createAsyncState(asyncFn, deps);

  // Check cache on mount
  if (cache.has(key)) {
    result.state.value = {
      loading: false,
      data: cache.get(key),
      error: undefined
    };
  }

  // Update cache on success
  effect(() => {
    const { loading, data, error } = result.state.value;
    if (!loading && !error && data !== undefined) {
      cache.set(key, data);
    }
  });

  return result;
}
```

## Why Not Include in Core?

The async state pattern is **UI-focused** and doesn't belong in core because:

1. **Backend doesn't need loading states** - Just use `async/await` directly
2. **Different UIs need different patterns** - Some want optimistic updates, some want caching, etc.
3. **Flexibility** - Users can customize to their exact needs
4. **Composability** - Can combine with other patterns freely

By providing this as a **pattern** instead of a core API, users get:
- ✅ Full control over behavior
- ✅ No bundle size overhead if not used
- ✅ Easy to customize (abort, caching, retries, etc.)
- ✅ Learn how Zen works by reading the pattern
