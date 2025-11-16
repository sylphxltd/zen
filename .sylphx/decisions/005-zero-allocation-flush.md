# 005. Zero-Allocation Flush

**Status:** ✅ Accepted
**Date:** 2025-01-21
**Version:** v3.26.0

## Context

`flushEffects()` used `pendingEffects.slice()` to copy array before processing, creating allocation on every flush.

## Decision

Replace with `pendingCount` counter and direct indexing. Set processed entries to `null` for GC.

## Rationale

- Zero allocations in hot path
- Reduced GC pressure significantly
- `pendingCount` faster than `array.length`

## Consequences

**Positive:**
- Eliminated allocations in scheduler hot path
- Reduced GC pauses
- Clearer intent with explicit `pendingCount`

**Negative:**
- Slightly more code (~5 lines)
- Must manually null out processed entries

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Implementation: `flushEffects()` in `packages/zen/src/zen.ts` lines 95-129
- Counter: `pendingCount` at line 49
- GC hint: `pendingEffects[i] = null as any` at line 122
