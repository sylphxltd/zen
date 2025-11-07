# Changelog

All notable changes to Zen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-11-07

### Fixed

**Performance Regression Fix**
- Fixed 2-3.5% performance regression in simple operations (Simple Increment, Loading State Toggle, Batch Updates)
- **Root cause**: Phase 1 advanced features (lifecycle, untracked, dispose) were forcibly loaded even for basic usage
- **Solution**: Moved advanced features to opt-in subpath export `@sylphx/zen/advanced`

### Changed

**Breaking Changes (Migration Required):**
```typescript
// v1.2.0 (no longer supported)
import { dispose, onMount, untracked } from '@sylphx/zen';

// v1.2.1 (new way)
import { dispose, onMount, untracked } from '@sylphx/zen/advanced';
```

**Advanced APIs moved to subpath export:**
- `dispose(computed)` → `import from '@sylphx/zen/advanced'`
- `onStart`, `onStop`, `onMount`, `cleanup` → `import from '@sylphx/zen/advanced'`
- `untracked`, `tracked`, `isTracking` → `import from '@sylphx/zen/advanced'`
- `CleanupFn`, `LifecycleCallback` types → `import from '@sylphx/zen/advanced'`

### Performance

**Bundle Size Improvements:**
- Core bundle: **4.26 KB** gzipped (was 5.94 KB in v1.2.0) - **28% reduction!** 🎉
- Advanced bundle: **557 B** gzipped (opt-in only)
- Total when using advanced: 4.82 KB gzipped (19% smaller than v1.2.0)

**Benchmark Results (vs v1.1.1 baseline):**
- Simple Increment: **33.1M ops/sec** (restored from -3.5% regression)
- Loading State Toggle: **19.3M ops/sec** (restored from -2.8% regression)
- Batch Updates: **13.2M ops/sec** (restored from -3.3% regression)
- Reactive Async: **4.6M ops/sec** (+1.1% improvement maintained)

### Added

**New Entry Points:**
- `@sylphx/zen/advanced` - Opt-in advanced features with full TypeScript support
- Multi-entry build configuration via `bunup.config.ts`

### Documentation

**Migration Guide:**
If you're using any advanced features from v1.2.0:
1. Update imports to use `@sylphx/zen/advanced`
2. Core features (`zen`, `computed`, `get`, `set`, etc.) remain unchanged
3. 99% of users won't need to change anything

**Benefits:**
- ✅ Zero bundle cost for basic usage
- ✅ Perfect tree-shaking
- ✅ Opt-in complexity
- ✅ Performance restored to v1.1.1 levels

---

## [1.2.0] - 2025-11-07

### Added

**Phase 1 Optimizations: Memory & Developer Experience**

1. **Object Pooling** (5-15% memory reduction, 3-8% speed improvement)
   - Generic `ObjectPool<T>` class for array reuse
   - Three pre-configured pools: `sourceValuesPool` (50-200), `listenerArrayPool` (100-300), `tempArrayPool` (30-100)
   - Computed values now use pooled arrays for `_sourceValues`
   - New `dispose(computed)` function to explicitly release pooled resources
   - Performance: 10.8M ops/sec creation, 8M ops/sec with disposal

2. **Lifecycle Cleanup API** (prevents resource leaks)
   - Enhanced `onMount()`, `onStart()`, `onStop()` with cleanup return values
   - WeakMap-based cleanup storage for automatic garbage collection
   - New `cleanup(zen)` function for manual cleanup
   - Swap-remove pattern for O(1) listener removal
   - Performance: 19.5M ops/sec without cleanup, 3.2M ops/sec with cleanup (6x overhead acceptable for leak prevention)

3. **Untracked Execution** (zero performance overhead)
   - New `untracked()` utility to read reactive values without creating dependencies
   - New `tracked()` utility to re-enable dependency tracking
   - New `isTracking()` helper to check current tracking state
   - Perfect for debugging/logging inside computed values
   - Performance: 19.4M ops/sec deep nesting, ~0% overhead

### Changed

**Breaking Changes:**
- `onMount`, `onStart`, `onStop` now exported from `'./lifecycle'` instead of `'./events'`
- Cleanup functions properly called on unsubscribe

### New Exports
- `dispose(computed)` - Release pooled resources
- `cleanup(zen)` - Run all cleanups for a zen
- `untracked(fn)` - Execute without tracking dependencies
- `tracked(fn)` - Re-enable tracking
- `isTracking()` - Check current tracking state
- `CleanupFn` type
- `LifecycleCallback` type

### Documentation
- Added usage examples for untracked execution
- Added resource disposal examples
- Updated Features section highlighting Phase 1 optimizations
- Created comprehensive benchmark suite (`phase1.bench.ts`)
- Created full test coverage (`phase1.test.ts`)

### Bundle Size
- **No increase**: 5.94 KB gzipped (same as v1.1.1)
- Added significant functionality with zero bundle size cost

## [1.1.1] - 2025-11-07

### Performance

**Phase 6.1: Version Tracking Removal**
- Removed redundant `_version` field from all zen types (saves 8 bytes per node)
- Removed `_sourceVersions` tracking from computed zens
- Removed `incrementVersion()` function and global version counter
- Simplified codebase by 40+ lines of version checking logic
- Graph coloring (Phase 6) now provides all staleness detection

**Impact:**
- ✅ All 146 tests passing
- ✅ No performance regression
- ✅ 8 bytes saved per zen node
- ✅ Cleaner, more maintainable code
- ✅ Graph coloring is single source of truth

### Changed
- Removed internal `_version` property from zen nodes (non-breaking - was internal)
- Simplified `updateComputedValue()` implementation

### Documentation
- Added `PHASE6.1_COMPLETE.md` with detailed technical documentation

## [1.1.0] - 2025-11-06

### Performance

**Phase 6: Graph Coloring Algorithm**
- Implemented reactive graph coloring for computed zens (CLEAN/GREEN/RED states)
- Added lazy pull-based evaluation to avoid unnecessary recomputation
- Optimized diamond dependency handling
- 44% memory reduction vs Phase 5 (1 byte color vs 8 byte version)

**Phase 1-5: Core Optimizations** (3.21x total speedup)
- **Phase 1**: Array-based listeners (+2.4x performance)
- **Phase 2**: Version tracking for fast staleness checks (+2.8x)
- **Phase 3**: Hot path inlining and fast paths (+3.1x)
- **Phase 4**: Single-source optimizations (+3.2x)
- **Phase 5**: Minor polish (+3.21x)

**Benchmark Results:**
- Atom Creation: 45M ops/sec (1.08x faster than Jotai)
- Atom Get: 45M ops/sec (competitive with fastest)
- Atom Set: 43M ops/sec (1.51x faster than Zustand)
- Subscribe/Unsubscribe: 22M ops/sec (4.9x faster than Nanostores)

**Phase 7: Rejected**
- Evaluated bit-packing `_color` + `_dirty` into single `_flags` byte
- Rejected due to 4.3% performance regression from function call overhead
- Documented in `PHASE7_REJECTED.md`

### Documentation
- Added `PHASE6_COMPLETE.md` with comprehensive Phase 6 analysis
- Added `PHASE7_REJECTED.md` documenting rejected optimization
- Updated benchmarks with Phase 1-6 results

### Internal
- Improved hot path analysis benchmarks
- Added computed performance benchmarks
- Documented all optimization phases

## [1.0.0] - 2025-10-XX

### Added

**Core State Management**
- `zen()` - Create reactive atoms
- `computed()` - Derived state with dependency tracking
- `select()` - Optimized single-source selector (10-40% faster than computed)
- `subscribe()` - Listen to state changes
- `get()` / `set()` - Read and update values

**Object State**
- `map()` - Reactive objects with key-level subscriptions
- `setKey()` - Update specific object keys
- `listenKeys()` - Subscribe to specific keys

**Nested State**
- `deepMap()` - Deep reactive objects with path subscriptions
- `setPath()` - Update nested paths (dot notation or array)
- `listenPaths()` - Subscribe to nested paths

**Async State (Karma)**
- `karma()` - Reactive async state with caching
- `runKarma()` - Execute async function with caching
- `subscribeToKarma()` - Subscribe to async state changes
- `karmaCache` - Cache control (get, set, invalidate, stats)

**Features:**
- 36x faster cache hits (0.04ms average)
- Perfect concurrent request deduplication
- Reactive invalidation with auto re-fetch
- Auto-dispose with configurable cache/stale times
- Stale-while-revalidate support
- Per-parameter caching

**Batching**
- `batch()` - Batch multiple updates into single notification
- `batched()` - Batched computed values

**Advanced Hooks**
- `onStart()` - Called when first subscriber attaches
- `onStop()` - Called when last subscriber detaches
- `onSet()` - Called before value changes
- `onNotify()` - Called after notifications sent
- `onMount()` - Called once on store initialization

**Effect System**
- `effect()` - Reactive side effects with cleanup

**Utilities**
- `mapCreator()` - Factory functions for map stores
- `craftZen()` - Immutable updates (via @sylphx/zen-craft)

### Framework Integrations

- **@sylphx/zen-react** (216 bytes) - React 16.8+ support
- **@sylphx/zen-vue** (~200 bytes) - Vue 3+ support
- **@sylphx/zen-solid** (234 bytes) - Solid.js support
- **@sylphx/zen-svelte** (167 bytes) - Svelte 3-5 support
- **@sylphx/zen-preact** (177 bytes) - Preact 10+ support

### Performance

**Competitive Advantages:**
- 1.7-45x faster than major competitors on various operations
- 1.45 kB gzipped for complete feature set
- Zero framework dependencies
- 100% TypeScript support
- Production-ready architecture

**Benchmarks:**
- Atom creation: 18.5M ops/sec (vs Zustand 16.7M, Jotai 10.7M)
- Computed creation: 22.6M ops/sec (vs Jotai 13.7M, Nanostores 0.4M)
- DeepMap creation: 13.7M ops/sec (vs Nanostores 2.5M)
- Karma cache hits: 0.04ms (36x faster than cold fetch)

### Documentation

- Comprehensive README with examples
- API documentation
- Performance benchmarks
- Migration guides
- TypeScript examples

---

## Version History Summary

- **1.1.1** - Phase 6.1: Version tracking removal (cleaner code, same performance)
- **1.1.0** - Phase 1-6: Core optimizations (3.21x faster), graph coloring
- **1.0.0** - Initial release with full feature set

---

**Legend:**
- 🏆 Industry-leading performance
- ✅ Tested and verified
- 📦 Bundle size optimized
- 🚀 Breaking performance records
