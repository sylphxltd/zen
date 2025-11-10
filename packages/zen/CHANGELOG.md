# @sylphx/zen

## 2.0.0

### Major Changes

- # v2.0.0 - Fully Reactive State Management with computedAsync

  Zen is now a **fully reactive state management library** with complete support for reactive async computations!

  ## 🚀 New Feature: computedAsync

  Introducing `computedAsync` - reactive async computed values that automatically re-execute when dependencies change (just like Jotai's async atoms!).

  ```typescript
  import { zen, computedAsync, subscribe, set } from "@sylphx/zen";

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

  // When dependency changes, automatically refetches!
  set(userId, 2); // ✅ Triggers automatic refetch
  ```

  ### Features

  - ✅ **Automatic dependency tracking** - Changes propagate automatically
  - ✅ **Loading/Error states** - Built-in state management
  - ✅ **Race condition protection** - Stale promises automatically ignored
  - ✅ **Multiple dependencies** - Track any number of signals
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

  ## 💥 BREAKING CHANGES

  ### Removed: karma/zenAsync

  The `karma` and `zenAsync` APIs have been removed in favor of the new `computedAsync` which provides true reactive async computation.

  **Migration Guide:**

  #### Before (v1.x - karma/zenAsync)

  ```typescript
  import { zen, karma, runKarma, get } from "@sylphx/zen";

  const fetchUser = karma(async (id: number) => fetchUserAPI(id));

  // Manual execution required
  await runKarma(fetchUser, get(userId));

  // When userId changes, must manually re-run
  set(userId, 2);
  await runKarma(fetchUser, get(userId)); // ❌ Manual!
  ```

  #### After (v2.x - computedAsync)

  ```typescript
  import { zen, computedAsync, set, subscribe } from "@sylphx/zen";

  const userId = zen(1);
  const user = computedAsync([userId], async (id) => fetchUserAPI(id));

  subscribe(user, (state) => {
    // Receives updates automatically
  });

  // Automatic re-execution!
  set(userId, 2); // ✅ Automatically refetches!
  ```

  ### Why the Change?

  1. **True Reactivity**: `computedAsync` is fully reactive - dependencies are tracked automatically
  2. **Simpler API**: No need for manual `runKarma` calls
  3. **Better DX**: Loading/error states built-in
  4. **Smaller Bundle**: Removed 460 bytes (-3.8%)

  ### What if I need manual control?

  If you need manual async execution without reactivity, use standard async/await with `effect`:

  ```typescript
  import { zen, effect, set } from "@sylphx/zen";

  const userId = zen(1);
  const userData = zen(null);

  effect([userId], async (id) => {
    const data = await fetchUser(id);
    set(userData, data);
  });
  ```

  ## 📦 Package Size

  - **ESM**: 5.78 KB gzip (was 6.01 KB, -3.8%)
  - **CJS**: 6.02 KB gzip (was 6.25 KB, -3.7%)
  - **Total reduction**: 460 bytes

  ## 🚀 Performance

  Performance remains excellent:

  - **Basic signals**: 142M ops/sec
  - **Computed chains**: 74M ops/sec
  - **Batched updates**: 2M batches/sec
  - **Reactive async**: ✅ Working perfectly

  ## 🎯 Complete Reactive System

  Zen v2.0.0 now offers a complete reactive state management solution:

  - ✅ Reactive sync computed (`computed`)
  - ✅ Reactive async computed (`computedAsync`) - **NEW!**
  - ✅ Reactive effects (`effect`)
  - ✅ Reactive maps (`map`, `deepMap`)
  - ✅ Reactive selectors (`select`)
  - ✅ Batching (`batch`)
  - ✅ Lifecycle hooks (`onMount`, `onStart`, `onStop`)

  ## 📚 Documentation

  Full documentation and examples available in:

  - `COMPUTED_ASYNC_IMPLEMENTATION.md` - Complete implementation details
  - `REACTIVE_ASYNC_ANALYSIS.md` - Feature comparison with Jotai

  ## 🙏 Upgrade Path

  This is a major version bump due to the removal of `karma`/`zenAsync`. Most users can upgrade by:

  1. Replace `karma`/`zenAsync` with `computedAsync`
  2. Update manual `runKarma` calls to reactive dependencies
  3. Enjoy automatic reactivity! 🎉

  For users who don't use `karma`/`zenAsync`, this is a non-breaking upgrade with better performance and smaller bundle size.

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
