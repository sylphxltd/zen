# @sylphx/zen-preact

## 5.0.25

### Patch Changes

- Updated dependencies [775eaf3]
  - @sylphx/zen@3.36.0

## 5.0.24

### Patch Changes

- Updated dependencies [4959fba]
  - @sylphx/zen@3.34.0

## 5.0.23

### Patch Changes

- Updated dependencies [21e16a9]
  - @sylphx/zen@3.32.0

## 5.0.22

### Patch Changes

- Updated dependencies [4d6e079]
  - @sylphx/zen@3.30.0

## 5.0.21

### Patch Changes

- Updated dependencies [0397292]
  - @sylphx/zen@3.27.0

## 5.0.20

### Patch Changes

- Updated dependencies [d210e47]
  - @sylphx/zen@3.24.0

## 5.0.19

### Patch Changes

- Updated dependencies [ca01755]
  - @sylphx/zen@3.22.0

## 5.0.18

### Patch Changes

- Updated dependencies [8ded9d6]
  - @sylphx/zen@3.21.2

## 5.0.17

### Patch Changes

- Updated dependencies [18452cb]
  - @sylphx/zen@3.21.1

## 5.0.16

### Patch Changes

- Updated dependencies [d04d6fc]
  - @sylphx/zen@3.21.0

## 5.0.15

### Patch Changes

- Updated dependencies [0b00d81]
  - @sylphx/zen@3.20.1

## 5.0.14

### Patch Changes

- Updated dependencies [cc63522]
  - @sylphx/zen@3.20.0

## 5.0.13

### Patch Changes

- Updated dependencies [5d95eca]
  - @sylphx/zen@3.19.2

## 5.0.12

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.19.1

## 5.0.11

### Patch Changes

- Updated dependencies [41eb077]
  - @sylphx/zen@3.18.1

## 5.0.10

### Patch Changes

- Updated dependencies [870d92b]
- Updated dependencies
  - @sylphx/zen@3.18.0

## 5.0.9

### Patch Changes

- Updated dependencies [82c266d]
  - @sylphx/zen@3.17.1

## 5.0.8

### Patch Changes

- Updated dependencies [c836529]
  - @sylphx/zen@3.17.0

## 5.0.7

### Patch Changes

- Updated dependencies [28b1325]
  - @sylphx/zen@3.16.1

## 5.0.6

### Patch Changes

- Updated dependencies [6d7e1c6]
  - @sylphx/zen@3.16.0

## 5.0.5

### Patch Changes

- Updated dependencies [157d312]
  - @sylphx/zen@3.15.1

## 5.0.4

### Patch Changes

- Updated dependencies [17dca1e]
  - @sylphx/zen@3.15.0

## 5.0.3

### Patch Changes

- Updated dependencies [b69d5c3]
  - @sylphx/zen@3.14.0

## 5.0.2

### Patch Changes

- Updated dependencies [1ce0e8a]
  - @sylphx/zen@3.13.1

## 5.0.1

### Patch Changes

- 6ed0279: Fix dependency structure to prevent version inflation

  Moved internal monorepo packages from peerDependencies to dependencies using workspace:\* protocol. This prevents unnecessary major version bumps when the core zen package receives minor updates. Follows industry best practices from TanStack Query, Zustand, and Jotai.

  Changes:

  - Internal packages (@sylphx/zen, @sylphx/zen-patterns, @sylphx/zen-router) now in dependencies with workspace:\*
  - External frameworks (React, Vue, Preact, Solid, Svelte) remain in peerDependencies
  - Fixes cascading major version bumps caused by peerDependency range updates

- Updated dependencies [06c29ef]
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

## 3.0.10

### Patch Changes

- Updated dependencies [152c3a0]
  - @sylphx/zen@3.10.0

## 3.0.9

### Patch Changes

- Updated dependencies [56f788d]
  - @sylphx/zen@3.9.0

## 3.0.8

### Patch Changes

- Updated dependencies [e9cb5b9]
  - @sylphx/zen@3.8.0

## 3.0.7

### Patch Changes

- Updated dependencies [1c36169]
  - @sylphx/zen@3.7.0

## 3.0.6

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.5.0

## 3.0.5

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.4.0

## 3.0.4

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.3.0

## 3.0.3

### Patch Changes

- Updated dependencies [7504386]
  - @sylphx/zen@3.2.0

## 3.0.2

### Patch Changes

- Updated dependencies [b8764fe]
  - @sylphx/zen@3.1.1

## 3.0.1

### Patch Changes

- Updated dependencies [4c23a25]
  - @sylphx/zen@3.1.0

## 1.0.2

### Patch Changes

- Updated dependencies
  - @sylphx/zen@2.0.0

## 1.0.1

### Patch Changes

- Updated dependencies [baf470f]
  - @sylphx/zen@1.3.0
