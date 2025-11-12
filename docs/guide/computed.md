# Computed Values

Computed values are derived state that automatically updates when their dependencies change. Zen v3 features **auto-tracking** - no manual dependency arrays needed!

## Basic Computed Values

Create a computed value that auto-tracks its dependencies:

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

// Auto-tracks firstName and lastName - no dependency array!
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

## Auto-tracking Magic

Zen v3 automatically tracks which signals you access inside computed functions:

```typescript
const price = zen(10);
const quantity = zen(5);
const taxRate = zen(0.1);

// Automatically tracks price and quantity
const subtotal = computed(() =>
  price.value * quantity.value
);

// Automatically tracks subtotal and taxRate
const total = computed(() =>
  subtotal.value * (1 + taxRate.value)
);

console.log(total.value); // 55

quantity.value = 10;
console.log(total.value); // 110
```

## Characteristics

### Lazy Evaluation

Computed values are only evaluated when accessed:

```typescript
const base = zen(10);

const expensive = computed(() => {
  console.log('Computing...');
  return base.value * base.value;
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

const doubled = computed(() => {
  computeCount++;
  return count.value * 2;
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
const doubled = computed(() => count.value * 2);

// ❌ Error - computed values are read-only
doubled.value = 10;

// ✅ Update the source
count.value = 5;
console.log(doubled.value); // 10
```

## Conditional Dependencies

Auto-tracking shines with conditional logic - only subscribes to signals actually accessed:

```typescript
const mode = zen<'light' | 'dark'>('light');
const lightBg = zen('#ffffff');
const darkBg = zen('#000000');

// Only tracks the active branch!
const background = computed(() =>
  mode.value === 'light' ? lightBg.value : darkBg.value
);

// Changing darkBg doesn't trigger updates when mode is 'light'
darkBg.value = '#111111'; // No update!

// Switch mode
mode.value = 'dark'; // Now subscribes to darkBg
```

**Performance:** 2.12x faster than manual dependency lists for conditional logic!

## Multiple Dependencies

Computed values automatically track all accessed signals:

```typescript
const width = zen(10);
const height = zen(20);
const depth = zen(30);

// Automatically tracks width, height, and depth
const volume = computed(() =>
  width.value * height.value * depth.value
);

console.log(volume.value); // 6000

width.value = 15;
console.log(volume.value); // 9000
```

## Chaining Computed Values

Computed values can depend on other computed values:

```typescript
const base = zen(10);

const doubled = computed(() => base.value * 2);
const quadrupled = computed(() => doubled.value * 2);
const octupled = computed(() => quadrupled.value * 2);

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

const activeTodos = computed(() =>
  todos.value.filter(todo => !todo.completed)
);

const completedTodos = computed(() =>
  todos.value.filter(todo => todo.completed)
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

const sortedItems = computed(() => {
  const list = items.value;
  const order = sortOrder.value;
  const sorted = [...list].sort((a, b) => a.price - b.price);
  return order === 'desc' ? sorted.reverse() : sorted;
});

console.log(sortedItems.value[0].name); // "Apple"

sortOrder.value = 'desc';
console.log(sortedItems.value[0].name); // "Cherry"
```

### Aggregation

```typescript
const numbers = zen([1, 2, 3, 4, 5]);

const sum = computed(() =>
  numbers.value.reduce((acc, n) => acc + n, 0)
);

const average = computed(() =>
  sum.value / numbers.value.length
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

const weatherStatus = computed(() => {
  const temp = temperature.value;
  if (temp < 0) return 'Freezing';
  if (temp < 10) return 'Cold';
  if (temp < 20) return 'Cool';
  if (temp < 30) return 'Warm';
  return 'Hot';
});

console.log(weatherStatus.value); // "Warm"

temperature.value = 35;
console.log(weatherStatus.value); // "Hot"
```

## Async Computed Values

For async operations, use `effect()` with manual state management:

```typescript
import { zen, effect } from '@sylphx/zen';

const userId = zen(1);

// Auto-tracks userId!
const user = computedAsync(async () => {
  const id = userId.value; // Dependencies tracked BEFORE first await
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Access loading/data/error states
subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// Automatically refetches when userId changes!
userId.value = 2;
```

See [Async Operations](/guide/async) for full documentation.

## Optional: Explicit Dependencies

For performance-critical code, you can specify dependencies explicitly:

```typescript
const a = zen(1);
const b = zen(2);

// Explicit deps (slightly faster, but more verbose)
const sum = computed(() => a.value + b.value, [a, b]);
```

**When to use:**
- Performance-critical hot paths
- Profiler shows computed is a bottleneck
- Dependencies are static and known

**When to auto-track (default):**
- Everything else (recommended)
- Conditional dependencies
- Dynamic dependencies

Auto-tracking is recommended for 90% of cases and is often faster for conditional logic!

## Performance Optimization

### Split Complex Computations

Cache expensive computations in intermediate computed values:

```typescript
// ❌ Bad - expensive operation runs on every access
const result = computed(() => {
  const processed = expensiveProcessing(data.value);
  const filtered = expensiveFiltering(processed);
  return filtered.length;
});

// ✅ Good - split into multiple computed values
const processed = computed(() => expensiveProcessing(data.value));
const filtered = computed(() => expensiveFiltering(processed.value));
const count = computed(() => filtered.value.length);
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

const result = computed(() => expensiveFn(input.value));
```

## Subscribing to Computed Values

You can subscribe to computed values just like regular stores:

```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);

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
const doubled = computed(() => count.value * 2);

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
const doubled = computed(() => count.value * 2);

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

const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);

const passwordValid = computed(() =>
  password.value.length >= 8
);

const formValid = computed(() =>
  emailValid.value && passwordValid.value
);
```

### Search/Filter

```typescript
const items = zen(['Apple', 'Banana', 'Cherry', 'Date']);
const searchTerm = zen('');

const filteredItems = computed(() =>
  items.value.filter(item =>
    item.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);
```

### Pagination

```typescript
const items = zen([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const page = zen(0);
const pageSize = zen(3);

const paginatedItems = computed(() => {
  const list = items.value;
  const p = page.value;
  const size = pageSize.value;
  const start = p * size;
  return list.slice(start, start + size);
});

const totalPages = computed(() =>
  Math.ceil(items.value.length / pageSize.value)
);
```

## Next Steps

- [Async Operations](/guide/async) - Learn about async patterns
- [Migration Guide](/guide/migration-v2-to-v3) - Upgrading from v2
- [Batching Updates](/guide/batching) - Optimize updates
