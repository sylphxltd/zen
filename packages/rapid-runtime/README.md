# @rapid/runtime

Platform-agnostic runtime for Rapid framework.

## Features

- ✅ Control flow components (Show, For, Switch)
- ✅ Context API
- ✅ Utilities (lazy, mergeProps, selector)
- ✅ Server utilities (SSR support)
- ✅ **No DOM dependencies** - works everywhere

## Usage

```tsx
import { signal, Show, For } from '@rapid/runtime';

// Works in web, native, and TUI!
function Counter() {
  const count = signal(0);

  return (
    <Show when={() => count.value > 0}>
      <div>Count: {count.value}</div>
    </Show>
  );
}
```

## Architecture

This package contains **platform-agnostic** code only:
- No `document`, `window`, or DOM APIs
- Pure reactive primitives and components
- Can be used with any renderer (@rapid/web, @rapid/native, @rapid/tui)

For web-specific features, see [@rapid/web](../rapid-web).
