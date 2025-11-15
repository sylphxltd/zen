# @sylphx/zen-react

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
