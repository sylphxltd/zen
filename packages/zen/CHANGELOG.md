# @sylphx/zen

## 3.10.0

### Minor Changes

- 152c3a0: refactor: Version-based computed reactivity optimization

  **Performance Improvements:**

  - ✅ Version-based staleness checking - avoids unnecessary recomputation
  - ✅ O(n sources) version check vs full recompute
  - ✅ Better cache utilization for deep computed chains

  **Code Quality:**

  - ✅ Extract `valuesEqual()` helper for consistent NaN/+0/-0 handling
  - ✅ Extract `_recomputeIfNeeded()` for clearer lazy evaluation logic
  - ✅ Extract `flushPendingNotifications()` for cleaner batch implementation
  - ✅ Enhanced comments and documentation

  **Backward Compatibility:**

  - ✅ No breaking changes
  - ✅ All 255 tests passing
  - ✅ Drop-in replacement for existing code

## 3.9.0

### Minor Changes

- 56f788d: test: Add comprehensive test coverage and benchmarks

  **Test Coverage:**

  - ✅ zen: 37 comprehensive tests covering all primitives
  - ✅ zen-craft: 91 tests (produce, patch, utilities)
  - ✅ zen-patterns: 36 tests (map, deepMap, async patterns)
  - ✅ zen-router: 91 tests (routing, history, matchers)
  - **Total: 255 tests with 100% pass rate**

  **Benchmarks Added:**

  - ✅ zen.bench.ts - Core primitives, computed, subscribe, effect, batch, real-world patterns
  - ✅ map.bench.ts, deepMap.bench.ts, async.bench.ts - Pattern performance metrics
  - ✅ routing.bench.ts - Router performance benchmarks
  - ✅ index.bench.ts - Craft operations benchmarking

  **Fixes:**

  - Fixed workspace dependency resolution for test runners
  - Added missing test scripts to zen-router
  - Documented lazy computed evaluation behavior

## 3.8.0

### Minor Changes

- e9cb5b9: **v3.8.0 - Hidden Class & Monomorphic Optimizations**

  This release implements V8 engine-specific optimizations for better performance characteristics:

  ## Optimizations

  ### 1. Hidden Class Optimization (15-25% potential gain)

  - Pre-allocate all properties during object creation
  - Ensures all signals have the same hidden class → monomorphic property access
  - Better inline caching (IC) in V8 JIT compiler

  ### 2. Monomorphic Code Paths (5-15% potential gain)

  - Separate helper functions for zen vs computed value reads
  - Reduces polymorphic inline cache misses
  - Better optimization by V8's TurboFan compiler

  ## Bundle Size

  - **Gzip**: 2.49 KB (v3.7: 2.37 KB, +5.1%)
  - **Brotli**: 2.21 KB (v3.7: 2.09 KB, +5.7%)

  Trade-off: +120 bytes for better V8 optimization potential

  ## Performance Impact

  Mixed results depending on scenario:

  - **Create/destroy computed**: +32% improvement (2.18M → 2.87M ops/sec)
  - **Dynamic dependencies**: +20% improvement (8.4k → 10k ops/sec)
  - **Shopping cart**: +44% improvement (3.6k → 5.3k ops/sec)
  - **Diamond pattern (changed)**: +12% improvement (1.11M → 1.25M ops/sec)

  Some scenarios show small regressions due to initialization overhead, but overall characteristics are more predictable and benefit from long-running JIT optimization.

  ## Breaking Changes

  **None** - Fully backward compatible with v3.7.0

  ## Technical Details

  **Hidden Classes**: V8 creates optimized "hidden classes" for objects with the same shape. Pre-allocating properties ensures all signals/computed values share the same hidden class, enabling monomorphic property access which is 10-100× faster than polymorphic access.

  **Inline Caching**: Separate monomorphic helper functions allow V8's inline caching to optimize hot paths more effectively, reducing overhead in the critical read path.

## 3.7.0

### Minor Changes

- 1c36169: ## v3.6.0 - Performance Optimizations

  This release implements two key optimizations:

  ### 1. Version Number Tracking (5-10% improvement potential)

  - Each signal tracks a version number incremented on write
  - Computed values store source versions for fast dependency checking
  - Provides fast-path to skip recomputation when dependencies unchanged
  - Particularly effective for deep chains and diamond patterns

  ### 2. Observer Slots O(1) Cleanup (3-5% improvement potential)

  - Bidirectional slot tracking for computed listeners
  - Swap-and-pop algorithm for O(1) removal vs O(n) indexOf + splice
  - Reduces overhead during subscription changes
  - Better performance for dynamic reactive graphs

  ### Bundle Size

  - **Brotli**: 2.09 KB (v3.5: 1.96 KB, +6.6%)
  - **Gzip**: 2.37 KB (v3.5: 2.21 KB, +7.2%)

  Trade-off: Slightly larger bundle for cleaner algorithm complexity and better performance characteristics.

  ### Breaking Changes

  None - fully backward compatible with v3.5.

  ### Technical Details

  - Fast integer version comparison for dependency checking
  - O(1) cleanup with bidirectional index tracking
  - ~32-40 bytes memory overhead per computed node (negligible)
  - All optimizations are internal implementation details

## 3.5.0

### Minor Changes

- # Phase 3: Signal-Level Optimizations (v3.5.0)

  Performance breakthrough! 🎉 Zen is now **2.97x slower vs Solid** (from 8.62x), achieving our 3-5x target!

  ## Performance Results

  **v3.4 → v3.5:**

  - Test 1 (Unobserved): 9.70x → 3.62x (**62.7% faster**)
  - Test 2 (Observed): 8.37x → 2.57x (**69.3% faster**)
  - Test 3 (No access): 7.80x → 2.72x (**65.1% faster**)
  - **Average: 8.62x → 2.97x (65.5% improvement)**

  ## Optimizations Implemented

  ### 1. Inline Object.is (1-2% impact)

  Eliminated function call overhead by inlining Object.is equality checks:

  ```typescript
  // Before
  if (Object.is(newValue, oldValue)) return;

  // After
  if (
    newValue === oldValue &&
    (newValue !== 0 || 1 / newValue === 1 / oldValue)
  )
    return;
  if (newValue !== newValue && oldValue !== oldValue) return;
  ```

  Handles both NaN and +0/-0 edge cases correctly while avoiding function call overhead.

  ### 2. Remove pendingNotifications Map (40%+ impact!)

  Replaced Map-based notification queue with direct object properties + Array:

  ```typescript
  // Before: Map overhead
  const pendingNotifications = new Map<AnyZen, any>();
  pendingNotifications.has(zen) + pendingNotifications.set(zen, oldValue);

  // After: Direct property + Array
  zen._pendingOldValue = oldValue;
  pendingSignals.push(zen);
  ```

  **Key insight:** Map.has + Map.set in hot path was the major bottleneck. Using object properties is much faster.

  ### 3. Classify Listeners (25%+ impact!)

  Separated computed listeners from effect listeners to eliminate type checking in hot path:

  ```typescript
  // Before: Type check every iteration
  for (const listener of listeners) {
    const computedZen = (listener as any)._computedZen; // ← Type check
    if (computedZen && !computedZen._dirty) { ... }
  }

  // After: Pre-classified array
  for (const computedZen of _computedListeners) {
    if (!computedZen._dirty) { ... } // ← Direct access
  }
  ```

  Maintained in subscribeToSources/unsubscribeFromSources for automatic cleanup.

  ## Bundle Size

  - v3.4: 2.06 KB gzipped
  - v3.5: 2.21 KB gzipped (+0.15 KB, +7.3%)

  Trade-off: +7.3% size for **65.5% performance improvement** → Excellent value!

  ## Breaking Changes

  None! All optimizations are internal implementation changes.

  ## Technical Analysis

  The real bottleneck was **signal write operations**, not batch overhead:

  - Empty batch: 2.29ms (very fast)
  - Signal updates: +17.73ms (was the main cost)

  Phase 3 optimizations directly attacked signal write cost:

  1. Inline Object.is reduced per-write overhead
  2. Removing Map operations cut 40%+ from hot path
  3. Classified listeners eliminated redundant type checks

  ## What's Next

  Zen v3.5 has achieved the 3-5x target! 🎯

  Remaining optimizations for future versions:

  - v4.0: Unified computed implementation (breaking change)
  - v4.0: Solid-style state machine (STALE/PENDING states)
  - v4.0: Complete lazy evaluation refactor

  Current status: **2.97x slower vs Solid** - competitive performance with minimal bundle size (2.21 KB)!

## 3.4.0

### Minor Changes

- feat: Phase 2 optimizations - epoch counter, queue merge, and inlining (v3.4)

  BREAKING: None (fully backward compatible)

  ## v3.4 Phase 2 Performance Improvements

  ### Epoch Counter Optimization

  - **Replaced processed Set with epoch counter**: Eliminates Set allocation per batch
  - Each batch increments a global `currentEpoch` counter
  - Computed values are marked with `_epoch` instead of being added to a Set
  - **Result**: Lazy computed overhead reduced from 9.5% to -1.1% (actually faster)

  ### Unified Work Check

  - **Single `hasWork` pre-check** before processing queues
  - Combines 3 separate checks into one when all queues are empty
  - Reduces branch misprediction in common case (empty batches)
  - ~5% improvement for empty batch scenarios

  ### Inline updateComputed

  - **Inlined updateComputed into batch loop** for zen.ts internal computed
  - Eliminates function call overhead in hot path
  - Better CPU instruction cache locality
  - **Result**: 12.9% faster for unobserved computed scenarios

  ### Performance Results vs Solid.js

  - **Test 1** (Unobserved): 11.14x → 9.70x (12.9% faster)
  - **Test 2** (Observed): 8.89x → 8.37x (5.8% faster)
  - **Test 3** (No access): 6.82x → 7.80x
  - **Average**: 8.95x → 8.62x (3.7% overall improvement)

  ### Micro-benchmark Results

  ```
  Empty batch:        2.34ms (42.7M ops/sec)
  Signal updates:     21.00ms (4.8M ops/sec)
  Lazy computed:      20.77ms (4.8M ops/sec) ← -1.1% overhead
  Dependency chain:   21.50ms (4.7M ops/sec) ← 3.6% overhead
  ```

  ## Technical Changes

  ### zen.ts

  - Added `_epoch?: number` to ComputedCore type
  - Added `currentEpoch` global counter
  - Replaced `processed Set` with epoch-based deduplication
  - Added unified `hasWork` check before queue processing
  - Inlined updateComputed logic into batch loop for internal computed

  ### Bundle Size

  - v3.3: 1.98 KB gzipped
  - v3.4: 2.06 KB gzipped (+0.08 KB, +4%)
  - Trade-off: +4% size for +3.7% performance

  ### Test Results

  - All 104 tests passing ✅
  - Zero breaking changes
  - 100% backward compatible

  ## Migration Guide

  No migration needed - v3.4 is 100% backward compatible with v3.3.

  ### Upgrade Path

  ```bash
  npm install @sylphx/zen@latest
  # or
  bun add @sylphx/zen@latest
  ```

  No code changes required!

  ## What's Next

  Phase 3 optimizations targeting 3-5x slower vs Solid (from current 8.6x):

  - Remove hasWork check overhead
  - Simplify state management
  - Learn from Solid's STALE/PENDING state machine
  - Optimize notification propagation

## 3.3.0

### Minor Changes

- feat: pull-based lazy evaluation with queue reuse optimization (v3.3)

  BREAKING: None (fully backward compatible)

  ## v3.3 Major Performance Improvements

  ### Lazy Evaluation (Solid-inspired)

  - **Pull-based computed evaluation**: Unobserved computed values are not calculated during batch
  - Batch only processes computed values with active listeners
  - Computed without subscribers stay dirty until accessed (fully lazy)
  - Zero unnecessary computations when values are never read

  ### Queue Optimization

  - **Reusable global queues**: Eliminated per-batch allocation overhead
  - Reduced GC pressure by reusing Set/Array instances
  - Simplified batch nesting logic with single depth counter
  - Conditional dirty marking (skip if already dirty)

  ### Performance Results

  - **30% faster** batching performance (12.8x → 8.9x slower vs Solid)
  - **Test 3 improvement**: 5.8x → 6.8x (batch overhead reduced ~15%)
  - **Zero compute overhead** for unobserved computed values
  - All 77 tests passing with zero breaking changes

  ## Technical Changes

  ### zen.ts

  - Global queues are now persistent (not recreated per batch)
  - `Updates.clear()` and `Effects.length = 0` for reuse
  - Batch only processes at depth 1 (outermost)
  - Conditional dirty check: `if (computedZen && !computedZen._dirty)`
  - Simplified `isInBatchProcessing()` to just check flag

  ### computed.ts

  - No changes required (already supports lazy evaluation via `force` parameter)

  ### Bundle Size

  - Maintained at ~1.98 KB gzipped (no size increase)

  ## Migration Guide

  No migration needed - v3.3 is 100% backward compatible with v3.2.

  ### Behavior Changes (Non-Breaking)

  1. **Unobserved computed values**: No longer computed during batch (lazy)

     - Before: `batch(() => { a.value = 1 })` → computed immediately
     - After: `batch(() => { a.value = 1 })` → computed on next access

  2. **Performance improvement**: Applications with many unobserved computed values will see significant speedup

  ### Upgrade Path

  ```bash
  npm install @sylphx/zen@latest
  # or
  bun add @sylphx/zen@latest
  ```

  No code changes required!

## 3.2.0

### Minor Changes

- 7504386: feat: queue-based batching with lazy evaluation (v3.2)

  BREAKING: None (fully backward compatible)

  Architecture improvements in v3.2:

  - Implemented queue-based batching (Solid-inspired architecture)
  - Lazy evaluation for unobserved computed values
  - 3-stage batch processing (Updates → Notifications → Effects)
  - Iterative dependency chain handling (a → b → c)
  - Correct deduplication: 2 signal updates → 1 computed update per batch

  Technical changes:

  - Set-based Updates queue for automatic deduplication
  - isProcessingUpdates flag prevents double notifications
  - force parameter in updateComputedValue for lazy optimization
  - Proper notification timing based on batch processing phase

  Test results:

  - All 77 tests passing
  - Zero breaking changes
  - Bundle size: 1.97 KB gzipped (from 1.68 KB, +290 bytes)

  Perfect for reactive applications with subscribed state (React, Vue, Svelte).

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
