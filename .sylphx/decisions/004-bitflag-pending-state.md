# 004. Bitflag Pending State

**Status:** ✅ Accepted
**Date:** 2025-01-21
**Version:** v3.26.0

## Context

`scheduleEffect()` used `pendingEffects.includes(effect)` (O(n)) to prevent duplicate scheduling.

## Decision

Use bit 2 of `_state` as `FLAG_PENDING` for O(1) check.

## Rationale

- O(n) → O(1): Eliminates array scan
- Fanout bottleneck: +16% improvement (45.9K → 53.3K ops/sec)
- Memory cost: 3 bits per computation (negligible)

## Consequences

**Positive:**
- Massive fanout performance improvement
- Reduced CPU usage in hot scheduler path
- Enables future flag-based optimizations

**Negative:**
- More complex state management (bitwise operations)
- Must preserve flag when updating state: `_state = (_state & ~3) | STATE_DIRTY`

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Implementation: `scheduleEffect()` in `packages/zen/src/zen.ts` lines 82-93
- Flag constant: `FLAG_PENDING = 4` at line 34
- Benchmark data: `/tmp/zen-v5-final-report.md` - +16% fanout improvement
