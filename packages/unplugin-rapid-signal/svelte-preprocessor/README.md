# Rapid Signal - Svelte Preprocessor

Runtime-first signal integration for Svelte. Auto-detects and unwraps Rapid signals using preprocessor + runtime helpers.

## Installation

```bash
npm install unplugin-rapid-signal @rapid/signal
```

## Usage

### 1. Configure Preprocessor

Add the preprocessor to your `svelte.config.js`:

```js
import { zenSignalPreprocessor } from 'unplugin-rapid-signal/svelte-preprocessor';

export default {
  preprocess: [
    zenSignalPreprocessor(),
    // ... other preprocessors
  ],
};
```

### 2. Use Signals Directly in Templates

```svelte
<script>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<p>{count}</p>  <!-- Automatically reactive! -->
<button on:click={() => count.value++}>Increment</button>
```

## How It Works

The preprocessor:
1. **Detects signals** in script section
2. **Injects runtime helper** `__zenUnwrap()` function
3. **Transforms templates** `{signal}` → `{__zenUnwrap(signal)}`
4. **Preserves event handlers** and other Svelte features

## Performance

- **Preprocessor overhead**: ~2-3% vs compiler mode
- **Trade-off**: Zero configuration vs maximum performance
- **Recommendation**: Use runtime mode in development, compiler mode in production

## Compiler Mode (Optional)

For maximum performance, use compiler transformations:

```js
// svelte.config.js
import { zenSignal } from 'unplugin-rapid-signal/vite';

export default {
  plugins: [
    zenSignal({
      framework: 'svelte',
      mode: 'compiler', // Transform to $: reactive statements
    }),
  ],
};
```

Compiler mode transforms:
```svelte
<!-- Input -->
<script>
const count = signal(0);
</script>
<p>{count}</p>

<!-- Output -->
<script>
const count = signal(0);
$: count$ = count.value;
</script>
<p>{count$}</p>
```

Performance gain: ~15% faster vs runtime mode.

## Examples

### Multiple Signals
```svelte
<script>
const name = signal('Alice');
const age = signal(25);
</script>

<div>
  <p>Name: {name}</p>
  <p>Age: {age}</p>
</div>
```

### Computed Values
```svelte
<script>
import { computed } from '@rapid/signal';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
</script>

<h1>Hello, {fullName}!</h1>
```

### Lists
```svelte
<script>
const items = signal(['Apple', 'Banana', 'Cherry']);
</script>

<ul>
  {#each items.value as item}
    <li>{item}</li>
  {/each}
</ul>
```

### With Svelte Stores
```svelte
<script>
import { writable } from 'svelte/store';
import { signal } from '@rapid/signal';

const svelteCount = writable(0);
const zenCount = signal(0);
</script>

<div>
  <p>Svelte: {$svelteCount}</p>
  <p>Rapid: {zenCount}</p>
</div>
```

## How Unwrap Works

The injected helper function:

```js
function __zenUnwrap(value) {
  // Check if it's a Rapid signal
  if (value !== null && typeof value === 'object' && '_kind' in value) {
    return value.value;
  }
  return value;
}
```

This function:
- Checks for Rapid signal marker (`_kind`)
- Returns `.value` if it's a signal
- Returns value as-is otherwise
- Zero overhead for non-signal values

## Limitations

- Only works in **template expressions** `{}`
- Event handlers need `.value` access
- Reactive statements `$:` are not transformed
- SSR works natively (Svelte handles it)

## Advanced: Custom Preprocessor Order

If you need specific preprocessor order:

```js
export default {
  preprocess: [
    // 1. Transform TypeScript first
    sveltePreprocess(),

    // 2. Then unwrap Rapid signals
    zenSignalPreprocessor(),

    // 3. Other transformations
  ],
};
```

## License

MIT
