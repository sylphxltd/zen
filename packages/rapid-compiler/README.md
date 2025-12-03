# @rapid/compiler

Optional JSX transformer for Rapid framework.

## Features

- ✅ Auto-lazy children: `<Show><Child /></Show>` → automatic wrapping
- ✅ Signal auto-unwrap: `{signal}` → `{() => signal.value}`
- ✅ Platform-agnostic: Works with web, native, and TUI
- ✅ Plugin for Vite, Webpack, Metro

## Installation

```bash
bun add -D @rapid/compiler
```

## Usage

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import zenCompiler from '@rapid/compiler/vite';

export default defineConfig({
  plugins: [zenCompiler()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@rapid/web', // or @rapid/native, @rapid/tui
  },
});
```

### Without Compiler (Manual)

```tsx
// You need to manually wrap children
<Show when={() => condition.value}>
  {() => <ExpensiveComponent />}
</Show>
```

### With Compiler (Auto)

```tsx
// Compiler auto-wraps for you
<Show when={condition}>
  <ExpensiveComponent />
</Show>
```

## How It Works

The compiler is a **syntax transformer** only - it doesn't generate platform-specific code.

It transforms JSX at build time to make lazy evaluation automatic, then your chosen renderer (@rapid/web, @rapid/native, @rapid/tui) handles the actual rendering.

## Options

```ts
zenCompiler({
  autoLazy: true,        // Auto-wrap children in lazy components
  autoUnwrap: true,      // Auto-unwrap signals in JSX
  lazyComponents: [      // Components that need lazy children
    'Show', 'For', 'Switch', 'Suspense', 'ErrorBoundary'
  ],
})
```
