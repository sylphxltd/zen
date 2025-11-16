# Architecture

## System Overview

Zen implements a **push-pull reactive graph** using the observer pattern with slot-based bidirectional dependency tracking. The system achieves O(1) subscription/unsubscription and minimizes memory allocations through bitflag state management and inline hot paths.

Core primitive: `Signal<T>` stores mutable state. Derived values computed via `Computation<T>`. Side effects managed by scheduler with automatic batching.

## Key Components

<!-- VERIFY: packages/zen/src/zen.ts -->
- **Signal** (`packages/zen/src/zen.ts`): Core reactive primitive, stores value + observers
- **Computation** (`packages/zen/src/zen.ts`): Lazy computed values and effects, tracks sources
- **Scheduler** (`packages/zen/src/zen.ts`): Effect queue with bitflag-based pending state
- **Observer System** (`packages/zen/src/zen.ts`): Slot-based bidirectional dependency tracking

## Design Patterns

### Pattern: Bitflag Pending State (v3.26.0)
**Why:** Eliminate O(n) includes() check when scheduling effects
**Where:** `scheduleEffect()` in `packages/zen/src/zen.ts`
**Trade-off:** +3 bits per computation vs O(1) schedule check. Worth it: +16% fanout performance.

### Pattern: Zero-Allocation Flush
**Why:** Eliminate slice() allocation in hot scheduler path
**Where:** `flushEffects()` in `packages/zen/src/zen.ts`
**Trade-off:** Slightly more complex indexing logic vs zero allocations in hot path. Worth it: reduced GC pressure.

### Pattern: Inline Critical Functions
**Why:** Eliminate function call overhead in read/write paths
**Where:** `Signal.get`, `Computation.read` in `packages/zen/src/zen.ts`
**Trade-off:** Code duplication vs +3% performance in hot paths. Worth it: read/write are most critical operations.

### Pattern: Slot-Based Dependency Tracking
**Why:** O(1) subscription removal vs O(n) array splice
**Where:** `addObserver()`, `removeObserver()` in `packages/zen/src/zen.ts`
**Trade-off:** Two parallel arrays (_observers + _observerSlots) vs O(1) removal. Worth it: critical for dynamic reactivity.

### Pattern: Auto-Batching
**Why:** Reduce scheduler overhead by batching notifications
**Where:** `Signal.set`, `batch()` in `packages/zen/src/zen.ts`
**Trade-off:** Deferred execution vs reduced flush calls. Worth it: +21.7% diamond pattern performance (see ADR-003).

## Boundaries

**In scope:**
- Signal primitives (zen, computed, effect)
- Subscription management (subscribe, unsubscribe)
- Batch updates (batch, untrack, peek)
- Memory optimization for hot paths
- TypeScript type safety

**Out of scope:**
- Framework integrations (React, Vue, Svelte) - separate packages
- Persistence/serialization - user responsibility
- DevTools - separate package
- Async reactivity - use effects with cleanup
