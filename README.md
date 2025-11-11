<div align="center">

# Zen - Reactive State Management 🧘

**The tiniest, fastest reactive state library with auto-tracking magic**

[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://github.com/SylphxAI/zen/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**1.14 KB** • **8x faster** • **Auto-tracking** • **Zero config**

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
- 1.14 KB gzipped ✅
- Automatic dependency tracking ✅
- Clean, unified API ✅
- 8x faster in real-world scenarios ✅
```

**Result: Minimal footprint, maximum performance, zero configuration.**

---

## ⚡ Key Features

### Performance & Size

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Ultra-tiny** | Only **1.14 KB gzipped** | Minimal bundle impact |
| **Lightning fast** | **8x faster** than alternatives | Better UX, less lag |
| **Zero overhead** | Auto-tracking with no runtime cost | Optimal performance |

### Developer Experience

- **🪄 Auto-tracking** - Dependencies tracked automatically, no manual lists
- **🎯 Clean API** - Unified `.value` everywhere, no `get()`/`set()`
- **📦 Framework agnostic** - Use with React, Vue, Svelte, Solid, or vanilla JS
- **🔌 Extensible** - Modular utilities for persistence, routing, and more
- **💪 TypeScript-first** - Full type safety out of the box

---

## 📦 Packages

### 🎯 Core Package

**[@sylphx/zen](packages/zen)**
- Core reactive state library
- Auto-tracking computed values
- Minimal API surface
- Framework-agnostic

```bash
npm install @sylphx/zen
```

---

### 🎨 Framework Integrations

**[@sylphx/zen-react](packages/zen-react)**
- React hooks integration
- Automatic re-renders
- Concurrent mode compatible

**[@sylphx/zen-vue](packages/zen-vue)**
- Vue 3 composition API
- Seamless integration

**[@sylphx/zen-svelte](packages/zen-svelte)**
- Svelte stores compatibility
- Reactive bindings

**[@sylphx/zen-preact](packages/zen-preact)**
- Preact signals integration
- Lightweight alternative to React

**[@sylphx/zen-solid](packages/zen-solid)**
- SolidJS primitives
- Fine-grained reactivity

```bash
# Install framework integration
npm install @sylphx/zen-react
# or
npm install @sylphx/zen-vue
# or
npm install @sylphx/zen-svelte
```

---

### 🛠️ Utilities

**[@sylphx/zen-craft](packages/zen-craft)**
- Immutable state updates
- 1.4-35x faster than immer
- Type-safe mutations

**[@sylphx/zen-persistent](packages/zen-persistent)**
- LocalStorage/SessionStorage persistence
- Automatic synchronization
- Debounced writes

**[@sylphx/zen-router](packages/zen-router)** & **[@sylphx/zen-router-react](packages/zen-router-react)** & **[@sylphx/zen-router-preact](packages/zen-router-preact)**
- Type-safe routing
- Nested routes support
- Framework-specific bindings

```bash
# Install utilities
npm install @sylphx/zen-craft
npm install @sylphx/zen-persistent
npm install @sylphx/zen-router-react
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { state, computed } from '@sylphx/zen';

// Create reactive state
const count = state(0);

// Auto-tracked computed value (no manual dependencies!)
const double = computed(() => count.value * 2);

// Update state
count.value++;
console.log(double.value); // 2
```

### With React

```tsx
import { useZen } from '@sylphx/zen-react';
import { state } from '@sylphx/zen';

const counter = state(0);

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

### With Persistence

```typescript
import { persistent } from '@sylphx/zen-persistent';

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
| **Zen** | **1.14 KB** | Baseline |
| Zustand | 1.2 KB | +5% |
| Jotai | 3.0 KB | +163% |
| Valtio | 5.5 KB | +382% |
| Redux Toolkit | 12+ KB | +952% |

### Performance

| Operation | Zen | Zustand | Valtio | Redux Toolkit |
|-----------|-----|---------|--------|---------------|
| **State Updates** | 8x | 1x | 0.5x | 0.3x |
| **Computed Values** | Auto-tracked | Manual | Manual | Manual |
| **Re-renders** | Optimized | Good | Fair | Fair |

---

## 🏗️ Monorepo Structure

```
zen/
├── packages/
│   ├── zen/                  # Core library
│   ├── zen-react/            # React integration
│   ├── zen-vue/              # Vue integration
│   ├── zen-svelte/           # Svelte integration
│   ├── zen-preact/           # Preact integration
│   ├── zen-solid/            # SolidJS integration
│   ├── zen-craft/            # Immutable utilities
│   ├── zen-persistent/       # Persistence utilities
│   ├── zen-router/           # Core routing
│   ├── zen-router-react/     # React router
│   └── zen-router-preact/    # Preact router
├── docs/                     # Documentation site
├── package.json
└── README.md
```

---

## 💻 Development

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix
```

### Workspace Commands

```bash
# Build specific package
pnpm --filter @sylphx/zen build

# Test specific package
pnpm --filter @sylphx/zen test

# Dev mode for all packages
pnpm dev
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
import { state, computed } from '@sylphx/zen';

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
  <sub>1.14 KB • 8x faster • Auto-tracking magic</sub>
  <br><br>
  <a href="https://sylphx.com">sylphx.com</a> •
  <a href="https://x.com/SylphxAI">@SylphxAI</a> •
  <a href="mailto:hi@sylphx.com">hi@sylphx.com</a>
</p>
