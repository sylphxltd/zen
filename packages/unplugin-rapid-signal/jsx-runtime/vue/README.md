# Rapid Signal - Vue JSX Runtime

Runtime-first signal integration for Vue. Auto-detects and unwraps Rapid signals without any compiler transformations.

## Installation

```bash
npm install unplugin-rapid-signal @rapid/signal
```

## Usage

### 1. Configure Custom h() Function (Optional for JSX)

If you're using JSX in Vue:

```ts
// vite.config.ts
export default {
  resolve: {
    alias: {
      'vue': 'unplugin-rapid-signal/jsx-runtime/vue',
    },
  },
}
```

### 2. Use Signals Directly in Templates

```vue
<script setup>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>  <!-- Automatically reactive! -->
    <button @click="count.value++">Increment</button>
  </div>
</template>
```

## How It Works

The custom runtime:
1. **Detects signals** using `_kind` property check
2. **Wraps signals** in Vue `ref()` with `watchEffect()`
3. **Syncs changes** from Rapid signal to Vue ref
4. **Auto-updates** the DOM through Vue's reactivity

## Performance

- **Runtime overhead**: ~3-5% vs compiler mode
- **Trade-off**: Zero configuration vs maximum performance
- **Recommendation**: Use runtime mode in development, compiler mode in production

## Compiler Mode (Optional)

For maximum performance, use compiler transformations:

```ts
// vite.config.ts
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default {
  plugins: [
    zenSignal({
      framework: 'vue',
      mode: 'compiler', // Transform to computed()
    }),
  ],
}
```

Compiler mode transforms:
```vue
<!-- Input -->
<script setup>
const count = signal(0);
</script>
<template>
  <p>{{ count }}</p>
</template>

<!-- Output -->
<script setup>
import { computed } from 'vue';
const count = signal(0);
const count$ = computed(() => count.value);
</script>
<template>
  <p>{{ count$ }}</p>
</template>
```

Performance gain: ~20% faster vs runtime mode.

## Examples

### Multiple Signals
```vue
<script setup>
const name = signal('Alice');
const age = signal(25);
</script>

<template>
  <div>
    <p>Name: {{ name }}</p>
    <p>Age: {{ age }}</p>
  </div>
</template>
```

### Computed Values
```vue
<script setup>
import { computed } from '@rapid/signal';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
</script>

<template>
  <h1>Hello, {{ fullName }}!</h1>
</template>
```

### Lists
```vue
<script setup>
const items = signal(['Apple', 'Banana', 'Cherry']);
</script>

<template>
  <ul>
    <li v-for="item in items.value" :key="item">{{ item }}</li>
  </ul>
</template>
```

## Integration with Vue Reactivity

Rapid signals work seamlessly with Vue's reactivity:

```vue
<script setup>
import { ref } from 'vue';
import { signal } from '@rapid/signal';

const vueCount = ref(0);
const zenCount = signal(0);
</script>

<template>
  <div>
    <p>Vue: {{ vueCount }}</p>
    <p>Rapid: {{ zenCount }}</p>
  </div>
</template>
```

## Limitations

- Only works in **template interpolations** `{{ }}` (not v-bind)
- Event handlers need `.value` access
- Composables should use Vue's `ref()` for consistency

## License

MIT
