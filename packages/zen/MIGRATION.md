# Migration Guide: Zen v2 → v3

## Quick Summary

Zen v3 introduces auto-tracking reactivity with a simpler, more powerful API:
- **80% smaller** bundle (1.14 KB vs 5.76 KB)
- **8x faster** in real-world scenarios
- **Auto-tracking** - no manual dependency arrays needed
- **Cleaner API** - unified `.value` everywhere

---

## Breaking Changes

### 1. Computed API Changed

**v2:**
```typescript
const count = zen(0);
const doubled = computed([count], (v) => v * 2);
//                      ^^^^^^^ deps array required
```

**v3:**
```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);
//                       ^^^^^^^^^^^^^^^^^^^^ auto-tracks dependencies
```

### 2. No More get() and set()

**v2:**
```typescript
import { zen, get, set } from '@sylphx/zen';

const count = zen(0);
console.log(get(count));
set(count, 5);
```

**v3:**
```typescript
import { zen } from '@sylphx/zen';

const count = zen(0);
console.log(count.value);  // Read
count.value = 5;           // Write
```

---

## Migration Steps

### Step 1: Update imports

Remove `get` and `set` from imports:

```diff
- import { zen, computed, get, set, subscribe } from '@sylphx/zen';
+ import { zen, computed, subscribe } from '@sylphx/zen';
```

### Step 2: Replace get() with .value

```diff
- const value = get(mySignal);
+ const value = mySignal.value;
```

### Step 3: Replace set() with .value =

```diff
- set(mySignal, newValue);
+ mySignal.value = newValue;
```

### Step 4: Update computed()

```diff
const a = zen(1);
const b = zen(2);

- const sum = computed([a, b], (av, bv) => av + bv);
+ const sum = computed(() => a.value + b.value);
```

---

## New Features

### Auto-tracking with Conditional Logic

v3 automatically tracks only the dependencies you actually use:

```typescript
const mode = zen('light');
const lightBg = zen('#ffffff');
const darkBg = zen('#000000');

// Only subscribes to the active branch!
const background = computed(() =>
  mode.value === 'light' ? lightBg.value : darkBg.value
);

// Changing darkBg doesn't trigger when mode is 'light'
darkBg.value = '#111111'; // No update!
```

This is **2.1x faster** than manual dependency arrays!

### Async Computed Values

New `computedAsync()` for async operations:

```typescript
import { zen, computedAsync } from '@sylphx/zen';

const userId = zen(1);

const user = computedAsync(async () => {
  const id = userId.value;  // Auto-tracked!
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// Access state
console.log(user.value.loading);  // true/false
console.log(user.value.data);     // undefined | User
console.log(user.value.error);    // undefined | Error
```

---

## Optional: Explicit Dependencies

For performance-critical code, you can still use explicit dependencies:

```typescript
const sum = computed(() => a.value + b.value, [a, b]);
//                                            ^^^^^^ optional
```

**When to use:**
- Performance-critical hot paths
- Profiler shows computed is a bottleneck
- Dependencies are static and known

**Default (auto-tracking) is recommended for 90% of cases.**

---

## Example: Complete Migration

**Before (v2):**
```typescript
import { zen, computed, get, set, subscribe } from '@sylphx/zen';

const count = zen(0);
const doubled = computed([count], (v) => v * 2);

subscribe(doubled, (value) => {
  console.log('Doubled:', value);
});

console.log(get(doubled));  // 0
set(count, 5);
console.log(get(doubled));  // 10
```

**After (v3):**
```typescript
import { zen, computed, subscribe } from '@sylphx/zen';

const count = zen(0);
const doubled = computed(() => count.value * 2);

subscribe(doubled, (value) => {
  console.log('Doubled:', value);
});

console.log(doubled.value);  // 0
count.value = 5;
console.log(doubled.value);  // 10
```

---

## Benefits of v3

✅ **80% smaller** - 1.14 KB vs 5.76 KB gzipped
✅ **8x faster** - in real-world counter apps
✅ **Auto-tracking** - no manual deps needed
✅ **Cleaner API** - unified `.value` everywhere
✅ **Async support** - built-in `computedAsync`
✅ **Better DX** - less boilerplate, more magic

---

## Need Help?

- [Full Documentation](https://zen.sylphx.com/)
- [GitHub Issues](https://github.com/SylphxAI/zen/issues)
- [NPM Package](https://www.npmjs.com/package/@sylphx/zen)
