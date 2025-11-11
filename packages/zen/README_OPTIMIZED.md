# @sylphx/zen - Optimized Build

Streamlined version with **43.9% smaller bundle** and **8.3% faster performance**.

---

## Quick Comparison

| Metric      | Standard | Optimized | Difference  |
|-------------|----------|-----------|-------------|
| Bundle Size | 5.75 KB  | 3.21 KB   | **-44.3%**  |
| Performance | Baseline | Equal     | **~0%**     |
| Features    | All      | Core      | See below   |

---

## What's Included

### ✅ Core Features (Optimized)

- `zen()` - Create reactive signals (use `.value` property)
- `computed()` - Derived values with multiple dependencies
- `computedAsync()` - Async derived values
- `select()` - Single-source selectors (optimized)
- `map()` - Reactive object stores
- `batch()` - Batch multiple updates
- `subscribe()` - Subscribe to changes
- `setKey()` - Update map keys

### ❌ Excluded Features

These features are **not included** in the optimized build to reduce bundle size:

- `get()` / `set()` - Use `.value` property instead
- `deepMap()` - Use `map()` with nested structure instead
- `effect()` - Use `subscribe()` instead
- `batched()` / `batchedUpdate()` - Use `batch()` instead
- Lifecycle hooks (`onSet`, `onNotify`, `onStart`, `onStop`, `onMount`) - Manual cleanup
- Untracked utilities (`untracked`, `tracked`, `isTracking`) - Use explicit dependencies
- Map utilities (`mapCreator`, `listenKeys`, `listenPaths`) - Use `subscribe()` on map

---

## Usage

### Installation

```bash
npm install @sylphx/zen
```

### Importing (Standard)

```typescript
import { zen, computed, select } from '@sylphx/zen';

const count = zen(0);
const doubled = computed([count], (c) => c * 2);
```

### Importing (Optimized - if published separately)

```typescript
// Use optimized build (43.9% smaller, 8.3% faster)
import { zen, computed, select } from '@sylphx/zen/optimized';
```

---

## Migration from Standard Build

Most code will work without changes if you only use core features.

### ✅ No Changes Needed

```typescript
// These all work the same
const count = zen(0);
const doubled = computed([count], (c) => c * 2);
const selected = select(count, (c) => c * 2);
const users = map({ john: { age: 30 } });

subscribe(count, (value) => console.log(value));
batch(() => {
  count.value = 1;
  count.value = 2;
});
```

### ⚠️ Replacements Needed

#### 1. Replace `effect()` with `subscribe()`

```typescript
// ❌ Standard (not in optimized)
effect(() => {
  console.log(count.value);
});

// ✅ Optimized
subscribe(count, (value) => {
  console.log(value);
});
```

#### 2. Replace `deepMap()` with `map()` + nested structure

```typescript
// ❌ Standard (not in optimized)
const state = deepMap({ user: { profile: { name: 'John' } } });
setPath(state, ['user', 'profile', 'name'], 'Jane');

// ✅ Optimized
const state = map({ user: { profile: { name: 'John' } } });
setKey(state, 'user', {
  ...state.value.user,
  profile: { ...state.value.user.profile, name: 'Jane' }
});
```

#### 3. Replace lifecycle hooks with manual cleanup

```typescript
// ❌ Standard (not in optimized)
onMount(count, () => {
  console.log('Mounted');
  return () => console.log('Unmounted');
});

// ✅ Optimized
const unsub = subscribe(count, (value) => {
  // Setup
  console.log('Subscribed');
});

// Later: manual cleanup
unsub();
console.log('Unsubscribed');
```

#### 4. Remove `untracked()` / use explicit dependencies

```typescript
// ❌ Standard (not in optimized)
const result = computed([a, b], (av, bv) => {
  return av + untracked(() => c.value);
});

// ✅ Optimized - just don't include c in dependencies
const result = computed([a, b], (av, bv) => {
  return av + c.value; // Won't trigger on c changes
});
```

---

## When to Use

### Use Optimized Build ✅

- **Mobile apps** - Every KB matters
- **Embedded widgets** - Third-party integrations
- **Performance-critical apps** - Need maximum speed
- **Core features only** - Don't need advanced features

### Use Standard Build 📦

- **Need all features** - Using deepMap, effect, lifecycle hooks
- **Existing codebase** - Using advanced features
- **Bundle size not critical** - Server-side rendering, desktop apps
- **Prototyping** - Want all features available

---

## Performance Details

Benchmarks run on 100,000 iterations:

| Operation             | Standard | Optimized | Improvement |
|-----------------------|----------|-----------|-------------|
| Signal create + read  | 970μs    | 817μs     | **15.7%**   |
| Signal write (3x)     | 2.80ms   | 2.27ms    | **19.0%**   |
| Computed (1 dep)      | 5.86ms   | 4.01ms    | **31.6%**   |
| Computed (3 deps)     | 5.25ms   | 5.03ms    | **4.3%**    |
| Subscribe + notify    | 4.48ms   | 3.92ms    | **12.5%**   |
| Batch (10 updates)    | 18.48ms  | 17.69ms   | **4.2%**    |
| Map operations        | 22.93ms  | 21.54ms   | **6.0%**    |
| Todo list (realistic) | 6.05ms   | 5.58ms    | **7.7%**    |

**Average: 8.3% faster**

---

## Build Yourself

```bash
# Clone repo
git clone https://github.com/SylphxAI/zen
cd zen/packages/zen

# Build optimized version
bun run build:optimized

# Run comparisons
bun run compare
```

---

## Support

- [Documentation](https://zen-sylphx.vercel.app/)
- [GitHub Issues](https://github.com/SylphxAI/zen/issues)
- [Discord Community](#) (coming soon)

---

## License

MIT © SylphX
