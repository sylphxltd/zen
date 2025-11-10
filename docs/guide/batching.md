# Batching Updates

Batching allows you to group multiple store updates together, notifying subscribers only once after all updates are complete.

## Why Batching?

### Without Batching

Each update notifies subscribers immediately:

```typescript
import { zen, subscribe } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

let updateCount = 0;

subscribe(firstName, () => {
  updateCount++;
  console.log('First name changed');
});

subscribe(lastName, () => {
  updateCount++;
  console.log('Last name changed');
});

// Two separate notifications
firstName.value = 'Jane';  // Logs "First name changed"
lastName.value = 'Smith';  // Logs "Last name changed"

console.log(updateCount); // 2
```

### With Batching

All updates notify once:

```typescript
import { batch } from '@sylphx/zen';

let updateCount = 0;

subscribe(firstName, () => {
  updateCount++;
  console.log('First name changed');
});

subscribe(lastName, () => {
  updateCount++;
  console.log('Last name changed');
});

batch(() => {
  firstName.value = 'Jane';
  lastName.value = 'Smith';
});
// Logs:
// "First name changed"
// "Last name changed"

console.log(updateCount); // 2 (but triggered together)
```

## Basic Usage

Use the `batch` function to group updates:

```typescript
import { zen, batch } from '@sylphx/zen';

const count = zen(0);
const total = zen(0);

batch(() => {
  count.value = 5;
  total.value = 10;
});
// Subscribers notified once after batch completes
```

## Benefits

### 1. Improved Performance

Reduce the number of subscriber notifications:

```typescript
const todos = zen<Todo[]>([]);
let renderCount = 0;

subscribe(todos, () => {
  renderCount++;
  // Expensive render operation
  render();
});

// ❌ Without batching - 3 renders
todos.value = [...todos.value, todo1];
todos.value = [...todos.value, todo2];
todos.value = [...todos.value, todo3];
console.log(renderCount); // 3

// ✅ With batching - 1 render
batch(() => {
  todos.value = [...todos.value, todo1];
  todos.value = [...todos.value, todo2];
  todos.value = [...todos.value, todo3];
});
console.log(renderCount); // 1
```

### 2. Consistent State

Prevent intermediate states from being observed:

```typescript
const balance = zen(100);
const transactions = zen<Transaction[]>([]);

subscribe(balance, (newBalance) => {
  // Validate balance matches transactions
  const sum = transactions.value.reduce((acc, t) => acc + t.amount, 0);
  if (sum !== newBalance) {
    console.error('Inconsistent state!');
  }
});

// ❌ Without batching - inconsistent intermediate state
balance.value = 150;
transactions.value = [...transactions.value, { amount: 50 }];
// Error: "Inconsistent state!" (balance updated before transactions)

// ✅ With batching - consistent state
batch(() => {
  balance.value = 150;
  transactions.value = [...transactions.value, { amount: 50 }];
});
// No error - both updated together
```

### 3. Reduced Rerenders

In UI frameworks, fewer updates mean fewer rerenders:

```tsx
import { zen, batch } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const user = zen({ name: 'John', age: 30 });
const settings = zen({ theme: 'light' });

function Profile() {
  const userData = useStore(user);
  const userSettings = useStore(settings);

  console.log('Rendering Profile');

  return <div>{userData.name} - {userSettings.theme}</div>;
}

// ❌ Without batching - 2 rerenders
user.value = { name: 'Jane', age: 25 };
settings.value = { theme: 'dark' };

// ✅ With batching - 1 rerender
batch(() => {
  user.value = { name: 'Jane', age: 25 };
  settings.value = { theme: 'dark' };
});
```

## Common Patterns

### Form Submission

```typescript
const formData = map({
  name: '',
  email: '',
  age: 0
});

const formErrors = map({
  name: null,
  email: null,
  age: null
});

const isSubmitting = zen(false);

async function submitForm() {
  batch(() => {
    isSubmitting.value = true;
    setKey(formErrors, 'name', null);
    setKey(formErrors, 'email', null);
    setKey(formErrors, 'age', null);
  });

  try {
    await api.submit(formData.value);
  } catch (err) {
    batch(() => {
      isSubmitting.value = false;
      // Set multiple errors at once
      setKey(formErrors, 'name', 'Invalid name');
      setKey(formErrors, 'email', 'Invalid email');
    });
  }
}
```

### Bulk Operations

```typescript
const items = zen<Item[]>([]);

function addMultipleItems(newItems: Item[]) {
  batch(() => {
    for (const item of newItems) {
      items.value = [...items.value, item];
    }
  });
}

function updateMultipleItems(updates: Array<{ id: number; changes: Partial<Item> }>) {
  batch(() => {
    for (const { id, changes } of updates) {
      items.value = items.value.map(item =>
        item.id === id ? { ...item, ...changes } : item
      );
    }
  });
}
```

### State Reset

```typescript
const user = zen<User | null>(null);
const posts = zen<Post[]>([]);
const loading = zen(false);
const error = zen<Error | null>(null);

function reset() {
  batch(() => {
    user.value = null;
    posts.value = [];
    loading.value = false;
    error.value = null;
  });
}

function logout() {
  batch(() => {
    user.value = null;
    posts.value = [];
    // ... reset all user-related state
  });
}
```

### Computed Dependencies

Batch updates to prevent multiple recomputations:

```typescript
const price = zen(10);
const quantity = zen(5);
const taxRate = zen(0.1);

const subtotal = computed([price, quantity], (p, q) => p * q);
const total = computed([subtotal, taxRate], (s, t) => s * (1 + t));

let computeCount = 0;
subscribe(total, () => computeCount++);

// ❌ Without batching - total computed twice
price.value = 20;
quantity.value = 10;
console.log(computeCount); // 2

// ✅ With batching - total computed once
batch(() => {
  price.value = 20;
  quantity.value = 10;
});
console.log(computeCount); // 1
```

## Map Store Integration

Batch multiple `setKey` calls:

```typescript
import { map, setKey, batch } from '@sylphx/zen';

const user = map({
  name: 'John',
  email: 'john@example.com',
  age: 30,
  city: 'New York'
});

// ❌ Without batching - 4 notifications
setKey(user, 'name', 'Jane');
setKey(user, 'email', 'jane@example.com');
setKey(user, 'age', 25);
setKey(user, 'city', 'Boston');

// ✅ With batching - 1 notification
batch(() => {
  setKey(user, 'name', 'Jane');
  setKey(user, 'email', 'jane@example.com');
  setKey(user, 'age', 25);
  setKey(user, 'city', 'Boston');
});
```

## Nested Batching

Batches can be nested:

```typescript
batch(() => {
  firstName.value = 'Jane';

  batch(() => {
    lastName.value = 'Smith';
    age.value = 25;
  });

  email.value = 'jane@example.com';
});
// All updates notify after outermost batch completes
```

## Error Handling

Errors in batches are propagated:

```typescript
try {
  batch(() => {
    count.value = 5;
    throw new Error('Something went wrong');
    total.value = 10; // Never executed
  });
} catch (err) {
  console.error(err); // Caught
}

// count was updated before the error
console.log(count.value); // 5
```

## Async Operations

Batching is synchronous only. For async operations, batch the synchronous parts:

```typescript
async function fetchAndUpdate() {
  // Set loading state
  batch(() => {
    loading.value = true;
    error.value = null;
  });

  try {
    const data = await fetch('/api/data').then(r => r.json());

    // Update with results
    batch(() => {
      items.value = data.items;
      total.value = data.total;
      loading.value = false;
    });
  } catch (err) {
    // Update with error
    batch(() => {
      error.value = err as Error;
      loading.value = false;
    });
  }
}
```

## Framework Integration

### React

```tsx
import { zen, batch } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const firstName = zen('John');
const lastName = zen('Doe');

function UserForm() {
  const first = useStore(firstName);
  const last = useStore(lastName);

  const updateBoth = () => {
    batch(() => {
      firstName.value = 'Jane';
      lastName.value = 'Smith';
    });
    // Component rerenders once, not twice
  };

  return (
    <div>
      <input value={first} onChange={(e) => firstName.value = e.target.value} />
      <input value={last} onChange={(e) => lastName.value = e.target.value} />
      <button onClick={updateBoth}>Update Both</button>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { zen, batch } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const firstName = zen('John');
const lastName = zen('Doe');

const first = useStore(firstName);
const last = useStore(lastName);

function updateBoth() {
  batch(() => {
    firstName.value = 'Jane';
    lastName.value = 'Smith';
  });
}
</script>

<template>
  <div>
    <input v-model="firstName.value" />
    <input v-model="lastName.value" />
    <button @click="updateBoth">Update Both</button>
  </div>
</template>
```

## Performance Considerations

### When to Use Batching

✅ **Use batching when:**
- Updating multiple related stores
- Performing bulk operations
- Resetting multiple stores
- Updating computed dependencies together
- Preventing intermediate states

❌ **Don't use batching when:**
- Updating a single store
- Updates are already asynchronous
- Debugging (batching can hide order of operations)

### Measuring Impact

```typescript
const count = zen(0);
let notifyCount = 0;

subscribe(count, () => notifyCount++);

console.time('without-batch');
for (let i = 0; i < 1000; i++) {
  count.value = i;
}
console.timeEnd('without-batch');
console.log('Notifications:', notifyCount); // 1000

notifyCount = 0;

console.time('with-batch');
batch(() => {
  for (let i = 0; i < 1000; i++) {
    count.value = i;
  }
});
console.timeEnd('with-batch');
console.log('Notifications:', notifyCount); // 1
```

## Best Practices

### ✅ Do: Batch Related Updates

```typescript
// ✅ Good - related updates together
batch(() => {
  user.value = newUser;
  posts.value = newPosts;
  loading.value = false;
});
```

### ✅ Do: Batch in Event Handlers

```typescript
// ✅ Good - batch multiple updates from user action
function handleSubmit() {
  batch(() => {
    formData.value = sanitize(formData.value);
    errors.value = validate(formData.value);
    isSubmitting.value = true;
  });
}
```

### ❌ Don't: Over-batch

```typescript
// ❌ Bad - unnecessary batching
batch(() => {
  count.value = 5;
});

// ✅ Good - single update doesn't need batching
count.value = 5;
```

### ✅ Do: Document Why Batching

```typescript
// ✅ Good - comment explains purpose
// Batch to prevent inconsistent balance/transactions state
batch(() => {
  balance.value = newBalance;
  transactions.value = newTransactions;
});
```

## Next Steps

- [Performance](/guide/performance) - Learn about performance optimization
- [Map Stores](/guide/maps) - Understand map stores
- [Core Concepts](/guide/core-concepts) - Review fundamentals
