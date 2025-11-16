# Glossary

## Bitflag Pending State
**Definition:** Using bit 2 of `_state` to track if effect is in pending queue
**Usage:** `scheduleEffect()` in `packages/zen/src/zen.ts`
**Context:** Eliminates O(n) `includes()` check, critical for fanout performance

## Diamond Pattern
**Definition:** Reactive graph where 2+ computations depend on same signal, feeding into final computation
**Usage:** Most common real-world reactivity pattern
**Context:** Primary optimization target; +23% improvement in v3.24.0→v3.26.0

## Fanout
**Definition:** 1→N notification pattern where single signal update triggers many observers
**Usage:** Stress test for scheduler efficiency
**Context:** Secondary bottleneck; +16% improvement in v3.25.0→v3.26.0

## Hot Path
**Definition:** Code executed frequently in typical usage (read, write, schedule)
**Usage:** Inline optimization targets in `packages/zen/src/zen.ts`
**Context:** Function call overhead matters; inlined in v3.26.0

## Slot-Based Tracking
**Definition:** Bidirectional dependency tracking using array indices as "slots"
**Usage:** `_observers`, `_observerSlots`, `_sources`, `_sourceSlots` arrays
**Context:** Enables O(1) subscription removal via swap-and-pop

## pendingCount
**Definition:** Integer counter tracking pending effects, faster than `array.length`
**Usage:** `scheduleEffect()`, `flushEffects()` in `packages/zen/src/zen.ts`
**Context:** Micro-optimization; avoids property access overhead
