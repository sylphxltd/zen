# Core API

## zen()

Creates a reactive atom with an initial value.

```typescript
function zen<T>(initialValue: T): Zen<T>
```

### Example

```typescript
import { zen } from '@sylphx/zen';

const count = zen(0);
const name = zen('John');
const user = zen({ id: 1, name: 'John' });
```

### Usage

```typescript
// Read
const value = count.value;

// Write
count.value = 1;

// Update
count.value++;
```

---

## subscribe()

Subscribes to changes in a store.

```typescript
function subscribe<T>(
  store: Zen<T>,
  callback: (newValue: T, oldValue: T) => void
): Unsubscribe
```

### Parameters

- `store` - The Zen store to subscribe to
- `callback` - Function called when the value changes
  - `newValue` - The new value
  - `oldValue` - The previous value

### Returns

Unsubscribe function to stop listening.

### Example

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Changed from 0 to 1"

// Clean up
unsubscribe();
```

---

## batch()

Groups multiple updates to notify subscribers only once.

```typescript
function batch(fn: () => void): void
```

### Parameters

- `fn` - Function containing updates to batch

### Example

```typescript
import { zen, batch, subscribe } from '@sylphx/zen';

const a = zen(0);
const b = zen(0);

subscribe(a, () => console.log('a changed'));
subscribe(b, () => console.log('b changed'));

batch(() => {
  a.value = 1;
  b.value = 2;
});
// Both subscribers notified together after batch
```

---

## Zen\<T\>

The reactive store interface.

### Properties

#### value

```typescript
value: T
```

Gets or sets the current value.

```typescript
const count = zen(0);

// Get
const current = count.value;

// Set
count.value = 10;
```

### Type Definition

```typescript
interface Zen<T> {
  value: T;
}
```

---

## Types

### Unsubscribe

```typescript
type Unsubscribe = () => void
```

Function returned by `subscribe()` to stop listening.

### Listener

```typescript
type Listener<T> = (newValue: T, oldValue: T) => void
```

Callback function for subscriptions.

---

## Best Practices

### ✅ Create stores outside components

```tsx
// ✅ Good - store persists across renders
const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <div>{value}</div>;
}
```

### ✅ Always clean up subscriptions

```typescript
// ✅ Good - cleanup when done
const unsubscribe = subscribe(count, handler);
// Later...
unsubscribe();
```

### ✅ Use batch for multiple updates

```typescript
// ✅ Good - single notification
batch(() => {
  firstName.value = 'Jane';
  lastName.value = 'Doe';
});
```

---

## See Also

- [Computed API](/api/computed) - Derived state
- [Map Store API](/api/map) - Efficient object updates
- [Utilities API](/api/utilities) - Helper functions
