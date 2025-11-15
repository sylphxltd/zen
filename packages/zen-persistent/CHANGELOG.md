# @sylphx/zen-persistent

## 14.0.0

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

## 13.0.0

### Patch Changes

- Updated dependencies [152c3a0]
  - @sylphx/zen@3.10.0
  - @sylphx/zen-patterns@10.0.0

## 12.0.0

### Patch Changes

- Updated dependencies [56f788d]
  - @sylphx/zen@3.9.0
  - @sylphx/zen-patterns@9.0.0

## 11.0.0

### Patch Changes

- Updated dependencies [e9cb5b9]
  - @sylphx/zen@3.8.0
  - @sylphx/zen-patterns@8.0.0

## 10.0.0

### Patch Changes

- Updated dependencies [1c36169]
  - @sylphx/zen@3.7.0
  - @sylphx/zen-patterns@7.0.0

## 9.0.0

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.5.0
  - @sylphx/zen-patterns@6.0.0

## 8.0.0

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.4.0
  - @sylphx/zen-patterns@5.0.0

## 7.0.0

### Patch Changes

- Updated dependencies
  - @sylphx/zen@3.3.0
  - @sylphx/zen-patterns@4.0.0

## 6.0.0

### Patch Changes

- Updated dependencies [7504386]
  - @sylphx/zen@3.2.0
  - @sylphx/zen-patterns@3.0.0

## 5.0.1

### Patch Changes

- Updated dependencies [b8764fe]
  - @sylphx/zen@3.1.1
  - @sylphx/zen-patterns@2.0.0

## 5.0.0

### Patch Changes

- Updated dependencies [4c23a25]
  - @sylphx/zen@3.1.0
  - @sylphx/zen-patterns@2.0.0

## 3.0.0

### Patch Changes

- Updated dependencies
  - @sylphx/zen@2.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [baf470f]
  - @sylphx/zen@1.3.0
