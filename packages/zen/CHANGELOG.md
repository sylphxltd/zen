# @sylphx/zen

## 3.1.1

### Patch Changes

- b8764fe: Fix missing dist files in npm package

  **Issue**: v3.1.0 was published without compiled dist/ files due to CI build not running properly.

  **Fix**: Updated release workflow to build packages directly instead of using turbo.

  **Note**: If you installed v3.1.0, please upgrade to v3.1.1.

## 3.1.0

### Minor Changes

- 4c23a25: Optimize core package size and performance

  **Bundle Size Improvements:**

  - Reduced from 2.61 KB to 1.68 KB gzipped (-36%)
  - Removed unused features (select, batched, batchedUpdate)
  - Removed object pooling optimization
  - Simplified computed implementation

  **Performance Results (vs v3.0.0):**

  - Atom operations: Same or faster (1.00-1.11x)
  - Batch operations: 33% faster (1.33x)
  - Computed creation: 16% slower (acceptable trade-off)
  - All other operations: Same performance

  **Features:**

  - Added effect() API for side effects with auto-tracking
  - Cleaner, more maintainable codebase
  - Better balance of size, performance, and features

  **Trade-offs:**

  - Size: +42% vs v3.0.0 (1.18 KB → 1.68 KB) - justified by effect API
  - Computed creation: 16% slower - acceptable for cleaner implementation

## 3.1.0

### Minor Changes

#### ✨ Effect API

New `effect()` function for side effects with auto-tracking:

```typescript
import { zen, effect } from "@sylphx/zen";

const count = zen(0);

// Auto-tracks dependencies
const dispose = effect(() => {
  console.log("Count:", count.value);

  // Optional cleanup
  return () => console.log("Cleanup");
});

dispose(); // Stop effect
```

**Features:**

- **Auto-tracking**: Automatically tracks accessed signals
- **Cleanup support**: Return cleanup function for resource management
- **Batching**: Effects run after all updates complete
- **Explicit deps**: Optional dependency array for hot paths

#### 🗑️ Removed: computedAsync

Removed `computedAsync` API as it was rarely used and not part of core reactive patterns. For async operations, use `effect()` with manual state management:

```typescript
// Before (computedAsync)
const data = computedAsync(async () => {
  return await fetch("/api/data");
});

// After (effect + zen)
const data = zen(null);
const loading = zen(true);

effect(() => {
  loading.value = true;
  fetch("/api/data")
    .then((res) => res.json())
    .then((result) => {
      data.value = result;
      loading.value = false;
    });
});
```

#### 📦 Bundle Size

- **Smaller core**: 2.96 KB raw (1.13 KB gzipped)
- **Effect API included**: Complete reactivity in minimal size
- Still the smallest reactive library with full features

#### ⚡ Performance

- **Signal operations**: Maintained excellent performance (~45M ops/s)
- **Computed values**: Optimized performance (~15M ops/s create, ~50M ops/s read)
- **Effect batching**: Efficient batch processing with minimal overhead

### Breaking Changes

- **Removed**: `computedAsync()` - Use `effect()` with manual state management instead
- No other breaking changes to existing APIs

## 3.0.0

### Major Changes

#### 🪄 Auto-tracking Magic

The biggest change in v3.0 is **automatic dependency tracking** - no more manual dependency arrays!

```typescript
// v2.x - Manual dependencies
const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

// v3.0 - Auto-tracking!
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
```

**Why auto-tracking?**

- **2.12x faster** for conditional dependencies
- **Zero boilerplate** - no manual dependency management
- **Smarter updates** - only tracks active code paths
- **Better DX** - focus on logic, not plumbing

#### ⚡ Performance Improvements

- **blazing fast** in real-world applications (counter app: ~800K ops/s vs ~100K ops/s)
- **2.12x faster** conditional dependencies with auto-tracking (~20M ops/s vs ~9.4M ops/s)
- **1.33x faster** simple computed values (~15M ops/s vs ~11.3M ops/s)
- **Lazy subscription** - computed values only subscribe when accessed
- **Smart tracking** - dynamically adjusts subscriptions based on code paths

#### 📦 Bundle Size

- **80% smaller** than v2: **1.68 KB** gzipped (was 5.7 KB)
- **60% smaller** than Preact Signals (1.68 KB vs 2.89 KB)
- React integration: +0.3KB
- Vue integration: +0.2KB

#### 🔧 Breaking Changes

**Computed API Change**

```typescript
// v2.x - Explicit dependencies (still works as fallback)
const sum = computed([a, b], (aVal, bVal) => aVal + bVal);

// v3.0 - Auto-tracking (recommended)
const sum = computed(() => a.value + b.value);

// v3.0 - Explicit deps still supported for hot paths
const sum = computed(() => a.value + b.value, [a, b]);
```

**Select API Introduced**

```typescript
const user = zen({ name: "John", age: 30 });
const userName = select(user, (u) => u.name);
```

#### ✨ New Features

- **Auto-tracking reactivity**: Automatic dependency detection
- **Conditional dependency tracking**: Only tracks accessed code paths
- **Lazy subscription**: Computed values only subscribe when first accessed
- **Select API**: Optimized single-source selectors (~7% faster than computed)
- **Optional explicit deps**: Bypass auto-tracking for critical hot paths

#### 📚 Migration Guide

See [Migration Guide v2 to v3](https://zen.sylphx.com/guide/migration-v2-to-v3) for detailed upgrade instructions.

Most code will work with minimal changes - just remove dependency arrays from `computed()` calls to enable auto-tracking!

## 2.0.0

### Major Changes

#### Native Property Accessors

The biggest change in v2.0 is the switch from function-based to property-based access:

- 73% faster reads
- 56% faster writes
- More intuitive API
- Better code ergonomics

**Breaking Changes:**

- `get(store)` → `store.value`
- `set(store, value)` → `store.value = value`
- `compute()` → `computed()`
- `listen()` → `subscribe()`
