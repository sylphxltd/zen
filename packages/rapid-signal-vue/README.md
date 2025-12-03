# @rapid/signal-vue

Vue integration for Rapid Signals with auto-unwrap and lifecycle management.

## Installation

```bash
npm install @rapid/signal-vue
```

## Usage

### 1. Configure Plugin

```ts
// vite.config.ts
import { zenSignal } from '@rapid/signal-vue/vite';

export default {
  plugins: [zenSignal()]
};
```

### 2. Use Signals

```vue
<script setup>
import { signal } from '@rapid/signal-vue';

const count = signal(0);
</script>

<template>
  <div>
    <p>{{ count }}</p>  <!-- Auto-unwrap! No .value needed -->
    <button @click="count.value++">Increment</button>
  </div>
</template>
```

## Features

- ✅ Auto-unwrap signals in templates (`{{ signal }}`)
- ✅ Automatic lifecycle cleanup
- ✅ Works with all bundlers (Vite, Webpack, Rollup, esbuild)
- ✅ TypeScript support

## API

Re-exports all primitives from `@rapid/signal`:

```ts
import { signal, computed, effect, batch } from '@rapid/signal-vue';
```

## License

MIT
