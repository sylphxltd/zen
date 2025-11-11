# What is Zen?

Zen is a revolutionary reactive state management library with **auto-tracking magic**. It's designed to be:

- **Ultra-tiny** - Only **1.14 KB gzipped** (80% smaller than v2)
- **Blazing fast** - 8x faster in real-world applications
- **Auto-tracking** - Dependencies tracked automatically, zero config
- **Type-safe** - Full TypeScript support with excellent type inference
- **Framework-agnostic** - Works with React, Vue, Svelte, Solid, Preact, and vanilla JS

## Design Philosophy

Zen v3 follows these core principles:

### 1. Auto-tracking Magic

No more manual dependency arrays! Zen v3 automatically tracks which signals you access:

```typescript
const firstName = zen('John');
const lastName = zen('Doe');

// Auto-tracks firstName and lastName - no dependency array!
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"
```

**Why auto-tracking?**
- ✅ Less boilerplate - no manual dependency management
- ✅ Smarter updates - only tracks active branches in conditional logic
- ✅ Faster - 2.12x faster for conditional dependencies
- ✅ Cleaner code - focus on logic, not plumbing

### 2. Extreme Performance

Zen v3 combines auto-tracking with zero-overhead reactivity:

- **8x faster** in real-world applications vs v2
- **2.12x faster** for conditional dependencies
- **1.33x faster** for simple computed values
- Native getters/setters for minimal overhead
- Smart subscription management

### 3. Minimal Bundle Size

Every byte counts. Zen v3 is the smallest reactive library with auto-tracking:

- Core: **1.14 KB gzipped** (vs 2.89 KB for Preact Signals, 4.5 KB for Solid)
- React integration: +0.3KB
- Vue integration: +0.2KB
- Built-in async support with `computedAsync`

### 4. Framework Agnostic

Zen works everywhere with the same API:

```typescript
// Vanilla JS
const count = zen(0);
count.value++;

// React
const value = useStore(count);

// Vue
const value = useStore(count);

// Svelte
const store = fromZen(count);
```

### 5. Simplicity First

State management shouldn't require learning complex APIs:

```typescript
const count = zen(0);

// Read
console.log(count.value);

// Write
count.value = 1;

// Increment
count.value++;
```

## Key Features

### Auto-tracking Reactivity

Dependencies tracked automatically:

```typescript
const mode = zen<'light' | 'dark'>('light');
const lightBg = zen('#ffffff');
const darkBg = zen('#000000');

// Only tracks the active branch!
const background = computed(() =>
  mode.value === 'light' ? lightBg.value : darkBg.value
);

// Changing darkBg doesn't trigger when mode is 'light'
darkBg.value = '#111111'; // No update!
```

### Built-in Async Support

`computedAsync` with automatic request cancellation:

```typescript
const userId = zen(1);

const user = computedAsync(async () => {
  const id = userId.value; // Auto-tracked!
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Access loading/data/error states
console.log(user.value.loading);
console.log(user.value.data);
console.log(user.value.error);
```

### Conditional Dependencies

Smart tracking that only subscribes to what you use:

```typescript
const showCount = zen(true);
const count = zen(0);
const message = zen('Hello');

const display = computed(() =>
  showCount.value ? count.value : message.value
);

// Only triggers when showCount is true
count.value++; // Updates display

showCount.value = false;
message.value = 'Hi'; // Now updates display
count.value++; // Doesn't update display
```

## Comparison with Alternatives

| Feature | Zen v3 | Preact Signals | Solid | MobX |
|---------|--------|----------------|-------|------|
| Bundle Size | **1.14 KB** | 2.89 KB | 4.5 KB | 16.5 KB |
| Auto-tracking | ✅ | ✅ | ✅ | ✅ |
| Performance | **8x faster** | Baseline | ~2x slower | Much slower |
| Built-in Async | ✅ | ❌ | ❌ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Framework-agnostic | ✅ | ✅ | ❌ | ✅ |
| Batching | ✅ | ✅ | ✅ | ✅ |

**Why Zen over alternatives?**
- **60% smaller** than Preact Signals with same auto-tracking magic
- **8x faster** in real-world scenarios
- Built-in `computedAsync` for async workflows
- Optional explicit dependencies for performance-critical code
- Zero dependencies, tree-shakeable

## When to Use Zen

Zen is a great choice when you need:

- **Automatic dependency tracking** without manual arrays
- **Ultra-lightweight** state management (1.14 KB!)
- **Framework-agnostic** solution that works everywhere
- **High performance** with 8x faster real-world speed
- **Type-safe** state with excellent TypeScript support
- **Built-in async support** with loading states

## When NOT to Use Zen

Consider alternatives if you need:

- Built-in Redux DevTools support
- Time-travel debugging out of the box
- Deep React integration with suspense and transitions
- Massive enterprise apps with extremely complex state graphs

**Note:** For most applications, Zen's simplicity, performance, and small size make it an excellent choice!

## Performance Highlights

Real-world benchmarks show dramatic improvements:

- **Counter App:** 8x faster than Preact Signals
- **Conditional Logic:** 2.12x faster than explicit dependencies
- **Simple Computed:** 1.33x faster than v2
- **Bundle Size:** 80% smaller than v2

## Next Steps

- [Getting Started](/guide/getting-started) - Install and use Zen v3
- [Core Concepts](/guide/core-concepts) - Learn about auto-tracking
- [Migration from v2](/guide/migration-v2-to-v3) - Upgrade to v3
- [API Reference](/api/core) - Detailed API documentation
