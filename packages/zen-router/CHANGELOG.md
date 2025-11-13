# @sylph/router

## 3.0.4

### Patch Changes

- Updated dependencies [28dcea8]
  - @sylphx/zen@3.1.3
  - @sylphx/zen-patterns@2.0.0

## 3.0.3

### Patch Changes

- Updated dependencies [2d6f990]
  - @sylphx/zen@3.1.2
  - @sylphx/zen-patterns@2.0.0

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
