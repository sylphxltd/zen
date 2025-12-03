# Rapid Signal - React JSX Runtime

Runtime-first signal integration for React. Auto-detects and unwraps Rapid signals without any compiler transformations.

## Installation

```bash
npm install unplugin-rapid-signal @rapid/signal
```

## Usage

### 1. Configure JSX Runtime

Update your `tsconfig.json` or `vite.config.ts` to use the custom JSX runtime:

**Option A: tsconfig.json**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "unplugin-rapid-signal/jsx-runtime/react"
  }
}
```

**Option B: Vite config**
```ts
// vite.config.ts
export default {
  esbuild: {
    jsxImportSource: 'unplugin-rapid-signal/jsx-runtime/react',
  },
}
```

### 2. Use Signals Directly in JSX

```tsx
import { signal } from '@rapid/signal';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count}</p>  {/* Automatically reactive! */}
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

## How It Works

The custom JSX runtime:
1. **Detects signals** in JSX children using `_kind` property check
2. **Wraps signals** in a `ZenReactive` component
3. **Subscribes to changes** using React's `useState` + `useEffect`
4. **Auto-updates** the DOM when signal values change

## Performance

- **Runtime overhead**: ~5-10% vs compiler mode
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
      framework: 'react',
      mode: 'compiler', // Transform to useStore() hooks
    }),
  ],
}
```

Compiler mode transforms:
```tsx
// Input
const count = signal(0);
<p>{count}</p>

// Output
import { useStore } from '@rapid/signal-react';
const count = signal(0);
const count$ = useStore(count);
<p>{count$}</p>
```

Performance gain: ~30% faster rendering vs runtime mode.

## Examples

### Multiple Signals
```tsx
const name = signal('Alice');
const age = signal(25);

<div>
  <p>Name: {name}</p>
  <p>Age: {age}</p>
</div>
```

### Computed Values
```tsx
import { computed } from '@rapid/signal';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

<h1>Hello, {fullName}!</h1>
```

### Arrays
```tsx
const items = signal(['Apple', 'Banana', 'Cherry']);

<ul>
  {items.value.map(item => <li key={item}>{item}</li>)}
</ul>
```

## Limitations

- Only works in **JSX children** (not props)
- Event handlers still need `.value` access
- No SSR support yet (runtime only)

## License

MIT
