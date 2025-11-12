# Store Pattern (Zustand-style)

This pattern shows how to create Zustand-style stores with Zen's core primitives.

## Basic Store

```typescript
import { zen } from '@sylphx/zen';

function createStore<T>(initialState: T) {
  const state = zen(initialState);

  return {
    state,
    get: () => state.value,
    set: (value: T | ((prev: T) => T)) => {
      state.value = typeof value === 'function'
        ? (value as (prev: T) => T)(state.value)
        : value;
    }
  };
}

// Usage
const store = createStore({ count: 0 });

store.set({ count: 1 });
store.set(prev => ({ count: prev.count + 1 }));
console.log(store.get()); // { count: 2 }
```

## Store with Actions (Zustand-style)

```typescript
function createStore<T, A extends Record<string, any>>(
  initialState: T,
  actions: (set: (fn: (state: T) => T) => void, get: () => T) => A
) {
  const state = zen(initialState);

  const set = (fn: (state: T) => T) => {
    state.value = fn(state.value);
  };

  const get = () => state.value;

  return {
    state,
    ...actions(set, get)
  };
}
```

### Usage

```typescript
// Define store
const counterStore = createStore(
  { count: 0 },
  (set, get) => ({
    increase: () => set(s => ({ count: s.count + 1 })),
    decrease: () => set(s => ({ count: s.count - 1 })),
    reset: () => set(() => ({ count: 0 })),
    increaseBy: (amount: number) => set(s => ({ count: s.count + amount })),
    getCount: () => get().count
  })
);

// Use store
counterStore.increase();
counterStore.increaseBy(5);
console.log(counterStore.getCount()); // 6
counterStore.reset();
```

### React Integration

```tsx
import { useZen } from '@sylphx/zen-react';

function Counter() {
  const { count } = useZen(counterStore.state);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={counterStore.increase}>+</button>
      <button onClick={counterStore.decrease}>-</button>
      <button onClick={counterStore.reset}>Reset</button>
    </div>
  );
}
```

### Vue Integration

```vue
<script setup>
import { useZen } from '@sylphx/zen-vue';

const state = useZen(counterStore.state);
</script>

<template>
  <div>
    <p>Count: {{ state.count }}</p>
    <button @click="counterStore.increase">+</button>
    <button @click="counterStore.decrease">-</button>
    <button @click="counterStore.reset">Reset</button>
  </div>
</template>
```

## Slices Pattern

For larger apps, split into slices:

```typescript
interface TodoSlice {
  todos: Todo[];
  addTodo: (text: string) => void;
  removeTodo: (id: string) => void;
}

interface UserSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

type AppStore = TodoSlice & UserSlice;

const createTodoSlice = (set: any, get: any): TodoSlice => ({
  todos: [],
  addTodo: (text) => set((state: AppStore) => ({
    todos: [...state.todos, { id: crypto.randomUUID(), text, done: false }]
  })),
  removeTodo: (id) => set((state: AppStore) => ({
    todos: state.todos.filter(t => t.id !== id)
  }))
});

const createUserSlice = (set: any, get: any): UserSlice => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
});

const appStore = createStore<AppStore, {}>(
  {
    ...createTodoSlice(null as any, null as any),
    ...createUserSlice(null as any, null as any)
  } as AppStore,
  (set, get) => ({
    ...createTodoSlice(set, get),
    ...createUserSlice(set, get)
  })
);
```

## Immer-style Updates

For easier nested updates:

```typescript
import { produce } from 'immer';

function createStore<T, A extends Record<string, any>>(
  initialState: T,
  actions: (set: (fn: (draft: T) => void) => void, get: () => T) => A
) {
  const state = zen(initialState);

  const set = (fn: (draft: T) => void) => {
    state.value = produce(state.value, fn);
  };

  const get = () => state.value;

  return {
    state,
    ...actions(set, get)
  };
}

// Usage - mutate draft directly
const store = createStore(
  { user: { profile: { name: 'John' } } },
  (set) => ({
    updateName: (name: string) => set(draft => {
      draft.user.profile.name = name; // Direct mutation!
    })
  })
);
```

## Middleware Pattern

Add logging, persistence, etc.:

```typescript
function createStore<T, A extends Record<string, any>>(
  initialState: T,
  actions: (set: any, get: any) => A,
  middleware: Array<(set: any) => any> = []
) {
  const state = zen(initialState);

  let set = (fn: (state: T) => T) => {
    state.value = fn(state.value);
  };

  // Apply middleware
  middleware.forEach(mw => {
    const originalSet = set;
    set = (fn) => mw(() => originalSet(fn));
  });

  const get = () => state.value;

  return {
    state,
    ...actions(set, get)
  };
}

// Logger middleware
const logger = (set: any) => (fn: any) => {
  console.log('Before:', set);
  set(fn);
  console.log('After:', set);
};

// Persistence middleware
const persist = (key: string) => (set: any) => (fn: any) => {
  set(fn);
  // Get the state after set - need access to zen instance
  // This is a simplified example
  localStorage.setItem(key, JSON.stringify(fn));
};

const store = createStore(
  { count: 0 },
  (set) => ({
    increase: () => set(s => ({ count: s.count + 1 }))
  }),
  [logger]
);
```

## Computed Values in Store

Combine with `computed` for derived state:

```typescript
import { zen, computed } from '@sylphx/zen';

const cartStore = createStore(
  {
    items: [
      { id: 1, price: 100, qty: 2 },
      { id: 2, price: 50, qty: 3 }
    ]
  },
  (set) => ({
    addItem: (item) => set(s => ({
      items: [...s.items, item]
    })),
    removeItem: (id) => set(s => ({
      items: s.items.filter(i => i.id !== id)
    }))
  })
);

// Derived values
const total = computed(() =>
  cartStore.state.value.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  )
);

const itemCount = computed(() =>
  cartStore.state.value.items.reduce(
    (sum, item) => sum + item.qty,
    0
  )
);

// Usage in React
function Cart() {
  const { items } = useZen(cartStore.state);
  const totalPrice = useZen(total);
  const count = useZen(itemCount);

  return (
    <div>
      <p>Items: {count}</p>
      <p>Total: ${totalPrice}</p>
      {/* ... */}
    </div>
  );
}
```

## Comparison with Zustand

| Feature | Zustand | Zen Store Pattern |
|---------|---------|-------------------|
| **Bundle Size** | ~3.5KB | ~0 bytes (uses core) |
| **Framework** | React-focused | All frameworks |
| **Immer** | Optional | Easy to add |
| **Middleware** | Built-in | Manual (shown above) |
| **DevTools** | Built-in | Manual |
| **Selectors** | Built-in | Use `computed()` |

## When to Use This Pattern

- ✅ You want a Zustand-like API
- ✅ You need global state with actions
- ✅ You're migrating from Zustand
- ✅ You want framework-agnostic stores

## Alternative: Direct Zen Usage

For simpler cases, you might not need the store pattern at all:

```typescript
// Direct zen usage
const count = zen(0);

function increase() {
  count.value++;
}

// In React
function Counter() {
  const value = useZen(count);
  return <button onClick={increase}>{value}</button>;
}
```

The store pattern is most useful when you have:
- Multiple related actions
- Complex state updates
- Need for middleware
- Migration from Zustand/Redux
