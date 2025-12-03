# Glossary

## Auto-tracking
**Definition:** Automatic dependency detection without manual dependency arrays
**Usage:** `packages/rapid-signal/src/rapid.ts` - `currentListener` global
**Context:** When computed/effect executes, signal reads register as dependencies. Eliminates manual `[dep1, dep2]` arrays.

## Micro-batching
**Definition:** Automatic batching of downstream notifications during signal writes
**Usage:** `packages/rapid-signal/src/rapid.ts` - `zenProto.value` setter
**Context:** When signal updates, batches computed recalculations and effect re-runs without explicit `batch()` call. Introduced v3.48.0 for smoother effects.

## Dirty Flag
**Definition:** Boolean flag marking computed value as stale/needs recalculation
**Usage:** `packages/rapid-signal/src/rapid.ts` - `_dirty` property on computed
**Context:** Lazy invalidation—mark dirty on source change, recalculate on next read. Pull-based vs push-based updates.

## Prototype-based Creation
**Definition:** Using `Object.create(proto)` instead of class constructors
**Usage:** `signal()` and `computed()` in `packages/rapid-signal/src/rapid.ts`
**Context:** Faster allocation, smaller memory footprint. Signals created frequently, so optimization matters.

## Runtime-First Architecture
**Definition:** Framework integrations work without compiler, compiler optional for optimization
**Usage:** `packages/unplugin-rapid-signal/`
**Context:** Users can use `{signal}` in JSX with zero config. Plugin detects signals at runtime. Compiler mode available for production optimization. See ADR-001.

## Deduplication
**Definition:** Preventing duplicate subscriptions in dependency tracking
**Usage:** `zenProto.value` getter in `packages/rapid-signal/src/rapid.ts`
**Context:** Inline `for` loop checks if source already in `_sources` array. O(n) vs O(n²) `includes()` or Set overhead. Typical arrays small (1-5 items).

## Marker Node
**Definition:** Internal node wrapping reactive content for effect tracking
**Usage:** `packages/rapid-*/src/jsx-runtime.ts` - Generated when reactive functions/signals used in JSX
**Context:** When JSX encounters `{signal}` or `{() => ...}`, jsx-runtime wraps content in marker with `_type: 'marker'`. Markers track reactive dependencies and contain `children` array. Renderers must render marker children, not skip them. See commit 5d74318.

## Changesets
**Definition:** Version management system for monorepo
**Usage:** Root `package.json`, `.changeset/` directory
**Context:** All packages versioned as `0.0.0` locally. Changesets generates changelogs and bumps versions on publish.

## Descriptor Pattern
**Definition:** Two-phase JSX execution where jsx() returns lightweight descriptors for components, orchestrator executes in parent-first order
**Usage:** All platform jsx-runtimes (`packages/rapid-*/src/jsx-runtime.ts`), `@rapid/runtime/src/descriptor.ts`
**Context:** Solves JSX eager evaluation problem that breaks Context propagation. Phase 1: Create descriptors `{ _jsx: true, type, props }`. Phase 2: Execute via lazy props getter when parent accesses children. Descriptors are transient (discarded after execution), preserving fine-grained reactivity without VDOM/diffing overhead. Enables zero-config Context usage like `<Provider><Child /></Provider>`. See ADR-011.
