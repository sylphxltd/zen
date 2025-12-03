# Getting Started

Get up and running with Rapid in minutes.

## Installation

Install Rapid using your favorite package manager:

```bash
# npm
npm install @rapid/web

# bun
bun add @rapid/web

# pnpm
pnpm add @rapid/web
```

## Your First App

Create a simple counter application:

```typescript
import { render, signal } from '@rapid/web';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <h1>Count: {count.value}</h1>
      <button onClick={() => count.value++}>
        Increment
      </button>
    </div>
  );
}

render(() => <Counter />, document.getElementById('app'));
```

## Setup with Vite

Configure Vite for JSX automatic runtime:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@rapid/web'
  }
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rapid/web"
  }
}
```

That's it! You're ready to build reactive UIs with Rapid.
