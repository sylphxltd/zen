# @sylphx/zen

## 2.0.0

### Major Changes

- # v2.0.0 - Major Release with Breaking Changes

  Zen v2.0.0 is a major version upgrade delivering **44% average performance improvement** through a new property-based API, reactive async capabilities, and significant optimizations.

  ## 💥 BREAKING CHANGE #1: New zen.value API

  The biggest change in v2.0.0 is the new property-based API that **replaces** the old `get()`/`set()` functions.

  ### Before (v1.x - REMOVED)

  ```typescript
  import { zen, get, set } from "@sylphx/zen";

  const count = zen(0);
  const value = get(count); // ❌ NO LONGER WORKS
  set(count, 1); // ❌ NO LONGER WORKS
  ```

  ### After (v2.0 - REQUIRED)

  ```typescript
  import { zen } from "@sylphx/zen";

  const count = zen(0);
  const value = count.value; // ✅ 73% faster reads!
  count.value = 1; // ✅ 56% faster writes!
  count.value++; // ✅ Increment works too!
  ```

  ### Why This Change?

  - **73% faster reads** (285M ops/s vs 165M ops/s)
  - **56% faster writes** (105M ops/s vs 67M ops/s)
  - More intuitive and natural JavaScript syntax
  - Better TypeScript inference
  - Aligns with modern JavaScript property patterns

  ### Migration Steps

  1. Replace all `get(zenInstance)` with `zenInstance.value`
  2. Replace all `set(zenInstance, value)` with `zenInstance.value = value`
  3. Test your application thoroughly

  **Migration Example:**

  ```typescript
  // ❌ Old (v1.x)
  const count = zen(0);
  subscribe(count, () => console.log(get(count)));
  set(count, get(count) + 1);

  // ✅ New (v2.0)
  const count = zen(0);
  subscribe(count, () => console.log(count.value));
  count.value = count.value + 1;
  // or simply:
  count.value++;
  ```

  ## 💥 BREAKING CHANGE #2: Removed karma/zenAsync

  The `karma` and `zenAsync` APIs have been completely removed in favor of the new `computedAsync` which provides true reactive async computation.

  ### Before (v1.x - REMOVED)

  ```typescript
  import { zen, karma, runKarma } from "@sylphx/zen";

  const fetchUser = karma(async (id: number) => fetchUserAPI(id));

  // Manual execution required
  await runKarma(fetchUser, userId.value);

  // When userId changes, must manually re-run
  userId.value = 2;
  await runKarma(fetchUser, userId.value); // ❌ Manual!
  ```

  ### After (v2.0 - REQUIRED)

  ```typescript
  import { zen, computedAsync, subscribe } from "@sylphx/zen";

  const userId = zen(1);
  const user = computedAsync([userId], async (id) => fetchUserAPI(id));

  subscribe(user, (state) => {
    if (state.loading) console.log("Loading...");
    if (state.data) console.log("User:", state.data);
    if (state.error) console.log("Error:", state.error);
  });

  // Automatic re-execution!
  userId.value = 2; // ✅ Automatically refetches!
  ```

  ### Why the Change?

  1. **True Reactivity**: `computedAsync` is fully reactive - dependencies are tracked automatically
  2. **Simpler API**: No need for manual `runKarma` calls
  3. **Better DX**: Loading/error states built-in
  4. **Smaller Bundle**: Saves significant bytes

  ## ✨ NEW FEATURE: computedAsync

  Reactive async computed values that automatically re-execute when dependencies change.

  ```typescript
  import { zen, computedAsync } from "@sylphx/zen";

  const userId = zen(1);

  // Async computed that automatically tracks dependencies
  const user = computedAsync([userId], async (id) => {
    return await fetchUser(id);
  });

  subscribe(user, (state) => {
    if (state.loading) console.log("Loading...");
    if (state.data) console.log("User:", state.data);
    if (state.error) console.log("Error:", state.error);
  });

  // Automatically refetches when dependency changes!
  userId.value = 2; // ✅ Triggers automatic refetch
  ```

  ### Features

  - ✅ **Automatic dependency tracking** - Changes propagate automatically
  - ✅ **Loading/Error states** - Built-in state management
  - ✅ **Race condition protection** - Stale promises automatically ignored
  - ✅ **Multiple dependencies** - Track any number of zen instances
  - ✅ **Nested computeds** - Mix sync and async computations
  - ✅ **Lazy evaluation** - Only executes when subscribed

  ### API

  ```typescript
  // Basic usage
  const result = computedAsync([dep1, dep2], async (val1, val2) => {
    return await fetchData(val1, val2);
  });

  // With options
  const result = computedAsync([userId], async (id) => fetchUser(id), {
    staleTime: 5000, // Background refetch if older than 5s
    equalityFn: (a, b) => a.id === b.id, // Custom equality
  });
  ```

  ## 🚀 Performance Improvements

  v2.0.0 delivers massive performance improvements across the board:

  ### Overall

  - **+44% average performance** (with new zen.value API)
  - **12 out of 13 benchmarks faster** (92% success rate)

  ### Top Performance Gains

  - **zen.value read**: +73% (285M vs 165M ops/s) 🔥
  - **Subscribe/Unsubscribe**: +61% (17.7M vs 11.0M ops/s) 🔥
  - **Computed creation**: +59% (14.9M vs 9.4M ops/s) 🔥
  - **Computed updates**: +58% (17.9M vs 11.4M ops/s) 🔥
  - **zen.value write**: +56% (105M vs 67M ops/s) 🔥
  - **Batch updates**: +49% (8.6M vs 5.8M ops/s)
  - **Map updates**: +45% (42.1M vs 29.1M ops/s)
  - **Map creation**: +37% (14.4M vs 10.5M ops/s)
  - **Computed reads**: +34% (153M vs 114M ops/s)
  - **Zen creation**: +33% (114M vs 85.5M ops/s)
  - **Complex reactive graphs**: +19% (5.3M vs 4.5M ops/s)

  ### Performance by Category

  | Category            | Avg Improvement | Range                 |
  | ------------------- | --------------- | --------------------- |
  | **Basic Zen**       | +54.20%         | +33.12% to +73.35%    |
  | **Computed**        | +50.30%         | +34.04% to +59.04%    |
  | **Batch**           | +48.53%         | +48.53%               |
  | **Maps**            | +40.86%         | +36.96% to +44.76%    |
  | **Subscriptions**   | +37.93%         | +14.99% to +60.86%    |
  | **Complex Graphs**  | +18.92%         | +18.92%               |
  | **Stress Test**     | +1.13%          | +1.13%                |

  See `VERSION_COMPARISON_REPORT.md` for detailed benchmark results.

  ## 📦 Bundle Size

  **Smaller bundle despite adding features!**

  - **ESM (gzip)**: 5.76 KB (was 6.01 KB, **-4.2%**)
  - **CJS (gzip)**: 5.99 KB (was 6.25 KB, **-4.2%**)

  ## 🎯 Complete Reactive System

  Zen v2.0.0 now offers a complete reactive state management solution:

  - ✅ Reactive sync computed (`computed`)
  - ✅ Reactive async computed (`computedAsync`) - **NEW!**
  - ✅ Property-based API (`zen.value`) - **NEW!**
  - ✅ Reactive effects (`effect`)
  - ✅ Reactive maps (`map`, `deepMap`)
  - ✅ Reactive selectors (`select`)
  - ✅ Batching (`batch`)
  - ✅ Lifecycle hooks (`onMount`, `onStart`, `onStop`)

  ## 🔧 Technical Optimizations

  v2.0.0 includes numerous micro-optimizations:

  1. **Prototype Chain**: Zero closure overhead for getter/setter
  2. **Simplified markDirty()**: Removed redundant undefined checks
  3. **Optimized \_setImpl()**: Better code generation, fewer branches
  4. **Subscribe Fast-Path**: Cached properties, early exit conditions
  5. **updateIfNecessary()**: Direct method check vs string comparison
  6. **computedAsync**: Reduced object creation, less GC pressure

  ## 📚 Documentation

  - `VERSION_COMPARISON_REPORT.md` - Complete performance comparison vs v1.2.1
  - `COMPUTED_ASYNC_IMPLEMENTATION.md` - Implementation details
  - `REACTIVE_ASYNC_ANALYSIS.md` - Feature comparison

  ## 🚨 Migration Guide

  This is a **major version** with **required migration** for all projects:

  ### Step 1: Update zen.value API (REQUIRED)

  ```typescript
  // Find and replace:
  get(x) → x.value
  set(x, v) → x.value = v
  ```

  ### Step 2: Migrate karma/zenAsync (if used)

  ```typescript
  // Replace karma with computedAsync
  // See examples above
  ```

  ### Step 3: Test Thoroughly

  - Run your test suite
  - Check for any TypeScript errors
  - Test reactive behavior in your app

  ## 🎉 Summary

  v2.0.0 is a major upgrade with breaking changes:

  - 💥 **BREAKING**: `get()`/`set()` replaced with `zen.value` API
  - 💥 **BREAKING**: `karma`/`zenAsync` removed, use `computedAsync`
  - ✨ **NEW**: `zen.value` property API (73% faster reads, 56% faster writes)
  - ✨ **NEW**: `computedAsync` for reactive async patterns
  - 🚀 **44% average performance improvement**
  - 📦 **4.2% smaller bundle size**

  **Migration is required** for all projects. See migration guide above.

## 1.3.0

### Minor Changes

- baf470f: Major performance optimization with getter/setter API

  ## 🚀 Performance Improvements

  - **Hot Path**: +28% (38.7M → 49.6M ops/s)
  - **Stress Test**: +95% (138K → 270K ops/s)
  - **Update 100**: +52% (845K → 1.28M ops/s)
  - **Batch**: +33% (1.26M → 1.67M ops/s)

  ## ✨ New Features

  ### Getter/Setter API

  Introducing a more intuitive property-based API:

  ```typescript
  const count = zen(0);

  // New API (recommended)
  count.value; // read
  count.value = 1; // write
  count.value++; // increment

  // Old API (still supported)
  get(count); // read
  set(count, 1); // write
  ```

  ## 🔧 Technical Improvements

  1. **Prototype Chain**: Zero closure overhead - all instances share methods via prototype
  2. **Loop Unrolling**: Optimized 1-3 listener scenarios for common use cases
  3. **Native Getter/Setter**: Better V8 optimization with native property descriptors
  4. **Subscribe Fast Path**: Skip unnecessary updates for simple signals

  ## 📦 Bundle Size

  - Package size: **+0.5%** (+30 bytes gzip) - essentially unchanged
  - Code: **-19%** (-102 lines) - cleaner implementation

  ## ✅ Backward Compatibility

  - **100% backward compatible** - all existing APIs still work
  - No breaking changes
  - All features preserved (computed, effect, map, deepMap, etc.)

  ## 🎯 Migration Guide

  ### Recommended (New API)

  ```typescript
  import { zen } from "@sylphx/zen";

  const count = zen(0);
  count.value++; // Cleaner!
  console.log(count.value);
  ```

  ### Still Supported (Old API)

  ```typescript
  import { zen, get, set } from "@sylphx/zen";

  const count = zen(0);
  set(count, get(count) + 1); // Still works
  console.log(get(count));
  ```

  Both APIs can be used interchangeably in the same codebase.

## 1.1.0

### Minor Changes

- **perf: 5-Phase Performance Optimization - 3.21x Performance Improvement**

  Comprehensive performance optimization achieving **221% faster** execution through systematic improvements:

  **Phase 1: Foundation Optimizations (+140%)**

  - Removed try-catch overhead from hot paths (~50ns per call saved)
  - Converted Set to Array for 2x faster iteration (6ns vs 12ns per item)
  - Implemented O(1) swap-remove pattern for efficient unsubscribe
  - Result: 1.58M → 3.80M ops/sec

  **Phase 2: Version Tracking (+4.5%)**

  - Added global version counter for computed value staleness detection
  - Skip unnecessary recalculations when source versions unchanged
  - Negligible overhead (~1-2%) with significant computation savings
  - Result: 3.80M → 3.97M ops/sec

  **Phase 3: Hot Path Inlining (+13.3%)**

  - Single-listener fast path (most common case)
  - Inlined helper functions in set() for better JIT optimization
  - Cached array lengths to reduce property lookups
  - Result: 3.97M → 4.5M ops/sec

  **Phase 4: Computed Fast Paths (+13.3%)**

  - Single-source computed optimization (most common pattern)
  - Optimized version checking for single vs multiple sources
  - Fast path for undefined checking
  - Result: 4.5M → 5.1M ops/sec

  **Phase 5: Memory Optimization (stable)**

  - Batched listeners: Set → Array for consistency
  - Pre-allocated and reused arrays in effect system
  - Cached dependency values in batched updates
  - Result: Maintained 5.1M ops/sec, reduced allocations

  **Final Results:**

  - Core performance: 4.82M ops/sec (10 subscribers, single update)
  - Computed updates: 19.5M ops/sec
  - Total improvement: **3.21x faster (221% increase)**
  - All 108 tests passing, zero regressions

- **feat: Updated README with comprehensive performance benchmarks**
  - Added detailed benchmark results and comparison table
  - Documented 5-phase optimization journey
  - Included comparisons with nanostores, zustand, valtio, effector

## 1.0.0

### Major Changes

- Initial release of @sylphx/zen
  - Tiny size: ~1.33 kB gzipped
  - Functional API: zen, computed, map, deepMap, karma, batch
  - Lifecycle events: onMount, onSet, onNotify, onStop
  - Key/Path listeners for granular updates
  - Explicit batching support
