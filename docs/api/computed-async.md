# Async Computed API (Removed in v3.1.0)

:::warning DEPRECATED
The `computedAsync` API has been removed in v3.1.0. This API was rarely used and not part of core reactive patterns.

For async operations, use the `effect()` API with manual state management instead.
:::

## Migration Guide

### Before (computedAsync)

```typescript
import { zen, computedAsync, subscribe } from '@sylphx/zen';

const userId = zen(1);

const user = computedAsync([userId], async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});
```

### After (effect + zen)

```typescript
import { zen, effect, subscribe } from '@sylphx/zen';

const userId = zen(1);
const user = zen(null);
const loading = zen(false);
const error = zen(null);

// Use effect to handle async operations
effect(() => {
  const id = userId.value;

  loading.value = true;
  error.value = null;

  fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => {
      user.value = data;
      loading.value = false;
    })
    .catch(err => {
      error.value = err;
      loading.value = false;
    });
});

// Subscribe to individual states
subscribe(user, (data) => {
  console.log('User:', data);
});
```

## Why Was It Removed?

1. **Rarely Used**: Very few projects actually used `computedAsync`
2. **Not Core Pattern**: Async state management has many patterns - one-size-fits-all doesn't work well
3. **Better Alternatives**: Libraries like TanStack Query provide more comprehensive async state management
4. **Bundle Size**: Removing it keeps the core library minimal

## Better Alternatives

### For Simple Async Operations

Use `effect()` as shown above for simple async operations.

### For Production Apps

For production applications with complex async state needs, consider dedicated libraries:

- **[TanStack Query](https://tanstack.com/query)** - Comprehensive async state management
- **[SWR](https://swr.vercel.app/)** - React Hooks for data fetching
- **Custom Patterns** - Build patterns that fit your specific needs using `effect()`

### Custom Async Pattern

You can create your own reusable async pattern:

```typescript
import { zen, effect } from '@sylphx/zen';

export function asyncComputed<T>(
  deps: () => any[],
  asyncFn: (...args: any[]) => Promise<T>
) {
  const data = zen<T | null>(null);
  const loading = zen(true);
  const error = zen<Error | null>(null);

  effect(() => {
    const args = deps();

    loading.value = true;
    error.value = null;

    asyncFn(...args)
      .then(result => {
        data.value = result;
        loading.value = false;
      })
      .catch(err => {
        error.value = err;
        loading.value = false;
      });
  });

  return { data, loading, error };
}

// Usage
const userId = zen(1);
const user = asyncComputed(
  () => [userId.value],
  async (id) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  }
);
```

## See Also

- [Effect API](/api/effect) - Side effects with auto-tracking
- [Core Concepts](/guide/core-concepts) - Understanding reactivity
- [Async Patterns](/patterns/async-state) - Async state management patterns
