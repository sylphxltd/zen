# Zen ⚡ - Extreme Minimalism, Extreme Speed

[![npm version](https://badge.fury.io/js/@sylphx/zen.svg)](https://badge.fury.io/js/@sylphx/zen)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@sylphx/zen)](https://bundlephobia.com/package/@sylphx/zen)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Fast, minimal, and powerful state management that works everywhere.**

Zen is a TypeScript-first state management library designed around **extreme minimalism** for **unparalleled performance**. Write your state logic once, use it across React, Vue, Solid.js, Svelte, and Preact with integrations under 250 bytes each.

---

## Why Zen?

Modern frameworks like Solid.js have shown that **signals can be incredibly fast**. But they lock you into a single framework. What if you could have that speed **everywhere**?

**Zen delivers signal-like performance across all major frameworks while keeping your bundle tiny.**

### Key Performance Metrics

- **1.7-7.3x faster** than Zustand on core operations
- **45x faster** than Jotai on atom creation
- **2.8-8x faster** than Nanostores on nested operations
- **Just 1.45 kB** for the full library (brotli + gzip)
- Framework integrations **under 250 bytes** each

---

## Installation

```bash
npm install @sylphx/zen
# or
bun add @sylphx/zen
```

---

## Quick Start

### Vanilla JavaScript

```typescript
import { zen, get, set, subscribe } from '@sylphx/zen';

// Create reactive state
const count = zen(0);

// Subscribe to changes
subscribe(count, (value) => {
  console.log('Count:', value);
});

// Update state
set(count, get(count) + 1);
```

### React

```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react'; // 216 bytes

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <button onClick={() => set(count, value + 1)}>{value}</button>;
}
```

### Vue

```vue
<script setup>
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue'; // ~200 bytes

const count = zen(0);
const value = useStore(count);
</script>

<template>
  <button @click="set(count, value + 1)">{{ value }}</button>
</template>
```

### Solid.js

```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid'; // 234 bytes

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <button onClick={() => set(count, value() + 1)}>{value()}</button>;
}
```

### Svelte

```svelte
<script>
  import { zen, set } from '@sylphx/zen';
  import { fromZen } from '@sylphx/zen-svelte'; // 167 bytes

  const count = zen(0);
  const value = fromZen(count);
</script>

<button on:click={() => set(count, $value + 1)}>{$value}</button>
```

---

## Core Features

### 🎯 **Primitives**

```typescript
import { zen, computed, get, set, subscribe } from '@sylphx/zen';

// Basic reactive state
const count = zen(10);

// Derived state
const doubled = computed([count], (n) => n * 2);

// Subscribe to changes
subscribe(doubled, (value) => console.log('Doubled:', value));
// Output: Doubled: 20

set(count, 15);
// Output: Doubled: 30
```

### 🗺️ **Object State**

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({ name: 'Alice', age: 30 });

// Listen to specific keys
listenKeys(user, ['age'], (value) => {
  console.log('Age changed:', value);
});

setKey(user, 'age', 31); // Output: Age changed: 31
setKey(user, 'name', 'Bob'); // No output (not listening to 'name')
```

### 🌳 **Nested State**

```typescript
import { deepMap, setPath, listenPaths } from '@sylphx/zen';

const settings = deepMap({
  user: { preferences: { theme: 'light' } },
  data: [10, 20, 30]
});

// Listen to nested paths
listenPaths(settings, [['user', 'preferences', 'theme']], (value) => {
  console.log('Theme:', value);
});

setPath(settings, 'user.preferences.theme', 'dark');
// Output: Theme: dark

setPath(settings, ['data', 1], 25); // Update array element
```

### ⚡ **Async State**

```typescript
import { karma, runKarma, getKarmaState } from '@sylphx/zen';

const fetchUser = async (id: number) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};

const userTask = karma(fetchUser);

// Execute async function
await runKarma(userTask, 123);

// Get current state
const state = getKarmaState(userTask);
// { loading: false, data: {...}, error: undefined }
```

### 🎨 **Immutable Updates**

```typescript
import { zen } from '@sylphx/zen';
import { produceZen } from '@sylphx/zen-craft'; // ~4 kB

const todos = zen([
  { id: 1, text: 'Learn Zen', done: false }
]);

// Immer-like API with JSON Patches
produceZen(todos, (draft) => {
  draft[0].done = true;
  draft.push({ id: 2, text: 'Build app', done: false });
});
```

---

## Ecosystem

### Core Packages

| Package | Description | Size |
|---------|-------------|------|
| **[@sylphx/zen](https://npmjs.com/package/@sylphx/zen)** | Core state management | 1.45 kB |
| **[@sylphx/zen-craft](https://npmjs.com/package/@sylphx/zen-craft)** | Immutable updates + JSON Patches | ~4 kB |
| **[@sylphx/zen-persistent](https://npmjs.com/package/@sylphx/zen-persistent)** | localStorage/sessionStorage sync | ~1 kB |

### Framework Integrations

| Package | Framework | Size |
|---------|-----------|------|
| **[@sylphx/zen-react](https://npmjs.com/package/@sylphx/zen-react)** | React 16.8+ | 216 B |
| **[@sylphx/zen-preact](https://npmjs.com/package/@sylphx/zen-preact)** | Preact 10+ | 177 B |
| **[@sylphx/zen-vue](https://npmjs.com/package/@sylphx/zen-vue)** | Vue 3+ | ~200 B |
| **[@sylphx/zen-solid](https://npmjs.com/package/@sylphx/zen-solid)** | Solid.js | 234 B |
| **[@sylphx/zen-svelte](https://npmjs.com/package/@sylphx/zen-svelte)** | Svelte 3-5 | 167 B |

### Routing

| Package | Description |
|---------|-------------|
| **[@sylphx/zen-router](https://npmjs.com/package/@sylphx/zen-router)** | Framework-agnostic router |
| **[@sylphx/zen-router-react](https://npmjs.com/package/@sylphx/zen-router-react)** | React integration |
| **[@sylphx/zen-router-preact](https://npmjs.com/package/@sylphx/zen-router-preact)** | Preact integration |

---

## Performance Benchmarks

Zen achieves extreme speed through its minimal, hyper-optimized core. All results in operations per second (higher is better):

### Atom Operations

| Operation | Zen | Zustand | Jotai | Nanostores | Valtio | Effector |
|-----------|-----|---------|-------|------------|--------|----------|
| **Creation** | **18.5M** 🏆 | 16.7M | 10.7M | 2.6M | 0.6M | 24.7k |
| **Get** | 16.9M | **22.4M** | 17.0M | 12.7M | 18.8M | 22.9M |
| **Set (No Listeners)** | **13.7M** 🏆 | 9.6M | 1.6M | 10.5M | 3.4M | 3.2M |

### Computed Operations

| Operation | Zen | Jotai | Nanostores | Zustand | Effector |
|-----------|-----|-------|------------|---------|----------|
| **Creation** | **22.6M** 🏆 | 13.7M | 0.4M | - | 6.7k |
| **Get** | 19.5M | 19.0M | 2.3M | **20.4M** | 19.7M |
| **Update Propagation** | 8.0M | 0.2M | **8.9M** | 8.1M | 0.6M |

### Nested State Operations

| Operation | Zen | Nanostores |
|-----------|-----|------------|
| **DeepMap Creation** | **13.7M** 🏆 | 2.5M |
| **setPath (Shallow)** | **2.8M** 🏆 | 1.0M |
| **setPath (1 Level)** | **2.0M** 🏆 | 0.8M |
| **setPath (2 Levels)** | **2.1M** 🏆 | 0.7M |
| **setPath (Array)** | **3.9M** 🏆 | 0.5M |

*Benchmarks from latest version on Apple M1 Pro. Results may vary.*

---

## Bundle Size Comparison

| Library | Size (Brotli + Gzip) | Notes |
|---------|---------------------|-------|
| **Zen (atom only)** | **786 B** | Minimal core |
| **Zen (full)** | **1.45 kB** | All features |
| Jotai (atom) | 170 B | Atom only |
| Nanostores (atom) | 265 B | Atom only |
| Zustand (core) | 461 B | Core only |
| Valtio | 903 B | Full library |
| Effector | 5.27 kB | Full library |
| Redux Toolkit | 6.99 kB | Full library |

---

## Multi-Framework Advantage

**The Problem:** Framework-specific state solutions lock you in:
- Solid Signals → Solid.js only
- Vue Reactivity → Vue only
- Svelte Stores → Svelte only

**The Zen Solution:** Write once, run everywhere.

```typescript
// state/counter.ts - Framework agnostic!
import { zen, computed } from '@sylphx/zen';

export const count = zen(0);
export const doubled = computed([count], (n) => n * 2);
```

Use the same state in React, Vue, Solid, Svelte, or Preact by importing the appropriate integration:

```typescript
// React
import { useStore } from '@sylphx/zen-react';

// Vue
import { useStore } from '@sylphx/zen-vue';

// Solid.js
import { useStore } from '@sylphx/zen-solid';

// Svelte
import { fromZen } from '@sylphx/zen-svelte';
```

**Same logic. Different frameworks. Zero rewrites.**

---

## API Reference

### Core Functions

```typescript
// Create reactive state
zen(initialValue)
computed(dependencies, computeFn)
map(initialObject)
deepMap(initialObject)
karma(asyncFunction)

// Read/Write
get(store)
set(store, value)
setKey(mapStore, key, value)
setPath(deepMapStore, path, value)
runKarma(karmaStore, ...args)

// Subscribe
subscribe(store, listener)
listenKeys(mapStore, keys, listener)
listenPaths(deepMapStore, paths, listener)

// Utilities
batch(fn) // Batch multiple updates
select(store, selector) // Optimized single-source derivation
```

### Advanced Hooks

```typescript
onStart(store, callback) // First subscriber
onStop(store, callback)  // Last unsubscribe
onSet(store, callback)   // Before value change
onNotify(store, callback) // After notifications
onMount(store, callback) // Store initialization
```

---

## TypeScript Support

Zen is built with TypeScript and provides full type inference:

```typescript
const count = zen(0); // Inferred as Zen<number>
const user = map({ name: 'Alice', age: 30 }); // Inferred as Map<{name: string, age: number}>

const doubled = computed([count], (n) => n * 2); // n is inferred as number

// Full type safety
set(count, 'invalid'); // ❌ Type error
set(count, 42); // ✅ OK
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

MIT © [Sylph](https://github.com/sylphxltd)

---

## Learn More

- [Documentation](https://github.com/sylphxltd/zen)
- [Examples](https://github.com/sylphxltd/zen/tree/main/examples)
- [Changelog](https://github.com/sylphxltd/zen/releases)

**Built with ⚡ by the Sylph team**
