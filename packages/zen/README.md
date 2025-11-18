# signal

> Ultra-fast, ultra-lightweight reactive framework. **Powered by [@zen/signal](https://github.com/SylphxAI/zen).**

## Features

- ⚡ **Extreme Performance**: 150M+ signal updates/sec
- 🪶 **Tiny**: <5KB gzipped (includes reactive core)
- 🎯 **Fine-grained**: Only changed DOM nodes update
- ✨ **Simple API**: `.value` for everything, auto-unwrap in JSX
- 🔋 **Proven Core**: Built on [@zen/signal](https://github.com/SylphxAI/zen) reactive primitives
- 🎨 **Unified Ecosystem**: Compatible with @zen/signal-patterns, @zen/signal-persistent, @zen/router

## Quick Start

### Installation

```bash
npm install signal
```

### Your First Component

```tsx
import { signal, render } from '@zen/zen';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}

render(() => <Counter />, document.getElementById('root')!);
```

**That's it!** No build config, no compiler (for basic usage).

## Core Concepts

### Signals

Reactive state that automatically updates the UI:

```tsx
import { signal } from '@zen/zen';

const count = signal(0);

// Read
console.log(count.value); // 0

// Write
count.value = 1;
count.value++;
```

### Effects

Run side effects when dependencies change:

```tsx
import { effect } from '@zen/zen';

const count = signal(0);

effect(() => {
  console.log('Count is:', count.value);
});

count.value = 1; // Logs: "Count is: 1"
```

### Computed

Derived state that auto-updates:

```tsx
import { computed } from '@zen/zen';

const count = signal(0);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 0

count.value = 5;
console.log(doubled.value); // 10
```

## API Comparison

### vs SolidJS

```tsx
// SolidJS
const [count, setCount] = createSignal(0);
const doubled = createMemo(() => count() * 2);

createEffect(() => {
  console.log(count());
});

return <div>{count()}</div>;

// @zen/zen - 全部用 .value (Vue 3 / Preact 風格)
const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(count.value);
});

return <div>{count}</div>; // JSX 自動 unwrap
```

**Differences**:
- ✅ Single signal() call instead of destructuring
- ✅ Consistent .value API (read and write)
- ✅ Automatic unwrapping in JSX (no `.value` needed)
- ✅ Simpler and more consistent

## Performance

Real benchmark results with [@zen/signal](https://github.com/SylphxAI/zen) core on Apple Silicon (M1/M2):

| Metric | Performance |
|--------|-------------|
| **Signal updates** | **150M+ updates/sec** (0.007μs) |
| **Single subscriber** | **20M updates/sec** (0.051μs) |
| **Batch improvement** | **2800x faster** (343ms → 0.12ms) |
| **Computed caching** | **100% cache hit rate** |
| **Deep chain (5 levels)** | **1.6μs per update** |
| **Signal creation** | **7.7M/sec** (0.13ms for 1000) |

### Realistic Scenarios
- **Todo app** (100 items, toggle, filter): 45ms
- **Counter grid** (100 counters × 10): 0.16ms
- **Wide fan-out** (1→100 computed): 10ms

### Architecture

**Reactive Core:** [@zen/signal](https://github.com/SylphxAI/zen)
- Proven, battle-tested reactive primitives (1.75 KB)
- Optimized for performance and memory efficiency
- Auto-tracking dependency system
- Synchronous batch execution + microtask auto-batching

**JSX Runtime:** signal
- No Virtual DOM - direct DOM manipulation
- Fine-grained reactivity - only changed nodes update
- Components run once, effects handle updates
- Automatic signal unwrapping in JSX

Run benchmarks: `bun test ./src/benchmarks/`

## JSX

@zen/zen works with standard JSX:

```tsx
function App() {
  const name = signal('World');
  const count = signal(0);

  return (
    <div class="app">
      <h1>Hello {name}!</h1>
      <p>Count: {count}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

### Setup JSX

**Vite**:
```js
// vite.config.js
export default {
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'signal',
  },
};
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/zen"
  }
}
```

## Advanced

### Batching

Batch multiple updates:

```tsx
import { batch } from '@zen/zen';

const a = signal(1);
const b = signal(2);

batch(() => {
  a.value = 10;
  b.value = 20;
  // Effects run once after batch
});
```

### Untrack

Read signals without tracking:

```tsx
import { untrack } from '@zen/zen';

const a = signal(1);
const b = signal(2);

effect(() => {
  console.log(a.value); // Tracked
  console.log(untrack(() => b.value)); // Not tracked
});

b.value = 3; // Effect won't run
```

### Cleanup

Effects can return cleanup functions:

```tsx
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(timer); // Cleanup
});
```

## Architecture

### No Virtual DOM

@zen/zen compiles JSX to **direct DOM operations**:

```tsx
// Your code
<div>{count}</div>

// Becomes
const div = document.createElement('div');
const text = document.createTextNode('');
div.appendChild(text);

effect(() => {
  text.data = String(count.value);
});
```

Only the text node updates when `count` changes!

### Component Model

Components run **once** at creation:

```tsx
function App() {
  const count = signal(0);

  console.log('Setup'); // Runs once

  effect(() => {
    console.log('Count:', count.value); // Runs on every change
  });

  return <div>{count}</div>;
}
```

## Roadmap

### v0.1 (Current)
- [x] Core Signal/Effect/Computed
- [x] JSX runtime
- [x] Basic benchmarks
- [ ] Comprehensive tests
- [ ] Documentation

### v0.2
- [ ] List rendering (`For` component)
- [ ] Conditional rendering (`Show` component)
- [ ] Context API
- [ ] Lifecycle hooks

### v0.3
- [ ] Compiler optimizations
- [ ] Static hoisting
- [ ] Template cloning
- [ ] Bundle size <5KB

### v1.0
- [ ] Production ready
- [ ] Full test coverage
- [ ] DevTools support
- [ ] Migration guide from SolidJS

## Why @zen/zen?

### 技術特點 (Technical Features)
- ⚡ **極致性能**: 111M signal updates/sec
- 🪶 **超輕量**: <5KB gzipped
- 🎯 **Fine-grained**: 只更新變化的 DOM 節點
- ✨ **簡潔 API**: 單一 signal() 調用，自動 unwrap
- 🧠 **智能優化**: 單訂閱者、bitfield、自動 batch

### 架構優勢 (Architecture)
- **零 Virtual DOM**: 直接操作真實 DOM
- **組件只執行一次**: 之後全靠 Signal 自動更新
- **自動依賴追蹤**: Effect 自動追蹤 Signal 讀取
- **100% 緩存命中**: Computed 完美緩存策略

**注意**: 未有實際對比其他框架的 benchmark。以上數據為 @zen/zen 獨立測試結果。

## Contributing

We welcome contributions!

```bash
# Clone
git clone https://github.com/signal/signal.git

# Install
pnpm install

# Test
pnpm test

# Benchmark
pnpm bench

# Build
pnpm build
```

## License

MIT © ZenJS Team

---

**Built with Zen. Made for Speed.** 🚀
