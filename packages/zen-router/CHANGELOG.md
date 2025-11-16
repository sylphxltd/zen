# @sylph/router

## 5.0.14

### Patch Changes

- Updated dependencies [cc63522]
  - @sylphx/zen@3.20.0
  - @sylphx/zen-patterns@12.0.14

## 5.0.13

### Patch Changes

- Updated dependencies [5d95eca]
  - @sylphx/zen@3.19.2
  - @sylphx/zen-patterns@12.0.13

## 5.0.12

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.19.1
  - @sylphx/zen-patterns@12.0.12

## 5.0.11

### Patch Changes

- Updated dependencies [41eb077]
  - @sylphx/zen@3.18.1
  - @sylphx/zen-patterns@12.0.11

## 5.0.10

### Patch Changes

- Updated dependencies [870d92b]
- Updated dependencies
  - @sylphx/zen@3.18.0
  - @sylphx/zen-patterns@12.0.10

## 5.0.9

### Patch Changes

- Updated dependencies [82c266d]
  - @sylphx/zen@3.17.1
  - @sylphx/zen-patterns@12.0.9

## 5.0.8

### Patch Changes

- Updated dependencies [c836529]
  - @sylphx/zen@3.17.0
  - @sylphx/zen-patterns@12.0.8

## 5.0.7

### Patch Changes

- Updated dependencies [28b1325]
  - @sylphx/zen@3.16.1
  - @sylphx/zen-patterns@12.0.7

## 5.0.6

### Patch Changes

- Updated dependencies [6d7e1c6]
  - @sylphx/zen@3.16.0
  - @sylphx/zen-patterns@12.0.6

## 5.0.5

### Patch Changes

- Updated dependencies [157d312]
  - @sylphx/zen@3.15.1
  - @sylphx/zen-patterns@12.0.5

## 5.0.4

### Patch Changes

- Updated dependencies [17dca1e]
  - @sylphx/zen@3.15.0
  - @sylphx/zen-patterns@12.0.4

## 5.0.3

### Patch Changes

- Updated dependencies [b69d5c3]
  - @sylphx/zen@3.14.0
  - @sylphx/zen-patterns@12.0.3

## 5.0.2

### Patch Changes

- Updated dependencies [1ce0e8a]
  - @sylphx/zen@3.13.1
  - @sylphx/zen-patterns@12.0.2

## 5.0.1

### Patch Changes

- 6ed0279: Fix dependency structure to prevent version inflation

  Moved internal monorepo packages from peerDependencies to dependencies using workspace:\* protocol. This prevents unnecessary major version bumps when the core zen package receives minor updates. Follows industry best practices from TanStack Query, Zustand, and Jotai.

  Changes:

  - Internal packages (@sylphx/zen, @sylphx/zen-patterns, @sylphx/zen-router) now in dependencies with workspace:\*
  - External frameworks (React, Vue, Preact, Solid, Svelte) remain in peerDependencies
  - Fixes cascading major version bumps caused by peerDependency range updates

- Updated dependencies [6ed0279]
- Updated dependencies [06c29ef]
  - @sylphx/zen-patterns@12.0.1
  - @sylphx/zen@3.13.0

## 5.0.0

### Patch Changes

- 6016b8f: feat(zen): topological scheduling for glitch-free reactive updates

  Major improvement to reactivity guarantees:

  **Glitch-Free Guarantees**

  - Entire dependency graph stabilizes after each signal write
  - Computeds update in topological order (level-based)
  - No temporary inconsistent states visible to observers
  - All notifications batched and flushed after stabilization

  **Before:**

  ```ts
  const a = zen(1);
  const b = computed(() => a.value * 2);
  a.value = 5;
  // b was only marked STALE, not recomputed
  ```

  **After:**

  ```ts
  const a = zen(1);
  const b = computed(() => a.value * 2);
  a.value = 5;
  // b automatically stabilized in topo order
  // Guaranteed consistent state
  ```

  **Performance:**

  - O(1) per node/edge core operations maintained
  - Topological processing only on affected subgraph
  - Version-based staleness prevents wasted recomputation

  **Compatibility:**

  - Breaking semantic change: computeds eagerly stabilize when in active graph
  - All existing code continues to work
  - Tests updated to reflect new eager stabilization behavior

- Updated dependencies [6016b8f]
  - @sylphx/zen@3.12.0
  - @sylphx/zen-patterns@12.0.0

## 4.0.0

### Patch Changes

- ce5dee7: perf(zen): slot-based O(1) listener management and optimized notifications

  Performance improvements to zen core reactivity system:

  - **O(1) unsubscribe**: Slot-based index tracking replaces linear array search
  - **O(1) batch deduplication**: FLAG_PENDING_NOTIFY prevents duplicate notifications
  - **Optimized hot paths**: Removed optional chaining from notification loops
  - **Cleaner internals**: Extracted addEffectListener() and addComputedListener()

  No breaking changes - pure internal optimization. All existing code continues to work unchanged.

- Updated dependencies [ce5dee7]
  - @sylphx/zen@3.11.0
  - @sylphx/zen-patterns@11.0.0

## 3.1.1

### Patch Changes

- Updated dependencies [152c3a0]
  - @sylphx/zen@3.10.0
  - @sylphx/zen-patterns@10.0.0

## 3.1.0

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

### Patch Changes

- Updated dependencies [56f788d]
  - @sylphx/zen@3.9.0
  - @sylphx/zen-patterns@9.0.0

## 3.0.8

### Patch Changes

- Updated dependencies [e9cb5b9]
  - @sylphx/zen@3.8.0
  - @sylphx/zen-patterns@8.0.0

## 3.0.7

### Patch Changes

- Updated dependencies [1c36169]
  - @sylphx/zen@3.7.0
  - @sylphx/zen-patterns@7.0.0

## 3.0.6

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.5.0
  - @sylphx/zen-patterns@6.0.0

## 3.0.5

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.4.0
  - @sylphx/zen-patterns@5.0.0

## 3.0.4

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.3.0
  - @sylphx/zen-patterns@4.0.0

## 3.0.3

### Patch Changes

- Updated dependencies [7504386]
  - @sylphx/zen@3.2.0
  - @sylphx/zen-patterns@3.0.0

## 3.0.2

### Patch Changes

- Updated dependencies [b8764fe]
  - @sylphx/zen@3.1.1
  - @sylphx/zen-patterns@2.0.0

## 3.0.1

### Patch Changes

- Updated dependencies [4c23a25]
  - @sylphx/zen@3.1.0
  - @sylphx/zen-patterns@2.0.0

## 1.0.2

### Patch Changes

- Updated dependencies
  - @sylphx/zen@2.0.0

## 1.0.1

### Patch Changes

- Updated dependencies [baf470f]
  - @sylphx/zen@1.3.0

## 0.1.1

### Patch Changes

- feat: Add router package with basic implementation and tests

  - Implemented core router logic (`$router` store, history handling, route matching).
  - Added React (`useRouter`) integration package with tests.
  - Added Preact (`useRouter`) integration package (tests skipped due to mocking issues).
  - Added comprehensive tests for `@sylph/router` core, achieving >90% coverage.
  - Fixed various bugs in `pathToRegexp` handling optional parameters and root path.
  - Fixed build issues related to declaration files in `@sylph/core`.
  - Updated READMEs for core and router packages with corrected examples and information.
  - Updated all `package.json` files for release readiness (license, author, publishConfig, metadata).
  - Aligned Vitest versions across packages.

- Updated dependencies
  - @sylphlab/zen-core@0.1.1

## 0.1.0

### Minor Changes

- feat: Restore core features, add docs examples, prepare for release

### Patch Changes

- f06b156: Prepare packages for potential release:
  - Completed build verification (tests, benchmarks, size checks).
  - Updated package metadata (name, author, repo links) for core and router.
  - Added basic README files for core and router.
  - Corrected size-limit configuration location and values.
- Updated dependencies
- Updated dependencies [f06b156]
  - @sylph/core@0.1.0
