# Core Concepts

Zen's state management is built around a few simple but powerful concepts. Understanding these will help you build reactive applications efficiently.

## Atoms

Atoms are the fundamental building blocks in Zen. An atom is a piece of reactive state that can be read and written.

```typescript
import { zen } from '@sylphx/zen';

// Create an atom with initial value
const count = zen(0);

// Read the value
console.log(count.value); // 0

// Update the value
count.value = 1;

// Increment
count.value++;
```

### Atom Characteristics

- **Reactive**: Changes to an atom automatically notify subscribers
- **Type-safe**: TypeScript infers the type from the initial value
- **Lightweight**: Uses native getters/setters for minimal overhead
- **Mutable**: Direct `.value` property assignment

### Creating Atoms

```typescript
// Primitives
const count = zen(0);
const name = zen('John');
const isActive = zen(true);

// Objects
const user = zen({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// Arrays
const items = zen([1, 2, 3]);

// Complex types
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = zen<Todo[]>([]);
```

## Computed Values

Computed values derive state from one or more atoms. They automatically track dependencies and update when those dependencies change.

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

### Computed Characteristics

- **Automatic updates**: Recalculates when dependencies change
- **Auto-tracking**: Dependencies tracked automatically (v3 feature)
- **Read-only**: Cannot be written to directly
- **Cached**: Only recalculates when dependencies change
- **Lazy**: Only evaluates when accessed

### Auto-tracking Magic

Zen v3 automatically tracks which signals you access inside computed functions:

```typescript
const quantity = zen(5);
const price = zen(10);
const taxRate = zen(0.1);

// Automatically tracks quantity, price, and taxRate
const total = computed(() =>
  quantity.value * price.value * (1 + taxRate.value)
);

console.log(total.value); // 55
```

### Chaining Computed Values

```typescript
const base = zen(10);

const doubled = computed(() => base.value * 2);
const quadrupled = computed(() => doubled.value * 2);

console.log(quadrupled.value); // 40

base.value = 20;
console.log(quadrupled.value); // 80
```

### Conditional Dependencies

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

mode.value = 'dark'; // Now subscribes to darkBg
```

**Performance:** 2.12x faster than manual dependency lists for conditional logic!

## Subscriptions

Subscriptions allow you to react to changes in atoms or computed values.

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

// Subscribe to changes
const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Changed from 0 to 1"
count.value = 2; // Logs: "Changed from 1 to 2"

// Clean up
unsubscribe();

count.value = 3; // No log - subscription removed
```

### Subscription Characteristics

- **Immediate**: Callback runs synchronously after each change
- **Cleanup**: Returns unsubscribe function
- **Two arguments**: Receives new value and old value
- **Works with computed**: Can subscribe to computed values too

### Subscribing to Computed Values

```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);

subscribe(doubled, (newValue) => {
  console.log(`Doubled: ${newValue}`);
});

count.value = 5; // Logs: "Doubled: 10"
```

### Multiple Subscriptions

```typescript
const count = zen(0);

const sub1 = subscribe(count, (val) => console.log('Sub 1:', val));
const sub2 = subscribe(count, (val) => console.log('Sub 2:', val));

count.value = 1;
// Logs:
// "Sub 1: 1"
// "Sub 2: 1"

// Clean up individual subscriptions
sub1();
sub2();
```

## Async Computed Values

For async operations, use `effect()` with manual state management:

```typescript
import { zen, effect } from '@sylphx/zen';

const userId = zen(1);

// Auto-tracks userId!
const user = zen(null);
const loading = zen(false);

effect(() => {
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

## Map Stores

For objects that change frequently, map stores provide efficient partial updates.

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Efficient single-key update
setKey(user, 'age', 31);

// Subscribe to specific keys only
const unsubscribe = listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed:', value);
});

setKey(user, 'age', 32); // No log - not watching 'age'
setKey(user, 'name', 'Jane'); // Logs: "Name or email changed: ..."
```

### Map Store Benefits

- **Granular updates**: Update single properties without replacing entire object
- **Selective subscriptions**: Listen to specific keys only
- **Performance**: Avoids unnecessary rerenders in UI frameworks
- **Type-safe**: Full TypeScript support with key checking

## Batching

Batch multiple updates to notify subscribers only once.

```typescript
import { zen, batch } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

subscribe(firstName, () => console.log('First name changed'));
subscribe(lastName, () => console.log('Last name changed'));

// Without batching - triggers twice
firstName.value = 'Jane';
lastName.value = 'Smith';
// Logs:
// "First name changed"
// "Last name changed"

// With batching - deferred until batch completes
batch(() => {
  firstName.value = 'Bob';
  lastName.value = 'Jones';
});
// Logs after batch:
// "First name changed"
// "Last name changed"
```

### When to Use Batching

- Multiple related updates
- Bulk data operations
- Performance-critical paths
- Avoiding intermediate states in UI

## Lifecycle and Cleanup

Always clean up subscriptions to prevent memory leaks.

```typescript
import { zen, subscribe } from '@sylphx/zen';

function setupStore() {
  const count = zen(0);

  const unsubscribe = subscribe(count, (val) => {
    console.log('Count:', val);
  });

  // Return cleanup function
  return () => {
    unsubscribe();
  };
}

// Use the store
const cleanup = setupStore();

// Later, clean up
cleanup();
```

### Framework Integration Lifecycle

Most framework integrations handle cleanup automatically:

```tsx
// React - automatic cleanup
function Counter() {
  const value = useStore(count);
  // Subscription cleaned up when component unmounts
  return <div>{value}</div>;
}
```

## Next Steps

- [Getting Started](/guide/getting-started) - Quick start guide
- [Computed Values](/guide/computed) - Deep dive into computed values
- [Async Operations](/guide/async) - Learn about async patterns
- [Migration Guide](/guide/migration-v2-to-v3) - Upgrading from v2
