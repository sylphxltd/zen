# Select API

## select()

Creates a lightweight selector for deriving a value from a single source store. Optimized for performance with minimal overhead.

```typescript
function select<T, S>(
  source: AnyZen,
  selector: (value: S) => T,
  equalityFn?: (a: T, b: T) => boolean
): SelectZen<T, S>
```

### Parameters

- `source` - Single Zen store to derive from
- `selector` - Function that transforms the source value
- `equalityFn` - Optional equality function (defaults to `Object.is`)

### Returns

A read-only Zen store with the selected value.

### Basic Example

```typescript
import { zen, select } from '@sylphx/zen';

interface User {
  id: number;
  name: string;
  email: string;
}

const userStore = zen<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// Select only the name
const userName = select(userStore, (user) => user.name);

console.log(userName.value); // "John"

userStore.value = { ...userStore.value, name: 'Jane' };
console.log(userName.value); // "Jane"
```

---

## When to Use select() vs computed()

### Use `select()` when:
- ✅ Single source dependency
- ✅ Simple transformation (picking/mapping fields)
- ✅ Need maximum performance

### Use `computed()` when:
- ✅ Multiple dependencies
- ✅ Complex calculations
- ✅ Combining multiple stores

### Performance Comparison

```typescript
const state = zen({ count: 0, name: 'test' });

// ⚡ Faster - optimized for single source
const count1 = select(state, s => s.count);

// 🔶 Slightly slower - more flexible
const count2 = computed(() => state.value.count);
```

**Benchmark results:**
- `select()`: ~28M ops/s
- `computed()`: ~26M ops/s
- **Difference**: ~7% faster with `select()`

---

## Characteristics

### Automatic Updates

Selectors automatically update when source changes:

```typescript
const state = zen({ count: 0, text: 'hello' });
const count = select(state, s => s.count);

subscribe(count, (value) => {
  console.log('Count:', value);
});

state.value = { ...state.value, count: 5 }; // Triggers update
```

### Memoization

Results are cached using equality function:

```typescript
const state = zen({ items: [1, 2, 3] });

// Custom equality - only update if length changes
const length = select(
  state,
  s => s.items.length,
  (a, b) => a === b
);
```

### Lazy Evaluation

Only computes when subscribed:

```typescript
const expensive = select(state, (s) => {
  console.log('Computing...');
  return expensiveOperation(s);
});

// No log yet

subscribe(expensive, () => {}); // Now it computes!
```

### Read-only

Cannot be written to directly:

```typescript
const userName = select(user, u => u.name);

userName.value = 'test'; // ❌ Error - selectors are read-only
user.value = { ...user.value, name: 'test' }; // ✅ Update source
```

---

## Common Patterns

### Object Field Selection

```typescript
interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
  };
}

const state = zen<State>({ /* ... */ });

// Select nested field
const userName = select(state, s => s.user.profile.name);
const userAge = select(state, s => s.user.profile.age);
```

### Array Transformation

```typescript
const todos = zen([
  { id: 1, text: 'Buy milk', done: false },
  { id: 2, text: 'Walk dog', done: true }
]);

// Select only incomplete todos
const activeTodos = select(
  todos,
  list => list.filter(t => !t.done)
);

// Select todo count
const todoCount = select(todos, list => list.length);
```

### Computed Properties

```typescript
const user = zen({
  firstName: 'John',
  lastName: 'Doe'
});

const fullName = select(
  user,
  u => `${u.firstName} ${u.lastName}`
);
```

### Type Narrowing

```typescript
type Data = { type: 'user'; user: User } | { type: 'guest' };

const data = zen<Data>({ type: 'guest' });

const isUser = select(data, d => d.type === 'user');
const userName = select(data, d =>
  d.type === 'user' ? d.user.name : null
);
```

---

## Custom Equality Functions

### Shallow Equality

```typescript
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) return false;
  }

  return true;
}

const userData = select(
  user,
  u => ({ name: u.name, age: u.age }),
  shallowEqual
);
```

### Deep Equality (for objects)

```typescript
import { deepEqual } from 'fast-deep-equal';

const config = select(
  state,
  s => s.config,
  deepEqual
);
```

### Custom Logic

```typescript
// Only update if difference > threshold
const score = select(
  state,
  s => s.score,
  (a, b) => Math.abs(a - b) < 10
);
```

---

## Chaining Selectors

Chain multiple selectors for composition:

```typescript
const state = zen({
  users: [
    { id: 1, name: 'John', role: 'admin' },
    { id: 2, name: 'Jane', role: 'user' }
  ]
});

// First level: select users array
const users = select(state, s => s.users);

// Second level: select only admins
const admins = select(users, list =>
  list.filter(u => u.role === 'admin')
);

// Third level: select admin names
const adminNames = select(admins, list =>
  list.map(u => u.name)
);
```

---

## Framework Integration

### React

```tsx
import { select } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const state = zen({ count: 0, text: 'hello' });
const count = select(state, s => s.count);

function Counter() {
  const value = useStore(count);
  return <div>Count: {value}</div>;
}
```

### Vue

```vue
<script setup>
import { select } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const state = zen({ count: 0, text: 'hello' });
const count = select(state, s => s.count);

const value = useStore(count);
</script>

<template>
  <div>Count: {{ value }}</div>
</template>
```

---

## Performance Optimization

### Memoize Expensive Selectors

```typescript
// ❌ Bad - creates new array on every access
const items = select(state, s => s.list.map(x => x * 2));

// ✅ Good - use equality to prevent unnecessary updates
const items = select(
  state,
  s => s.list.map(x => x * 2),
  (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
);
```

### Split Complex Selectors

```typescript
// ❌ Bad - recomputes everything when any field changes
const combined = select(state, s => ({
  users: processUsers(s.users),
  posts: processPosts(s.posts),
  stats: calculateStats(s.data)
}));

// ✅ Good - split into separate selectors
const users = select(state, s => processUsers(s.users));
const posts = select(state, s => processPosts(s.posts));
const stats = select(state, s => calculateStats(s.data));
```

---

## Comparison with Zustand

Zen's `select()` is similar to Zustand's `useStore(selector)`:

### Zustand

```typescript
const useStore = create((set) => ({
  count: 0,
  text: 'hello',
  increment: () => set(s => ({ count: s.count + 1 }))
}));

// In component
const count = useStore(state => state.count);
```

### Zen

```typescript
const state = zen({ count: 0, text: 'hello' });
const count = select(state, s => s.count);

// In component
const value = useStore(count);
```

**Key Differences:**
- Zen: Selector is **outside component** (can be shared)
- Zustand: Selector is **inside component** (per-component)

---

## Type Safety

Full TypeScript support with type inference:

```typescript
interface User {
  id: number;
  name: string;
}

const user = zen<User>({ id: 1, name: 'John' });

// ✅ Type inferred as SelectZen<string, User>
const userName = select(user, u => u.name);

// ✅ Type inferred as SelectZen<number, User>
const userId = select(user, u => u.id);

// ❌ TypeScript error - property doesn't exist
const invalid = select(user, u => u.email);
```

---

## Best Practices

### ✅ Keep selectors pure

```typescript
// ✅ Good - pure function
const name = select(user, u => u.name);

// ❌ Bad - side effects
const name = select(user, u => {
  console.log('Getting name'); // Side effect
  return u.name;
});
```

### ✅ Use meaningful names

```typescript
// ✅ Good - clear intent
const userName = select(user, u => u.name);
const userEmail = select(user, u => u.email);

// ❌ Bad - unclear
const x = select(user, u => u.name);
const data = select(user, u => u.email);
```

### ✅ Memoize complex transformations

```typescript
// ✅ Good - custom equality for arrays
const sortedItems = select(
  items,
  list => [...list].sort(),
  (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
);
```

---

## No selectAsync

**Q: Is there a `selectAsync()` for async selectors?**

**A:** No, use `computedAsync()` instead:

```typescript
// ❌ No selectAsync
// const user = selectAsync(userId, async (id) => fetchUser(id));

// ✅ Use computedAsync
const user = computedAsync([userId], async (id) => fetchUser(id));
```

**Reason:** `select()` is optimized for synchronous single-source selection. For async operations, `computedAsync()` provides proper loading/error states.

---

## See Also

- [Core API](/api/core) - Basic stores
- [Computed API](/api/computed) - Multi-source derivations
- [Async Computed API](/api/computed-async) - Async derivations
- [Utilities API](/api/utilities) - Subscribe and batch functions
