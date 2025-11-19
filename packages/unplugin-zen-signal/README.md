# unplugin-zen-signal

> Universal plugin for using Zen Signals across all frameworks with unified syntax

## Why?

Use the same reactive signal syntax across **all** frameworks:

```tsx
import { signal } from '@zen/signal';

const count = signal(0);

// Works in React, Vue, Svelte, Solid, Zen - same code!
<div>{count.value}</div>
```

## Installation

```bash
npm install unplugin-zen-signal @zen/signal
```

## Usage

### Vite (React example)

```ts
// vite.config.ts
import { zenSignal } from 'unplugin-zen-signal/vite';
import react from '@vitejs/plugin-react';

export default {
  plugins: [
    react(),
    zenSignal({ framework: 'react' }),
  ],
};
```

### Webpack

```js
// webpack.config.js
const { zenSignal } = require('unplugin-zen-signal/webpack');

module.exports = {
  plugins: [
    zenSignal({ framework: 'react' }),
  ],
};
```

### Rollup

```js
// rollup.config.js
import { zenSignal } from 'unplugin-zen-signal/rollup';

export default {
  plugins: [
    zenSignal({ framework: 'react' }),
  ],
};
```

## How it works

The plugin transforms `signal.value` accesses at compile time:

**Input (your code):**
```tsx
const count = signal(0);
return <div>{count.value}</div>;
```

**Output (compiled):**
```tsx
import { useStore } from '@zen/signal-react';

const count = signal(0);
const count$ = useStore(count);
return <div>{count$}</div>;
```

## Supported Frameworks

- ✅ **React** - Transforms to `useStore()` hook
- ✅ **Preact** - Same as React
- 🚧 **Vue** - Coming soon
- 🚧 **Svelte** - Coming soon
- ✅ **Solid** - Works natively, no transformation needed
- ✅ **Zen** - Native framework

## Options

```ts
interface Options {
  framework?: 'react' | 'vue' | 'svelte' | 'solid' | 'preact';
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  debug?: boolean;
}
```

## License

MIT
