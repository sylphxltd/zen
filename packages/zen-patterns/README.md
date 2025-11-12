# @sylphx/zen-patterns

Useful patterns and helpers built on top of `@sylphx/zen` core.

All patterns use only public zen APIs (`zen`, `computed`, `effect`, `subscribe`), making them simple, transparent, and easy to customize.

## Installation

```bash
npm install @sylphx/zen @sylphx/zen-patterns
```

## Patterns

### 📦 Store Pattern

Zustand-style factory function wrapper for creating stores with encapsulated state.

```typescript
import { zen } from '@sylphx/zen';
import { store } from '@sylphx/zen-patterns';

const counter = store(() => {
  const count = zen(0);
  return {
    count,
    increase: () => count.value++,
    decrease: () => count.value--
  };
});

counter.increase();
console.log(counter.count.value); // 1
```

### ⚡ Async Pattern

Async state management with automatic loading/error/data handling.

```typescript
import { computedAsync } from '@sylphx/zen-patterns';

const user = computedAsync(async () => {
  const res = await fetch('/api/user');
  return res.json();
});

// Access state
console.log(user.state.value.loading);
console.log(user.state.value.data);
console.log(user.state.value.error);

// Refetch
user.refetch();
```

### 🗺️ Map Pattern

Key-level reactivity for objects. Only components listening to changed keys will re-render.

```typescript
import { map, listenKeys } from '@sylphx/zen-patterns';

const form = map({
  name: '',
  email: '',
  age: 0
});

// Listen to specific keys only
listenKeys(form, ['name'], (value, key) => {
  console.log('Name changed:', value);
});

// Only name listeners will trigger
form.setKey('name', 'John');

// Email change won't trigger name listeners
form.setKey('email', 'john@example.com');
```

### 🌳 DeepMap Pattern

Path-level reactivity for nested objects. Selective notifications at any nesting level.

```typescript
import { deepMap, listenPaths } from '@sylphx/zen-patterns';

const config = deepMap({
  ui: {
    theme: 'dark',
    layout: {
      sidebar: 'left',
      width: 200
    }
  }
});

// Listen to nested path
listenPaths(config, ['ui.theme'], (value) => {
  console.log('Theme changed:', value);
});

// Only theme listeners will trigger
config.setPath('ui.theme', 'light');

// Layout changes won't trigger theme listeners
config.setPath('ui.layout.width', 300);
```

## Why Patterns?

These patterns are **not magic** - they're built entirely on public zen APIs:

- `store()` is just a factory function wrapper
- `computedAsync()` uses `zen()` + `effect()`
- `map()` uses `computed()` for key-level tracking
- `deepMap()` uses `computed()` for path-level tracking

You can:
- Read the source code (it's simple!)
- Customize them for your needs
- Copy-paste them into your project
- Learn how zen works by studying them

## Bundle Size

- **936 B gzipped** for all patterns
- Tree-shakeable - only import what you need
- Zero dependencies except `@sylphx/zen`

## Documentation

Full documentation at [https://zen.sylphx.com](https://zen.sylphx.com)

## License

MIT © Sylphx
