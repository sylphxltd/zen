# 001. Unified Scheduler

**Status:** ✅ Accepted
**Date:** 2025-01-20
**Version:** v3.25.0

## Context

Original implementation had 3 separate queues for different effect types. Benchmark analysis revealed fanout (1→N notification) as real bottleneck, not queue management.

## Decision

Consolidate to single `pendingEffects` queue with unified `scheduleEffect()`.

## Rationale

- Simpler code: -50 lines
- Better performance: +21.7% diamond pattern (1.57M → 1.92M ops/sec)
- Easier to optimize: Single hot path vs three

## Consequences

**Positive:**
- Significant performance improvement
- Reduced code complexity
- Enables further optimizations (bitflags, zero allocations)

**Negative:**
- Lost separation between effect types (acceptable trade-off)

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Implementation: `scheduleEffect()` in `packages/zen/src/zen.ts`
- Benchmark data: `/tmp/zen-final-comprehensive-report.md` Phase 1-8
