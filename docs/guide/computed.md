# Computed Values

Computed values are derived state that automatically updates when their dependencies change. They are one of Zen's most powerful features for managing reactive data.

## Basic Computed Values

Create a computed value from one or more stores:

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

## Characteristics

### Automatic Updates

Computed values recalculate automatically when dependencies change:

```typescript
const price = zen(10);
const quantity = zen(5);
const taxRate = zen(0.1);

const subtotal = computed(
  [price, quantity],
  (p, q) => p * q
);

const total = computed(
  [subtotal, taxRate],
  (sub, tax) => sub * (1 + tax)
);

console.log(total.value); // 55

quantity.value = 10;
console.log(total.value); // 110
```

### Lazy Evaluation

Computed values are only evaluated when accessed:

```typescript
const base = zen(10);

const expensive = computed([base], (x) => {
  console.log('Computing...');
  return x * x;
});

// No log yet - not evaluated

console.log(expensive.value); // Logs "Computing..." then 100

// Cached - no recomputation
console.log(expensive.value); // 100 (no log)
```

### Caching

Results are cached until dependencies change:

```typescript
const count = zen(0);
let computeCount = 0;

const doubled = computed([count], (x) => {
  computeCount++;
  return x * 2;
});

// First access - computes
console.log(doubled.value); // 0
console.log(computeCount); // 1

// Cached - no recomputation
console.log(doubled.value); // 0
console.log(computeCount); // 1

// Dependency changed - recomputes on next access
count.value = 5;
console.log(doubled.value); // 10
console.log(computeCount); // 2
```

### Read-only

Computed values cannot be written to directly:

```typescript
const count = zen(0);
const doubled = computed([count], (x) => x * 2);

// ❌ Error - computed values are read-only
doubled.value = 10;

// ✅ Update the source
count.value = 5;
console.log(doubled.value); // 10
```

## Multiple Dependencies

Computed values can depend on multiple stores:

```typescript
const width = zen(10);
const height = zen(20);
const depth = zen(30);

const volume = computed(
  [width, height, depth],
  (w, h, d) => w * h * d
);

console.log(volume.value); // 6000

width.value = 15;
console.log(volume.value); // 9000
```

## Chaining Computed Values

Computed values can depend on other computed values:

```typescript
const base = zen(10);

const doubled = computed([base], (x) => x * 2);
const quadrupled = computed([doubled], (x) => x * 2);
const octupled = computed([quadrupled], (x) => x * 2);

console.log(octupled.value); // 80

base.value = 5;
console.log(octupled.value); // 40
```

## Complex Computations

### Filtering

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = zen<Todo[]>([
  { id: 1, text: 'Buy milk', completed: false },
  { id: 2, text: 'Walk dog', completed: true },
  { id: 3, text: 'Write code', completed: false }
]);

const activeTodos = computed(
  [todos],
  (list) => list.filter(todo => !todo.completed)
);

const completedTodos = computed(
  [todos],
  (list) => list.filter(todo => todo.completed)
);

console.log(activeTodos.value.length); // 2
console.log(completedTodos.value.length); // 1
```

### Sorting

```typescript
const items = zen([
  { name: 'Banana', price: 2 },
  { name: 'Apple', price: 1 },
  { name: 'Cherry', price: 3 }
]);

const sortOrder = zen<'asc' | 'desc'>('asc');

const sortedItems = computed(
  [items, sortOrder],
  (list, order) => {
    const sorted = [...list].sort((a, b) => a.price - b.price);
    return order === 'desc' ? sorted.reverse() : sorted;
  }
);

console.log(sortedItems.value[0].name); // "Apple"

sortOrder.value = 'desc';
console.log(sortedItems.value[0].name); // "Cherry"
```

### Aggregation

```typescript
const numbers = zen([1, 2, 3, 4, 5]);

const sum = computed(
  [numbers],
  (list) => list.reduce((acc, n) => acc + n, 0)
);

const average = computed(
  [sum, numbers],
  (s, list) => s / list.length
);

console.log(sum.value); // 15
console.log(average.value); // 3

numbers.value = [...numbers.value, 6];
console.log(sum.value); // 21
console.log(average.value); // 3.5
```

## Conditional Logic

```typescript
const temperature = zen(20);

const weatherStatus = computed([temperature], (temp) => {
  if (temp < 0) return 'Freezing';
  if (temp < 10) return 'Cold';
  if (temp < 20) return 'Cool';
  if (temp < 30) return 'Warm';
  return 'Hot';
});

console.log(weatherStatus.value); // "Cool"

temperature.value = 35;
console.log(weatherStatus.value); // "Hot"
```

## Async Computed Values

For async operations, use `computedAsync()` instead of regular `computed()`:

```typescript
import { zen, computedAsync } from '@sylphx/zen';

// ✅ Use computedAsync for async operations
const userId = zen(1);
const user = computedAsync([userId], async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Subscribe to get loading/data/error states
subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// Automatically refetches when dependency changes!
userId.value = 2;
```

See [Async Computed API](/api/computed-async) for full documentation.

## Performance Optimization

### Minimize Dependencies

Only include stores that are actually used:

```typescript
const a = zen(1);
const b = zen(2);
const c = zen(3);

// ❌ Bad - c is not used
const result = computed([a, b, c], (aVal, bVal, cVal) => {
  return aVal + bVal;
});

// ✅ Good - only includes what's used
const result = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
```

### Avoid Expensive Operations

Cache expensive computations in intermediate computed values:

```typescript
// ❌ Bad - expensive operation runs on every access
const result = computed([data], (d) => {
  const processed = expensiveProcessing(d);
  const filtered = expensiveFiltering(processed);
  return filtered.length;
});

// ✅ Good - split into multiple computed values
const processed = computed([data], expensiveProcessing);
const filtered = computed([processed], expensiveFiltering);
const count = computed([filtered], (f) => f.length);
```

### Memoization

For complex computations, consider memoization:

```typescript
function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

const expensiveFn = memoize((x: number) => {
  // Expensive computation
  return x * x;
});

const result = computed([input], expensiveFn);
```

## Subscribing to Computed Values

You can subscribe to computed values just like regular stores:

```typescript
const count = zen(0);
const doubled = computed([count], (x) => x * 2);

subscribe(doubled, (newValue, oldValue) => {
  console.log(`Doubled: ${oldValue} -> ${newValue}`);
});

count.value = 5; // Logs: "Doubled: 0 -> 10"
count.value = 10; // Logs: "Doubled: 10 -> 20"
```

## Framework Integration

### React

```tsx
import { useStore } from '@sylphx/zen-react';

const count = zen(0);
const doubled = computed([count], (x) => x * 2);

function Counter() {
  const value = useStore(doubled);
  return <div>Doubled: {value}</div>;
}
```

### Vue

```vue
<script setup>
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const doubled = computed([count], (x) => x * 2);

const value = useStore(doubled);
</script>

<template>
  <div>Doubled: {{ value }}</div>
</template>
```

## Common Patterns

### Form Validation

```typescript
const email = zen('');
const password = zen('');

const emailValid = computed(
  [email],
  (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
);

const passwordValid = computed(
  [password],
  (val) => val.length >= 8
);

const formValid = computed(
  [emailValid, passwordValid],
  (e, p) => e && p
);
```

### Search/Filter

```typescript
const items = zen(['Apple', 'Banana', 'Cherry', 'Date']);
const searchTerm = zen('');

const filteredItems = computed(
  [items, searchTerm],
  (list, term) => list.filter(item =>
    item.toLowerCase().includes(term.toLowerCase())
  )
);
```

### Pagination

```typescript
const items = zen([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const page = zen(0);
const pageSize = zen(3);

const paginatedItems = computed(
  [items, page, pageSize],
  (list, p, size) => {
    const start = p * size;
    return list.slice(start, start + size);
  }
);

const totalPages = computed(
  [items, pageSize],
  (list, size) => Math.ceil(list.length / size)
);
```

## Next Steps

- [Async Operations](/guide/async) - Learn about async patterns
- [Map Stores](/guide/maps) - Understand map stores
- [Batching Updates](/guide/batching) - Optimize updates
