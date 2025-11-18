<div align="center">

# Zen Ecosystem 🧘

**Ultra-fast reactive primitives (@zen/signal) and fine-grained framework (@zen/zen)**

[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://github.com/SylphxAI/zen/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**2.49 KB** • **2.97x vs Solid** • **Auto-tracking** • **Zero config**

[Core Package](#-core-package) • [Framework Integrations](#-framework-integrations) • [Utilities](#-utilities) • [Quick Start](#-quick-start)

</div>

---

## 🚀 Overview

Zen is a revolutionary reactive state management library that combines extreme minimalism with magical auto-tracking. Built for modern applications, Zen provides the smallest bundle size without sacrificing performance or developer experience.

**The Problem:**
```
Traditional state libraries:
- Large bundle sizes ❌
- Manual dependency tracking ❌
- Verbose APIs ❌
- Poor performance ❌
```

**The Solution:**
```
Zen:
- 2.49 KB gzipped ✅
- Automatic dependency tracking ✅
- Clean, unified API ✅
- Blazing fast performance ✅
```

**Result: Minimal footprint, maximum performance, zero configuration.**

---

## ⚡ Key Features

### Performance & Size

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Ultra-tiny** | Only **2.49 KB gzipped** (v3.8) | Minimal bundle impact |
| **Lightning fast** | **2.97x slower vs Solid.js** | Competitive performance |
| **Zero overhead** | Auto-tracking with minimal runtime cost | Optimal performance |

### Developer Experience

- **🪄 Auto-tracking** - Dependencies tracked automatically, no manual lists
- **🎯 Clean API** - Unified `.value` everywhere, no `get()`/`set()`
- **📦 Framework agnostic** - Use with React, Vue, Svelte, Solid, or vanilla JS
- **🔌 Extensible** - Modular utilities for persistence, routing, and more
- **💪 TypeScript-first** - Full type safety out of the box

---

## 📦 Packages

### 🎯 Core Packages

**[@zen/signal](packages/zen-signal)**
- Core reactive primitives (signal, computed, effect)
- Auto-tracking dependency system
- Ultra-tiny bundle (1.75 KB)
- Foundation for Zen ecosystem

**[@zen/zen](packages/zen)**
- Fine-grained reactive framework
- No virtual DOM - direct DOM updates
- Component render once, signals auto-update
- JSX with automatic signal unwrapping

```bash
npm install @zen/signal
```

---

### 🎨 Framework Integrations

**[@zen/signal-react](packages/zen-signal-react)**
- React hooks integration
- Automatic re-renders
- Concurrent mode compatible

**[@zen/signal-vue](packages/zen-signal-vue)**
- Vue 3 composition API
- Seamless integration

**[@zen/signal-svelte](packages/zen-signal-svelte)**
- Svelte stores compatibility
- Reactive bindings

**[@zen/signal-preact](packages/zen-signal-preact)**
- Preact signals integration
- Lightweight alternative to React

**[@zen/signal-solid](packages/zen-signal-solid)**
- SolidJS primitives
- Fine-grained reactivity

```bash
# Install framework integration
npm install @zen/signal-react
# or
npm install @zen/signal-vue
# or
npm install @zen/signal-svelte
```

---

### 🛠️ Utilities

**[@zen/signal-patterns](packages/zen-signal-patterns)** - **NEW v2.0** 🎉
- Useful patterns built on zen core APIs
- Store pattern (Zustand-style)
- Async state management
- Map pattern (key-level reactivity)
- DeepMap pattern (path-level reactivity)
- Only **936 B gzipped**

**[@zen/signal-craft](packages/zen-signal-craft)**
- Immutable state updates
- 1.4-35x faster than immer
- Type-safe mutations

**[@zen/signal-persistent](packages/zen-signal-persistent)**
- LocalStorage/SessionStorage persistence
- Automatic synchronization
- Debounced writes

**[@zen/router](packages/zen-router)** & **[@zen/router-react](packages/zen-router-react)** & **[@zen/router-preact](packages/zen-router-preact)**
- Type-safe routing
- Nested routes support
- Framework-specific bindings

```bash
# Install utilities
npm install @zen/signal-patterns  # NEW! Useful patterns
npm install @zen/signal-craft
npm install @zen/signal-persistent
npm install @zen/router-react
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { signal, computed } from '@zen/signal';

// Create reactive state
const count = signal(0);

// Auto-tracked computed value (no manual dependencies!)
const double = computed(() => count.value * 2);

// Update state
count.value++;
console.log(double.value); // 2
```

### With React

```tsx
import { useZen } from '@zen/signal-react';
import { signal } from '@zen/signal';

const counter = signal(0);

function Counter() {
  const count = useZen(counter);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.value++}>Increment</button>
    </div>
  );
}
```

### With Patterns

```typescript
import { store, computedAsync, map } from '@zen/signal-patterns';
import { signal } from '@zen/signal';

// Zustand-style store pattern
const counter = store(() => {
  const count = signal(0);
  return {
    count,
    increase: () => count.value++,
    decrease: () => count.value--
  };
});

// Async state management
const user = computedAsync(async () => {
  const res = await fetch('/api/user');
  return res.json();
});

// Key-level reactivity for objects
const form = map({
  name: '',
  email: '',
  age: 0
});
```

### With Persistence

```typescript
import { persistent } from '@zen/signal-persistent';

// Automatically synced with localStorage
const settings = persistent('user-settings', {
  theme: 'dark',
  language: 'en'
});

// Changes are automatically persisted
settings.value.theme = 'light';
```

---

## 📊 Comparison

### Bundle Size

| Library | Size (gzipped) | Difference |
|---------|----------------|------------|
| Zustand | 1.2 KB | Baseline |
| **Zen v3.8** | **2.49 KB** | +108% |
| Jotai | 3.0 KB | +150% |
| Valtio | 5.5 KB | +358% |
| Redux Toolkit | 12+ KB | +900% |

### Performance (vs Solid.js)

| Library | Performance | Auto-tracking | Computed |
|---------|------------|---------------|----------|
| Solid.js | 1x (baseline) | ✅ Yes | ✅ Yes |
| **Zen v3.8** | **2.97x slower** | ✅ Yes | ✅ Yes |
| Zustand | Manual tracking | ❌ No | ❌ No |
| Valtio | Auto (Proxy) | ✅ Proxy | ❌ No |
| Redux | Manual tracking | ❌ No | ❌ No |

---

## 🏗️ Monorepo Structure

```
zen/
├── packages/
│   ├── zen-signal/             # @zen/signal - Reactive primitives
│   ├── zen/                    # @zen/zen - Fine-grained framework
│   ├── zen-signal-react/       # @zen/signal-react - React integration
│   ├── zen-signal-vue/         # @zen/signal-vue - Vue integration
│   ├── zen-signal-svelte/      # @zen/signal-svelte - Svelte integration
│   ├── zen-signal-preact/      # @zen/signal-preact - Preact integration
│   ├── zen-signal-solid/       # @zen/signal-solid - SolidJS integration
│   ├── zen-signal-craft/       # @zen/signal-craft - Immutable utilities
│   ├── zen-signal-patterns/    # @zen/signal-patterns - Useful patterns
│   ├── zen-signal-persistent/  # @zen/signal-persistent - Persistence
│   ├── zen-router/             # @zen/router - Core routing
│   ├── zen-router-react/       # @zen/router-react - React router
│   └── zen-router-preact/      # @zen/router-preact - Preact router
├── docs/                       # Documentation site
├── package.json
└── README.md
```

---

## 💻 Development

### Setup

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test

# Watch mode
bun test:watch

# Linting
bun run lint
bun run lint:fix
```

### Workspace Commands

```bash
# Build specific package
bun run build --filter @zen/signal

# Test specific package
bun test --filter @zen/signal

# Dev mode for all packages
bun run dev
```

---

## 📚 Documentation

### Core Concepts

- **State** - Reactive values that trigger updates
- **Computed** - Auto-tracked derived values
- **Effects** - Side effects that run on changes
- **Persistence** - Automatic storage synchronization

### Framework Integration

Each framework package provides idiomatic bindings:
- React: `useZen()` hook
- Vue: Composition API compatible
- Svelte: Store-compatible
- Solid: Signal-compatible

See individual package READMEs for detailed documentation.

---

## 🎯 Use Cases

### Application State

```typescript
import { state, computed } from '@zen/signal';

const user = state({ name: 'Alice', age: 30 });
const isAdult = computed(() => user.value.age >= 18);
```

### Form Management

```typescript
const form = state({
  email: '',
  password: ''
});

const isValid = computed(() =>
  form.value.email.includes('@') &&
  form.value.password.length >= 8
);
```

### UI State

```typescript
const theme = persistent('theme', 'dark');
const sidebar = state({ open: false });
const modal = state({ show: false, content: null });
```

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript 5.9 |
| **Package Manager** | pnpm |
| **Monorepo** | pnpm workspaces + Turbo |
| **Testing** | Vitest |
| **Bundling** | tsup |
| **Linting** | Biome |
| **Documentation** | VitePress |

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Core reactive state library
- [x] Auto-tracking computed values
- [x] React integration
- [x] Vue integration
- [x] Svelte integration
- [x] Preact integration
- [x] SolidJS integration
- [x] Immutable utilities (zen-craft)
- [x] Persistence utilities
- [x] Routing (zen-router)

### 🚀 Planned

- [ ] DevTools integration
- [ ] Time-travel debugging
- [ ] Performance profiler
- [ ] React Native support
- [ ] SSR optimizations
- [ ] More utility packages

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Open an issue** - Discuss changes before implementing
2. **Fork the repository**
3. **Create a feature branch** - `git checkout -b feature/my-feature`
4. **Follow code standards** - Run `pnpm lint`
5. **Write tests** - Maintain high coverage
6. **Submit a pull request**

### Development Workflow

```bash
# 1. Install dependencies
pnpm install

# 2. Make changes to packages

# 3. Build and test
pnpm build
pnpm test

# 4. Lint and format
pnpm lint:fix
pnpm format

# 5. Create changeset
pnpm changeset

# 6. Commit and push
git commit -m "feat: add new feature"
git push
```

---

## 📄 License

MIT © [Sylphx](https://sylphx.com)

---

## 🙏 Credits

Built with:
- [TypeScript](https://www.typescriptlang.org/) - Language
- [pnpm](https://pnpm.io/) - Package manager
- [Turbo](https://turbo.build/) - Monorepo tool
- [Vitest](https://vitest.dev/) - Testing framework
- [Biome](https://biomejs.dev/) - Linting & formatting

---

<p align="center">
  <strong>The tiniest, fastest reactive state library</strong>
  <br>
  <sub>2.49 KB • 2.97x vs Solid • Auto-tracking magic</sub>
  <br><br>
  <a href="https://sylphx.com">sylphx.com</a> •
  <a href="https://x.com/SylphxAI">@SylphxAI</a> •
  <a href="mailto:hi@sylphx.com">hi@sylphx.com</a>
</p>
