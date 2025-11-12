# Migrating from Jotai to Zen

This guide helps you migrate from Jotai to Zen. Both libraries share a similar atom-based philosophy, making migration straightforward.

## Philosophy Comparison

Both Jotai and Zen use **atomic state management**, but with different approaches:

### Jotai: React-First Atoms

```typescript
import { atom, useAtom } from 'jotai';

// Atoms are React-centric
const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Characteristics:**
- Atoms are **React-first** (need hooks to access)
- Read/write through `useAtom` hook
- Computed atoms via `atom(get => ...)`
- Suspense support built-in

### Zen: Universal Signals

```typescript
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Signals work everywhere (not just React)
const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <button onClick={() => count.value++}>{value}</button>;
}

// Can also use outside React
count.value = 5; // ✅ Works anywhere!
console.log(count.value); // ✅ Direct access
```

**Characteristics:**
- Signals are **framework-agnostic**
- Direct `.value` access anywhere
- React integration via `useStore`
- Works in Node.js, vanilla JS, etc.

---

## Key Differences

| Aspect | Jotai | Zen |
|--------|-------|-----|
| **Core Primitive** | Atom | Signal (Zen) |
| **Access Pattern** | `useAtom()` hook | Direct `.value` or `useStore()` |
| **Framework** | React-only | Framework-agnostic |
| **Read/Write** | `[value, setValue]` | `signal.value = x` |
| **Computed** | `atom(get => ...)` | `computed([deps], fn)` |
| **Async** | Built-in suspense | `computedAsync()` |
| **Outside React** | ❌ Not recommended | ✅ Full support |
| **Bundle Size** | ~3 KB | ~1.14 KB |

---

## Pattern Conversions

### 1. Primitive Atoms

#### Jotai

```typescript
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const nameAtom = atom('John');

function Component() {
  const [count, setCount] = useAtom(countAtom);
  const [name, setName] = useAtom(nameAtom);

  return (
    <div>
      <div>{count}</div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>

      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}
```

#### Zen

```typescript
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);
const name = zen('John');

function Component() {
  const countValue = useStore(count);
  const nameValue = useStore(name);

  return (
    <div>
      <div>{countValue}</div>
      <button onClick={() => count.value++}>Increment</button>

      <input
        value={nameValue}
        onChange={e => name.value = e.target.value}
      />
    </div>
  );
}
```

---

### 2. Read-Only Atoms (Derived State)

#### Jotai

```typescript
import { atom, useAtomValue } from 'jotai';

const countAtom = atom(0);

// Derived atom
const doubledAtom = atom((get) => get(countAtom) * 2);

function Component() {
  const doubled = useAtomValue(doubledAtom);
  return <div>Doubled: {doubled}</div>;
}
```

#### Zen

```typescript
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

// Computed signal
const doubled = computed([count], (c) => c * 2);

function Component() {
  const value = useStore(doubled);
  return <div>Doubled: {value}</div>;
}
```

---

### 3. Write-Only Atoms (Actions)

#### Jotai

```typescript
import { atom, useSetAtom } from 'jotai';

const countAtom = atom(0);

// Write-only atom (action)
const incrementAtom = atom(
  null,
  (get, set) => set(countAtom, get(countAtom) + 1)
);

function Component() {
  const increment = useSetAtom(incrementAtom);
  const count = useAtomValue(countAtom);

  return <button onClick={increment}>{count}</button>;
}
```

#### Zen

```typescript
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

// Just a function (simpler!)
function increment() {
  count.value++;
}

function Component() {
  const value = useStore(count);
  return <button onClick={increment}>{value}</button>;
}
```

**Key Insight:** Zen doesn't need write-only atoms—just use regular functions!

---

### 4. Async Atoms

#### Jotai

```typescript
import { atom, useAtomValue } from 'jotai';
import { Suspense } from 'react';

const userIdAtom = atom(1);

// Async atom with Suspense
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

function UserProfile() {
  const user = useAtomValue(userAtom); // Suspends
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile />
    </Suspense>
  );
}
```

#### Zen - Option 1: computedAsync (Recommended)

```typescript
import { zen, effect } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const userId = zen(1);

// Reactive async computed
const user = computedAsync([userId], async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

function UserProfile() {
  const { loading, data, error } = useStore(user);

  if (loading && !data) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data?.name}</div>;
}
```

#### Zen - Option 2: With Suspense

```typescript
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';
import { Suspense } from 'react';

const userId = zen(1);
const userPromise = zen<Promise<User> | null>(null);

// Computed that returns promise (for Suspense)
const user = computed([userPromise], (promise) => {
  if (!promise) throw new Promise(() => {}); // Suspend
  throw promise; // Let React handle suspense
});

async function fetchUser(id: number) {
  const promise = fetch(`/api/users/${id}`).then(r => r.json());
  userPromise.value = promise;
  const data = await promise;
  return data;
}

function UserProfile() {
  const user = useStore(user);
  return <div>{user.name}</div>;
}
```

**Recommendation:** Use `computedAsync` for simpler, more explicit loading states.

---

### 5. Atom Families

#### Jotai

```typescript
import { atomFamily, useAtomValue } from 'jotai';

// Create atoms dynamically
const todoAtomFamily = atomFamily((id: number) =>
  atom(async () => {
    const response = await fetch(`/api/todos/${id}`);
    return response.json();
  })
);

function TodoItem({ id }: { id: number }) {
  const todo = useAtomValue(todoAtomFamily(id));
  return <div>{todo.text}</div>;
}
```

#### Zen

```typescript
import { computedAsync } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Create a map of signals
const todoCache = new Map();

function getTodoSignal(id: number) {
  if (!todoCache.has(id)) {
    const todoId = zen(id);
    const todo = computedAsync([todoId], async (id) => {
      const response = await fetch(`/api/todos/${id}`);
      return response.json();
    });
    todoCache.set(id, todo);
  }
  return todoCache.get(id);
}

function TodoItem({ id }: { id: number }) {
  const { data, loading } = useStore(getTodoSignal(id));
  if (loading) return <div>Loading...</div>;
  return <div>{data?.text}</div>;
}
```

**Or simpler approach:**

```typescript
// Single signal with ID
const todoId = zen(1);
const todo = computedAsync([todoId], async (id) => fetchTodo(id));

function TodoItem() {
  const { data } = useStore(todo);
  return <div>{data?.text}</div>;
}

// Change ID to load different todo
function selectTodo(id: number) {
  todoId.value = id; // Auto-refetches!
}
```

---

### 6. Atom with Reducers

#### Jotai

```typescript
import { atomWithReducer, useAtom } from 'jotai/utils';

const reducer = (state: number, action: 'inc' | 'dec') => {
  switch (action) {
    case 'inc': return state + 1;
    case 'dec': return state - 1;
  }
};

const countAtom = atomWithReducer(0, reducer);

function Counter() {
  const [count, dispatch] = useAtom(countAtom);

  return (
    <>
      <div>{count}</div>
      <button onClick={() => dispatch('inc')}>+</button>
      <button onClick={() => dispatch('dec')}>-</button>
    </>
  );
}
```

#### Zen

```typescript
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

// Just use functions (simpler!)
function increment() {
  count.value++;
}

function decrement() {
  count.value--;
}

function Counter() {
  const value = useStore(count);

  return (
    <>
      <div>{value}</div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </>
  );
}
```

**Key Insight:** Zen doesn't need reducers—state + functions is simpler!

---

### 7. atomWithStorage (Persistence)

#### Jotai

```typescript
import { atomWithStorage } from 'jotai/utils';

const countAtom = atomWithStorage('count', 0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

#### Zen

```typescript
import { zen } from '@sylphx/zen';
import { persistent } from '@sylphx/zen-persistent';
import { useStore } from '@sylphx/zen-react';

const count = persistent(zen(0), {
  key: 'count',
  storage: localStorage
});

function Counter() {
  const value = useStore(count);
  return <button onClick={() => count.value++}>{value}</button>;
}
```

**Install:** `npm install @sylphx/zen-persistent`

---

### 8. Multiple Atoms

#### Jotai

```typescript
import { atom, useAtomValue, useSetAtom } from 'jotai';

const firstNameAtom = atom('John');
const lastNameAtom = atom('Doe');

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`
);

const updateNameAtom = atom(
  null,
  (get, set, update: { first?: string; last?: string }) => {
    if (update.first) set(firstNameAtom, update.first);
    if (update.last) set(lastNameAtom, update.last);
  }
);

function Profile() {
  const fullName = useAtomValue(fullNameAtom);
  const updateName = useSetAtom(updateNameAtom);

  return (
    <div>
      <div>{fullName}</div>
      <button onClick={() => updateName({ first: 'Jane' })}>
        Change Name
      </button>
    </div>
  );
}
```

#### Zen

```typescript
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const firstName = zen('John');
const lastName = zen('Doe');

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

function updateName(update: { first?: string; last?: string }) {
  if (update.first) firstName.value = update.first;
  if (update.last) lastName.value = update.last;
}

function Profile() {
  const name = useStore(fullName);

  return (
    <div>
      <div>{name}</div>
      <button onClick={() => updateName({ first: 'Jane' })}>
        Change Name
      </button>
    </div>
  );
}
```

---

## Advanced Patterns

### Jotai `selectAtom` → Zen `select`

#### Jotai

```typescript
import { selectAtom, useAtomValue } from 'jotai/utils';

const userAtom = atom({ name: 'John', age: 30, email: 'john@example.com' });

function Component() {
  const userName = useAtomValue(
    selectAtom(userAtom, (user) => user.name)
  );

  return <div>{userName}</div>;
}
```

#### Zen

```typescript
import { zen, select } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const user = zen({ name: 'John', age: 30, email: 'john@example.com' });

// Create selector once (reusable)
const userName = select(user, (u) => u.name);

function Component() {
  const name = useStore(userName);
  return <div>{name}</div>;
}
```

---

### Jotai `focusAtom` → Zen nested signals

#### Jotai

```typescript
import { focusAtom } from 'jotai-optics';

const formAtom = atom({ name: '', email: '' });

const nameAtom = focusAtom(formAtom, (optic) => optic.prop('name'));

function NameInput() {
  const [name, setName] = useAtom(nameAtom);
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

#### Zen

```typescript
import { zen, select } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const form = zen({ name: '', email: '' });

// Select name
const name = select(form, f => f.name);

function NameInput() {
  const nameValue = useStore(name);

  return (
    <input
      value={nameValue}
      onChange={e => form.value = { ...form.value, name: e.target.value }}
    />
  );
}
```

**Or with Craft (Immer-style):**

```typescript
import { craftZen } from '@sylphx/zen-craft';

function updateName(name: string) {
  craftZen(form, (draft) => {
    draft.name = name; // Immutable update!
  });
}

function NameInput() {
  const nameValue = useStore(name);
  return <input value={nameValue} onChange={e => updateName(e.target.value)} />;
}
```

---

## Outside React Usage

### Jotai (Not Recommended)

```typescript
import { createStore } from 'jotai';

// Need to create store instance
const store = createStore();

const countAtom = atom(0);

// Access outside React (verbose)
const count = store.get(countAtom);
store.set(countAtom, count + 1);
```

### Zen (Natural)

```typescript
import { zen } from '@sylphx/zen';

const count = zen(0);

// Direct access anywhere
console.log(count.value); // Read
count.value++; // Write

// Subscribe outside React
import { subscribe } from '@sylphx/zen';

const unsubscribe = subscribe(count, (value) => {
  console.log('Count changed:', value);
});
```

**Use Cases:**
- Node.js servers
- CLI tools
- Background workers
- Testing
- Vanilla JavaScript

---

## Migration Checklist

### Step 1: Install Zen

```bash
npm install @sylphx/zen @sylphx/zen-react

# Optional
npm install @sylphx/zen-persistent  # For atomWithStorage
npm install @sylphx/zen-craft        # For Immer-style updates
```

### Step 2: Convert Atoms

```typescript
// Before (Jotai)
import { atom } from 'jotai';
const countAtom = atom(0);

// After (Zen)
import { zen } from '@sylphx/zen';
const count = zen(0);
```

### Step 3: Convert Read-Only Atoms

```typescript
// Before (Jotai)
const doubledAtom = atom((get) => get(countAtom) * 2);

// After (Zen)
import { computed } from '@sylphx/zen';
const doubled = computed([count], (c) => c * 2);
```

### Step 4: Convert Write-Only Atoms (Actions)

```typescript
// Before (Jotai)
const incrementAtom = atom(
  null,
  (get, set) => set(countAtom, get(countAtom) + 1)
);

// After (Zen) - Just use functions!
function increment() {
  count.value++;
}
```

### Step 5: Update Components

```typescript
// Before (Jotai)
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

function Component() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);
  const increment = useSetAtom(incrementAtom);
}

// After (Zen)
import { useStore } from '@sylphx/zen-react';

function Component() {
  const countValue = useStore(count);
  const doubledValue = useStore(doubled);
  // increment is just a function
}
```

### Step 6: Convert Async Atoms

```typescript
// Before (Jotai)
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  return fetchUser(id);
});

// After (Zen)
import { computedAsync } from '@sylphx/zen';
const user = computedAsync([userId], async (id) => fetchUser(id));
```

---

## When to Use Jotai vs Zen

### Use Jotai if:
- ✅ You only use React
- ✅ You want built-in Suspense support
- ✅ You prefer React-centric patterns
- ✅ Bundle size is critical (~3KB vs ~6KB)
- ✅ You heavily use atom families

### Use Zen if:
- ✅ You need framework-agnostic state
- ✅ You use state outside React (Node.js, vanilla JS)
- ✅ You prefer direct `.value` access
- ✅ You want 8x faster real-world performance
- ✅ You prefer explicit loading states over Suspense
- ✅ You like signals (Solid.js, Vue style)

---

## Summary

| Aspect | Jotai | Zen |
|--------|-------|-----|
| **Primitive** | Atom | Signal (Zen) |
| **Read** | `useAtomValue(atom)` | `useStore(signal)` or `signal.value` |
| **Write** | `useSetAtom(atom)` or tuple | `signal.value = x` |
| **Read+Write** | `useAtom(atom)` | `useStore(signal)` + `signal.value = x` |
| **Derived** | `atom(get => ...)` | `computed([deps], fn)` |
| **Actions** | Write-only atoms | Regular functions |
| **Async** | Async atoms + Suspense | `computedAsync` |
| **Outside React** | Possible but verbose | Natural and direct |
| **Persistence** | `atomWithStorage` | `@sylphx/zen-persistent` |
| **Immutability** | Manual | `@sylphx/zen-craft` (optional) |

---

## Next Steps

- [Core Concepts](/guide/core-concepts) - Understand Zen's signal model
- [React Integration](/guide/react) - Learn useStore patterns
- [Async Operations](/guide/async) - Master computedAsync
- [Select API](/api/select) - Optimize with selectors

---

## Need Help?

- [GitHub Discussions](https://github.com/SylphxAI/zen/discussions)
- [Examples](/examples/counter) - See real-world patterns
