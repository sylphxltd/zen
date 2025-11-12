# Getting Started

## Installation

Install Zen using your preferred package manager:

::: code-group

```bash [npm]
npm install @sylphx/zen
```

```bash [pnpm]
pnpm add @sylphx/zen
```

```bash [yarn]
yarn add @sylphx/zen
```

```bash [bun]
bun add @sylphx/zen
```

:::

## Your First Zen Store

Create a simple counter:

```typescript
import { zen } from '@sylphx/zen';

// Create a zen atom with initial value
const count = zen(0);

// Read the current value
console.log(count.value); // 0

// Update the value
count.value = 1;
console.log(count.value); // 1

// Increment
count.value++;
console.log(count.value); // 2
```

## Computed Values

Create values that automatically update based on other stores with **auto-tracking**:

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

// Auto-tracks firstName and lastName - no dependency array!
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"

// Update first name
firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

### Why Auto-tracking?

Zen v3 automatically tracks which signals you access inside computed functions. This means:

- ✅ **No manual dependency arrays** - less boilerplate
- ✅ **Automatic updates** - dependencies tracked for you
- ✅ **Conditional logic support** - only subscribes to active branches
- ✅ **Cleaner code** - focus on the logic, not the plumbing

```typescript
const count = zen(0);
const showDouble = zen(true);

// Only tracks count when showDouble is true
const display = computed(() =>
  showDouble.value ? count.value * 2 : 0
);
```

## Subscribing to Changes

React to changes in your stores:

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

// Subscribe to changes
const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Count changed from 0 to 1"
count.value = 2; // Logs: "Count changed from 1 to 2"

// Clean up when done
unsubscribe();
```

## Side Effects

Handle side effects with the `effect()` API:

```typescript
import { zen, effect } from '@sylphx/zen';

const userId = zen(1);
const user = zen(null);
const loading = zen(false);

// Auto-tracks userId and refetches when it changes
effect(() => {
  const id = userId.value; // Dependency tracked automatically

  loading.value = true;
  fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => {
      user.value = data;
      loading.value = false;
    });

  // Optional cleanup
  return () => console.log('Cleaning up effect');
});

// Automatically refetches when userId changes!
userId.value = 2;
```

## Framework Integration

### React

Install the React integration:

```bash
npm install @sylphx/zen-react
```

Use in your components:

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Create stores outside component
const count = zen(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  const value = useStore(count);
  const doubledValue = useStore(doubled);

  return (
    <div>
      <p>Count: {value}</p>
      <p>Doubled: {doubledValue}</p>
      <button onClick={() => count.value++}>
        Increment
      </button>
    </div>
  );
}
```

### Vue

Install the Vue integration:

```bash
npm install @sylphx/zen-vue
```

Use in your components:

```vue
<script setup>
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const doubled = computed(() => count.value * 2);

const value = useStore(count);
const doubledValue = useStore(doubled);
</script>

<template>
  <div>
    <p>Count: {{ value }}</p>
    <p>Doubled: {{ doubledValue }}</p>
    <button @click="count.value++">
      Increment
    </button>
  </div>
</template>
```

### Svelte

Install the Svelte integration:

```bash
npm install @sylphx/zen-svelte
```

Use in your components:

```svelte
<script>
import { zen, computed } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const count = zen(0);
const doubled = computed(() => count.value * 2);

const countStore = fromZen(count);
const doubledStore = fromZen(doubled);
</script>

<div>
  <p>Count: {$countStore}</p>
  <p>Doubled: {$doubledStore}</p>
  <button on:click={() => count.value++}>
    Increment
  </button>
</div>
```

## Object Stores

Create stores with complex objects:

```typescript
import { zen } from '@sylphx/zen';

const user = zen({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Read
console.log(user.value.name); // "John"

// Update (replace entire object)
user.value = {
  name: 'Jane',
  age: 25,
  email: 'jane@example.com'
};

// Partial update (spread)
user.value = {
  ...user.value,
  age: 26
};
```

## Map Stores

For more efficient partial updates, use map stores:

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Update single property (efficient)
setKey(user, 'age', 31);

// Subscribe to specific keys only
const unsubscribe = listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed:', value);
});
```

## Next Steps

- [Core Concepts](/guide/core-concepts) - Understand Zen's fundamentals
- [Computed Values](/guide/computed) - Deep dive into auto-tracking
- [Async Operations](/guide/async) - Learn about async patterns
- [Framework Guides](/guide/react) - Deep dive into framework integration
- [Migration Guide](/guide/migration-v2-to-v3) - Upgrading from v2
