# @sylphlab/zen-router-react

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
  - @sylphx/zen-router@4.0.0

## 3.0.10

### Patch Changes

- Updated dependencies [152c3a0]
  - @sylphx/zen@3.10.0
  - @sylphx/zen-router@3.1.1

## 3.0.9

### Patch Changes

- Updated dependencies [56f788d]
  - @sylphx/zen@3.9.0
  - @sylphx/zen-router@3.1.0

## 3.0.8

### Patch Changes

- Updated dependencies [e9cb5b9]
  - @sylphx/zen@3.8.0
  - @sylphx/zen-router@3.0.8

## 3.0.7

### Patch Changes

- Updated dependencies [1c36169]
  - @sylphx/zen@3.7.0
  - @sylphx/zen-router@3.0.7

## 3.0.6

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.5.0
  - @sylphx/zen-router@3.0.6

## 3.0.5

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.4.0
  - @sylphx/zen-router@3.0.5

## 3.0.4

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.3.0
  - @sylphx/zen-router@3.0.4

## 3.0.3

### Patch Changes

- Updated dependencies [7504386]
  - @sylphx/zen@3.2.0
  - @sylphx/zen-router@3.0.3

## 3.0.2

### Patch Changes

- Updated dependencies [b8764fe]
  - @sylphx/zen@3.1.1
  - @sylphx/zen-router@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies [4c23a25]
  - @sylphx/zen@3.1.0
  - @sylphx/zen-router@3.0.1

## 1.0.2

### Patch Changes

- Updated dependencies
  - @sylphx/zen@2.0.0
  - @sylphx/zen-router@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [baf470f]
  - @sylphx/zen@1.3.0
  - @sylphx/zen-router@1.0.1

## 0.0.2

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
  - @sylphlab/zen-router@0.1.1
